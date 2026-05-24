// API Route: app/api/v1/shipping/track/[trackingNumber]/route.ts
// Retrieves tracking timeline for a specific courier tracking number.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getShipmentByTracking, getShipmentByOrder } from '@/lib/db/shipping';
import { getShipmentStatus } from '@/lib/shipping/tracker';

const paramsSchema = z.object({
  trackingNumber: z.string().min(2, 'Tracking number is required.')
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingNumber: string }> }
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

    const { trackingNumber } = parsed.data;

    // 1. Fetch shipment details
    const shipment = await getShipmentByTracking(trackingNumber);
    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `No active shipment found with tracking number '${trackingNumber}'.`
        },
        { status: 404 }
      );
    }

    // 2. Compile tracking timeline
    const timelineData = await getShipmentStatus(shipment.child_order_id);

    return NextResponse.json({
      success: true,
      data: timelineData,
      message: 'Tracking details fetched successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/shipping/track error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch tracking details.'
      },
      { status: 500 }
    );
  }
}
