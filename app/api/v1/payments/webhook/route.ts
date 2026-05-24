import { NextResponse } from 'next/server'
import { handleStripeWebhook } from '@/lib/payments/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Read the raw text body directly for signature verification
    const payload = await request.text();

    const result = await handleStripeWebhook(payload, signature);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error handling Stripe Webhook:', err.message);
    return NextResponse.json({ error: 'Webhook Handler Failed', message: err.message }, { status: 400 })
  }
}
