import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { createOrdersFromPayment } from './order-factory'
import { updateTransactionStatus, getTransactionByGatewayId, logFinancialMutation } from '../db/payments'
import { getCheckoutSession, updateCheckoutStatus } from '../db/checkout'

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key_123';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_webhook_secret_123';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-11-preview' as any, // use compatible version
});

// Initialize Redis client if environment variables are present
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error('Failed to initialize Upstash Redis:', err);
  }
}

/**
 * Fetch dynamic exchange rate (MAD to targetCurrency, or targetCurrency to MAD).
 * Caches results in Redis for 1 hour, falls back to standard marketplace ratios if API fails.
 */
export async function getExchangeRate(from: string, to: string = 'MAD'): Promise<number> {
  if (from.toUpperCase() === to.toUpperCase()) return 1.00;

  const cacheKey = `exchange_rate:${from.toUpperCase()}:${to.toUpperCase()}`;
  
  if (redis) {
    try {
      const cached = await redis.get<string | number>(cacheKey);
      if (cached) return Number(cached);
    } catch (err) {
      console.warn('Redis read error for exchange rates:', err);
    }
  }

  const defaultRates: Record<string, number> = {
    'USD_MAD': 10.00,
    'EUR_MAD': 11.00,
    'MAD_USD': 0.10,
    'MAD_EUR': 0.09,
  };

  const pair = `${from.toUpperCase()}_${to.toUpperCase()}`;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`, {
      next: { revalidate: 3600 }
    });
    if (res.ok) {
      const data = await res.json();
      const rate = data.rates[to.toUpperCase()];
      if (rate) {
        const numRate = Number(rate);
        if (redis) {
          try {
            await redis.set(cacheKey, numRate, { ex: 3600 });
          } catch (redisErr) {
            console.error('Redis write error for exchange rates:', redisErr);
          }
        }
        return numRate;
      }
    }
  } catch (err) {
    console.warn(`Live exchange rate lookup failed for ${pair}. Using standard fallback.`, err);
  }

  return defaultRates[pair] ?? 1.00;
}

/**
 * Create Stripe PaymentIntent for a checkout session.
 * Handles conversion to foreign currency (USD or EUR) if requested, else default primary currency MAD.
 */
export async function createPaymentIntent(
  checkoutId: string,
  amount: number,
  currency: string = 'MAD',
  buyerId: string
) {
  const targetCurrency = currency.toLowerCase();
  
  // Calculate exchange rate and amount in foreign currency
  const exchangeRate = await getExchangeRate('MAD', currency.toUpperCase());
  const convertedAmount = amount * exchangeRate;
  
  // Stripe requires smallest currency units (cents for USD/EUR, or zero-decimal)
  // For MAD (Moroccan Dirham), Stripe does NOT natively support MAD. So we MUST convert to USD/EUR for payment
  let stripeCurrency = targetCurrency;
  let finalStripeAmount = Math.round(convertedAmount * 100); // in cents

  // Force conversion to USD if currency is MAD (since Stripe doesn't support MAD processing directly)
  let actualExchange = exchangeRate;
  if (targetCurrency === 'mad') {
    stripeCurrency = 'usd';
    const rateToUsd = await getExchangeRate('MAD', 'USD');
    actualExchange = rateToUsd;
    finalStripeAmount = Math.round(amount * rateToUsd * 100);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalStripeAmount,
    currency: stripeCurrency,
    metadata: {
      checkoutId,
      buyerId,
      originalAmountMad: amount.toString(),
      exchangeRateApplied: actualExchange.toString(),
    },
  });

  // Store payment_intent_id in checkout_session
  const supabase = await createClient();
  await supabase
    .from('checkout_sessions')
    .update({ payment_intent_id: paymentIntent.id, updated_at: new Date().toISOString() })
    .eq('id', checkoutId);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: finalStripeAmount / 100,
    currency: stripeCurrency,
  };
}

/**
 * Verify payment status with Stripe manually.
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amountReceived: paymentIntent.amount_received / 100,
    currency: paymentIntent.currency,
  };
}

/**
 * Issue a refund via Stripe and update databases status.
 */
export async function createRefund(
  transactionId: string,
  amount: number, // in MAD
  reason: string
) {
  const supabase = await createClient();

  // Retrieve transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txError || !transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.gateway_transaction_id) {
    throw new Error('No gateway transaction ID found');
  }

  // Calculate Stripe refund amount in the processing currency (e.g. USD)
  const stripeRefundAmount = Math.round(amount * Number(transaction.exchange_rate) * 100);

  // Issue Stripe refund
  const refund = await stripe.refunds.create({
    payment_intent: transaction.gateway_transaction_id,
    amount: stripeRefundAmount,
    reason: 'requested_by_customer',
    metadata: {
      transactionId,
      refundReason: reason,
      amountMad: amount.toString(),
    },
  });

  // Update transaction status
  await updateTransactionStatus(transactionId, 'refunded', refund as any);

  // Update related escrow ledgers
  await supabase
    .from('escrow_ledgers')
    .update({
      status: 'refunded',
      released_at: new Date().toISOString(),
      release_trigger: 'admin_manual',
      hold_reason: `Refund processed: ${reason}`,
    })
    .eq('transaction_id', transactionId);

  // If a child order is related, update status
  if (transaction.parent_order_id) {
    await supabase
      .from('child_orders')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('parent_order_id', transaction.parent_order_id);
  }

  return {
    refundId: refund.id,
    status: refund.status,
    amountRefundedMad: amount,
  };
}

/**
 * Handle incoming Stripe Webhook events.
 */
export async function handleStripeWebhook(payload: string, signature: string) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`Stripe: Payment Intent succeeded for ${pi.id}`);
      
      // Trigger order creation atomically
      await createOrdersFromPayment(pi.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.error(`Stripe: Payment Intent failed for ${pi.id}`);

      // Release inventory locks
      const checkoutId = pi.metadata.checkoutId;
      if (checkoutId) {
        // Update checkout session status
        await updateCheckoutStatus(checkoutId, 'payment_failed');

        // RPC release_stock
        await supabase.rpc('release_stock', { p_checkout_id: checkoutId });

        await logFinancialMutation({
          actor_id: null,
          action: 'STRIPE_PAYMENT_FAILED_STOCKS_RELEASED',
          target_type: 'checkout_sessions',
          target_id: checkoutId,
          metadata: { paymentIntentId: pi.id, error: pi.last_payment_error?.message },
        });
      }
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      console.warn(`Stripe: Charge dispute created for ${dispute.id}`);

      // Retrieve transaction
      const gatewayTxId = dispute.payment_intent as string;
      if (gatewayTxId) {
        const transaction = await getTransactionByGatewayId(gatewayTxId);
        if (transaction) {
          // Update transaction status
          await updateTransactionStatus(transaction.id, 'disputed', dispute as any);

          // Freeze related escrow ledgers
          const { data: escrows } = await supabase
            .from('escrow_ledgers')
            .update({
              status: 'disputed',
              dispute_opened_at: new Date().toISOString(),
              hold_reason: `Stripe Dispute Created: ${dispute.reason}`,
            })
            .eq('transaction_id', transaction.id)
            .select('*');

          // Freeze related child orders
          if (escrows) {
            for (const escrow of escrows) {
              await supabase
                .from('child_orders')
                .update({ status: 'disputed', updated_at: new Date().toISOString() })
                .eq('id', escrow.child_order_id);
            }
          }
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log(`Stripe: Charge refunded for ${charge.id}`);

      const gatewayTxId = charge.payment_intent as string;
      if (gatewayTxId) {
        const transaction = await getTransactionByGatewayId(gatewayTxId);
        if (transaction) {
          await updateTransactionStatus(transaction.id, 'refunded', charge as any);

          // Update related escrow ledgers
          await supabase
            .from('escrow_ledgers')
            .update({
              status: 'refunded',
              released_at: new Date().toISOString(),
              release_trigger: 'admin_manual',
              hold_reason: 'Stripe external refund completed.',
            })
            .eq('transaction_id', transaction.id);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }

  return { received: true };
}
