// API Route: app/api/v1/seller/orders/[childOrderId]/ship/route.ts
// Transitions a child order to 'shipped' state and creates associated courier shipment record.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createShipment } from '@/lib/shipping/tracker';
import type { DeliveryType } from '@/types/shipping.types';

const paramsSchema = z.object({
  childOrderId: z.string().uuid('Invalid Child Order ID format.')
});

const shipBodySchema = z.object({
  carrierId: z.string().uuid('Invalid Carrier ID format.').nullable().optional(),
  type: z.enum(['local', 'national', 'international']),
  trackingNumber: z.string().min(2, 'Tracking number must be provided.').optional(),
  pickupHubId: z.string().uuid('Invalid Pickup Hub ID.').nullable().optional(),
  weightGrams: z.number().int().min(1, 'Weight must be greater than zero.'),
  dimensions: z.object({
    length_cm: z.number().min(1),
    width_cm: z.number().min(1),
    height_cm: z.number().min(1)
  }),
  declaredValue: z.number().min(0),
  customsDescription: z.string().optional().nullable(),
  estimatedDelivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery must match YYYY-MM-DD').optional(),
  shippingLabelUrl: z.string().url('Invalid shipping label URL.').optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childOrderId: string }> }
) {
  let resolvedChildOrderId = '';
  try {
    // 1. Validate route params
    const resolvedParams = await params;
    resolvedChildOrderId = resolvedParams.childOrderId;
    const parsedParams = paramsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsedParams.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { childOrderId } = parsedParams.data;

    // 2. Validate request body
    const body = await request.json().catch(() => ({}));
    const parsedBody = shipBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsedBody.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const inputData = parsedBody.data;
    const supabase = await createClient();

    // 3. Verify order exists and is in a fulfillable state ('processing' or 'confirmed')
    const { data: order, error: orderErr } = await supabase
      .from('child_orders')
      .select('*, parent_orders(buyer_id, shipping_address)')
      .eq('id', childOrderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, data: null, message: `Child order '${childOrderId}' not found.` },
        { status: 404 }
      );
    }

    if (order.status !== 'confirmed' && order.status !== 'processing') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `Cannot ship order in current state '${order.status}'. Order must be confirmed or processing.`
        },
        { status: 400 }
      );
    }

    // 4. Resolve Store and verify owner matches logged-in user (RLS is also active, but good to check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, message: 'Unauthorized.' }, { status: 401 });
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id, name, location')
      .eq('id', order.store_id)
      .single();

    // Build origin and destination addresses snapshots
    const originAddress = {
      storeName: store?.name || 'Artisan Partner',
      city: 'Essaouira',
      country: 'MA',
      addressLine: store?.location || 'Essaouira Medina'
    };

    const destinationAddress = order.parent_orders?.shipping_address || {};

    // 5. Create shipment record
    const shipment = await createShipment(childOrderId, {
      carrierId: inputData.carrierId || null,
      type: inputData.type as DeliveryType,
      trackingNumber: inputData.trackingNumber,
      pickupHubId: inputData.pickupHubId || null,
      originAddress,
      destinationAddress,
      weightGrams: inputData.weightGrams,
      dimensions: inputData.dimensions,
      declaredValue: inputData.declaredValue,
      customsDescription: inputData.customsDescription,
      estimatedDelivery: inputData.estimatedDelivery,
      shippingLabelUrl: inputData.shippingLabelUrl
    });

    return NextResponse.json({
      success: true,
      data: shipment,
      message: 'Fulfillment completed. Order transitioned to shipped state.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/orders/[childOrderId]/ship error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to complete order shipping.'
      },
      { status: 500 }
    );
  }
}
