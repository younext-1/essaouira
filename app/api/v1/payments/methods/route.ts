import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

const methodSchema = z.object({
  stripePaymentMethodId: z.string(),
  type: z.enum(['card', 'bank_transfer', 'cod']),
  last4: z.string().length(4).optional(),
  brand: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const supabase = await createClient();
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error

    return NextResponse.json({ success: true, paymentMethods: methods });
  } catch (err: any) {
    console.error('Error in GET /api/v1/payments/methods:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = methodSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed request body', details: parsed.error.format() }, { status: 400 })
    }

    const { stripePaymentMethodId, type, last4, brand, isDefault } = parsed.data
    const supabase = await createClient();

    // If setting as default, unset others first
    if (isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('buyer_id', profile.id);
    }

    const { data: newMethod, error } = await supabase
      .from('payment_methods')
      .insert({
        buyer_id: profile.id,
        stripe_payment_method_id: stripePaymentMethodId,
        type,
        last4: last4 || null,
        brand: brand || null,
        is_default: isDefault,
      })
      .select('*')
      .single();

    if (error) throw error

    return NextResponse.json({ success: true, paymentMethod: newMethod }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/v1/payments/methods:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
  }
}
