// API Route: app/api/v1/orders/[orderId]/shipment/route.ts
// Retrieves shipment details for a specific child order.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getShipmentByOrder } from '@/lib/db/shipping';

const paramsSchema = z.object({
  orderId: z.string().uuid('Invalid Order ID format.')
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const parsed = paramsSchema.safeParse(resolvedParams);
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

    const { orderId: childOrderId } = parsed.data;

    // 1. Fetch shipment
    const shipment = await getShipmentByOrder(childOrderId);
    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `No shipment associated with order ID '${childOrderId}'.`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shipment,
      message: 'Order shipment details retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/orders/[orderId]/shipment error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch order shipment details.'
      },
      { status: 500 }
    );
  }
}
