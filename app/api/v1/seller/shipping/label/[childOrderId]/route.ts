// API Route: app/api/v1/seller/shipping/label/[childOrderId]/route.ts
// Retrieves the printable shipping label PDF URL for a child order.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getShipmentByOrder } from '@/lib/db/shipping';

const paramsSchema = z.object({
  childOrderId: z.string().uuid('Invalid Child Order ID format.')
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childOrderId: string }> }
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

    const { childOrderId } = parsed.data;

    // 1. Fetch shipment
    const shipment = await getShipmentByOrder(childOrderId);
    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `No active shipment found for order ID '${childOrderId}'.`
        },
        { status: 404 }
      );
    }

    if (!shipment.shipping_label_url) {
      // Provision a default mock label generator link if no explicit PDF exists
      const fallbackLabelUrl = `https://platform-shipping-service.com/labels/generate?id=${shipment.id}`;
      return NextResponse.json({
        success: true,
        data: { labelUrl: fallbackLabelUrl },
        message: 'Generated fallback shipping label URL.'
      });
    }

    return NextResponse.json({
      success: true,
      data: { labelUrl: shipment.shipping_label_url },
      message: 'Printable shipping label retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/shipping/label error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to retrieve shipping label.'
      },
      { status: 500 }
    );
  }
}
