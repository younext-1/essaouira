import { createClient } from '@/lib/supabase/server'
import { CommissionBreakdown, OrderFinancialSummary } from '../payments.types'
import { CheckoutSession } from '../cart-checkout.types'

/**
 * Calculate the commission fee for a product purchase.
 * Evaluates in priority: Category rule -> Store Tier rule -> Global default rule -> Fallback 10% rate.
 * Applies min/max caps from the matched rule.
 */
export async function calculateCommission(
  productId: string,
  storeId: string,
  amount: number
): Promise<CommissionBreakdown> {
  const supabase = await createClient();

  let resolvedRate = 0.10; // Fallback rate (10%)
  let minFee = 0.00;
  let maxFee: number | undefined = undefined;
  let ruleFound = false;

  try {
    // 1. Check product category
    const { data: product } = await supabase
      .from('products')
      .select('category_id, categories(name, slug)')
      .eq('id', productId)
      .maybeSingle();

    if (product?.category_id) {
      // Look up category rule in commission_rules
      const { data: categoryRule } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('category', product.category_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (categoryRule) {
        resolvedRate = Number(categoryRule.rate);
        minFee = Number(categoryRule.min_fee);
        maxFee = categoryRule.max_fee ? Number(categoryRule.max_fee) : undefined;
        ruleFound = true;
      }
    }

    // 2. Fallback to Store Subscription Tier if no category rule is matched
    if (!ruleFound) {
      const { data: subscription } = await supabase
        .from('store_subscriptions')
        .select('*, tier:store_tiers(*)')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .maybeSingle();

      const tierId = subscription?.tier?.id;
      if (tierId) {
        const { data: tierRule } = await supabase
          .from('commission_rules')
          .select('*')
          .eq('store_tier_id', tierId)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tierRule) {
          resolvedRate = Number(tierRule.rate);
          minFee = Number(tierRule.min_fee);
          maxFee = tierRule.max_fee ? Number(tierRule.max_fee) : undefined;
          ruleFound = true;
        } else if (subscription?.tier?.commission_rate) {
          // Fallback to the commission rate defined directly on the store tier
          resolvedRate = Number(subscription.tier.commission_rate) / 100; // if stored as percent (e.g. 5 for 5%)
          ruleFound = true;
        }
      }
    }

    // 3. Fallback to global platform default rule
    if (!ruleFound) {
      const { data: defaultRule } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('is_default', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (defaultRule) {
        resolvedRate = Number(defaultRule.rate);
        minFee = Number(defaultRule.min_fee);
        maxFee = defaultRule.max_fee ? Number(defaultRule.max_fee) : undefined;
        ruleFound = true;
      }
    }
  } catch (err) {
    console.error('Error during commission rule evaluation, using global fallback 10%:', err);
  }

  // Calculate base fee
  let platformFee = amount * resolvedRate;

  // Apply min caps
  if (platformFee < minFee) {
    platformFee = minFee;
  }

  // Apply max caps
  if (maxFee !== undefined && platformFee > maxFee) {
    platformFee = maxFee;
  }

  // Round to two-decimal precision (NUMERIC(10,2))
  platformFee = Math.round((platformFee + Number.EPSILON) * 100) / 100;
  const netAmount = Math.max(0, amount - platformFee);

  return {
    grossAmount: amount,
    platformFee,
    netAmount,
    rate: resolvedRate,
  };
}

/**
 * Calculate the complete financial split partition breakdown for a checkout session.
 */
export async function calculateOrderSplit(
  checkoutSession: CheckoutSession
): Promise<OrderFinancialSummary> {
  const totalSubtotal = Number(checkoutSession.subtotal);
  const totalDiscount = Number(checkoutSession.discount_amount);
  const storeSplits: OrderFinancialSummary['storeSplits'] = {};

  for (const store of checkoutSession.partitioned_stores) {
    const storeSubtotal = Number(store.subtotal);
    const storeShipping = Number(store.shippingCost);

    // Proportionate discount allocation: storeDiscount = (storeSubtotal / totalSubtotal) * totalDiscount
    const discountRatio = totalSubtotal > 0 ? storeSubtotal / totalSubtotal : 0;
    const storeDiscount = Math.round((discountRatio * totalDiscount + Number.EPSILON) * 100) / 100;

    let storePlatformFee = 0.00;

    // Calculate commission item-by-item
    for (const item of store.items) {
      const itemPrice = Number(item.price_at_add);
      const itemQty = Number(item.quantity);
      const itemAmount = itemPrice * itemQty;

      // Apply proportionate discount to the item amount for commission calculations if necessary
      const itemDiscountRatio = storeSubtotal > 0 ? itemAmount / storeSubtotal : 0;
      const itemAmountAfterDiscount = Math.max(0, itemAmount - (itemDiscountRatio * storeDiscount));

      const commission = await calculateCommission(
        item.product_id,
        item.store_id,
        itemAmountAfterDiscount
      );
      storePlatformFee += commission.platformFee;
    }

    storePlatformFee = Math.round((storePlatformFee + Number.EPSILON) * 100) / 100;

    // Gross store amount (what customer pays for this store partition)
    const storeGross = Math.max(0, storeSubtotal - storeDiscount + storeShipping);
    const storeNet = Math.max(0, storeGross - storePlatformFee);

    storeSplits[store.storeId] = {
      storeId: store.storeId,
      subtotal: storeSubtotal,
      shippingFee: storeShipping,
      discountAmount: storeDiscount,
      platformFee: storePlatformFee,
      netAmount: storeNet,
    };
  }

  return {
    parentOrderId: '', // filled when parent order is created
    subtotal: totalSubtotal,
    shippingTotal: Number(checkoutSession.shipping_total),
    discountAmount: totalDiscount,
    taxAmount: Number(checkoutSession.tax_amount),
    totalAmount: Number(checkoutSession.total_amount),
    storeSplits,
  };
}
