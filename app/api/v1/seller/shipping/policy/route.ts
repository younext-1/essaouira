// API Route: app/api/v1/seller/shipping/policy/route.ts
// Handles seller retrieval and modification of their shipping policy.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getStoreShippingPolicy, updateStoreShippingPolicy } from '@/lib/db/shipping';

const coordsSchema = z.object({
  x: z.number(),
  y: z.number()
});

const policyUpdateSchema = z.object({
  offers_local_pickup: z.boolean().optional(),
  local_pickup_address: z.string().optional().nullable(),
  local_pickup_coords: coordsSchema.optional().nullable(),
  local_pickup_fee: z.number().min(0).optional(),
  local_pickup_instructions: z.string().optional().nullable(),
  offers_national: z.boolean().optional(),
  offers_international: z.boolean().optional(),
  free_shipping_threshold_mad: z.number().min(0).optional().nullable(),
  handling_time_days: z.number().int().min(0).optional(),
  ships_from_city: z.string().min(2).optional(),
  ships_from_coords: coordsSchema.optional().nullable(),
  return_policy: z.string().optional().nullable()
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

  // Fetch the profile linked to the Clerk ID
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_id', user.id)
    .single();

  if (profErr || !profile) {
    throw new Error('Seller profile not found.');
  }

  // Fetch the store owned by the profile
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('id, name')
    .eq('owner_id', profile.id)
    .single();

  if (storeErr || !store) {
    throw new Error('Artisan store not registered for this account.');
  }

  return store;
}

export async function GET() {
  try {
    const store = await resolveSellerStore();
    const policy = await getStoreShippingPolicy(store.id);

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Store shipping policy retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/shipping/policy error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to retrieve shipping policy.'
      },
      { status: err.message?.includes('Unauthorized') ? 401 : 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const store = await resolveSellerStore();
    const body = await request.json().catch(() => ({}));
    const parsed = policyUpdateSchema.safeParse(body);

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

    const updatedPolicy = await updateStoreShippingPolicy(store.id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
      message: 'Shipping policy updated successfully.'
    });
  } catch (err: any) {
    console.error('🔴 PUT /api/v1/seller/shipping/policy error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to update shipping policy.'
      },
      { status: err.message?.includes('Unauthorized') ? 401 : 400 }
    );
  }
}
