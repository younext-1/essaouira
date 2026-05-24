// API Route: app/api/v1/seller/shipping/rates/route.ts
// Handles seller retrieval and configuration of zone shipping rates.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getStoreShippingRates, upsertShippingRate } from '@/lib/db/shipping';

const weightTierSchema = z.object({
  max_weight_g: z.number().int().min(1, 'Max weight must be greater than zero.'),
  fee: z.number().min(0, 'Fee cannot be negative.')
});

const rateUpsertSchema = z.object({
  zone_id: z.string().uuid('Invalid Zone ID format.'),
  carrier_id: z.string().uuid('Invalid Carrier ID format.').nullable().optional(),
  rate_type: z.enum(['flat', 'weight_based', 'free']),
  flat_fee: z.number().min(0).nullable().optional(),
  weight_tiers: z.array(weightTierSchema).nullable().optional(),
  min_order_mad: z.number().min(0).optional(),
  max_order_mad: z.number().min(0).nullable().optional(),
  is_active: z.boolean().optional()
});

/**
 * Resolves the authenticated store for the logged-in seller.
 */
async function resolveSellerStore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized access. Please login first.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', user.id)
    .single();

  if (!profile) {
    throw new Error('Seller profile not found.');
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', profile.id)
    .single();

  if (!store) {
    throw new Error('Artisan store not registered for this account.');
  }

  return store;
}

export async function GET() {
  try {
    const store = await resolveSellerStore();
    const rates = await getStoreShippingRates(store.id);

    return NextResponse.json({
      success: true,
      data: rates,
      message: 'Store shipping rates retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/shipping/rates error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to retrieve shipping rates.'
      },
      { status: err.message?.includes('Unauthorized') ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const store = await resolveSellerStore();
    const body = await request.json().catch(() => ({}));
    const parsed = rateUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { zone_id, ...rateData } = parsed.data;

    // Build complete input payload matching type requirements
    const payload: any = {
      carrier_id: rateData.carrier_id || null,
      rate_type: rateData.rate_type,
      flat_fee: rateData.flat_fee || null,
      weight_tiers: rateData.weight_tiers || null,
      min_order_mad: rateData.min_order_mad !== undefined ? rateData.min_order_mad : 0,
      max_order_mad: rateData.max_order_mad || null,
      is_active: rateData.is_active !== undefined ? rateData.is_active : true
    };

    const upsertedRate = await upsertShippingRate(store.id, zone_id, payload);

    return NextResponse.json({
      success: true,
      data: upsertedRate,
      message: 'Shipping rate configured successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/shipping/rates error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to upsert shipping rate.'
      },
      { status: err.message?.includes('Unauthorized') ? 401 : 400 }
    );
  }
}
