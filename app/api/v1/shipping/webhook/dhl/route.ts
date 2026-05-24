// API Route: app/api/v1/shipping/webhook/dhl/route.ts
// Webhook endpoint to asynchronously process tracking event callbacks from DHL.

import { NextResponse } from 'next/server';
import { updateTrackingStatus } from '@/lib/shipping/tracker';
import type { ShipmentStatus } from '@/types/shipping.types';

// Map DHL carrier status codes to internal platform status enums
function mapDhlStatus(code: string): ShipmentStatus {
  switch (code.toUpperCase()) {
    case 'PU': // Picked Up
      return 'picked_up';
    case 'TR': // Transit
      return 'in_transit';
    case 'DF': // Departure from Facility
      return 'in_transit';
    case 'AR': // Arrival at Facility
      return 'in_transit';
    case 'WC': // With Courier / Out for Delivery
      return 'out_for_delivery';
    case 'OK': // Delivered
      return 'delivered';
    case 'FD': // Failed Delivery
      return 'failed_delivery';
    case 'RT': // Returned
      return 'returned';
    default:
      return 'in_transit';
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-dhl-signature');
    if (!signature) {
      return NextResponse.json({ success: false, message: 'Missing signature verification headers.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { shipmentNumber, statusCode, statusLocation, statusDescription, timestamp } = body;

    if (!shipmentNumber || !statusCode) {
      return NextResponse.json({ success: false, message: 'Invalid payload properties.' }, { status: 400 });
    }

    const platformStatus = mapDhlStatus(statusCode);

    // Process asynchronously (do not await, immediately return 200)
    (async () => {
      try {
        await updateTrackingStatus(shipmentNumber, {
          status: platformStatus,
          location: statusLocation || 'DHL Facility',
          description: statusDescription || `Package status update received from DHL global network.`,
          timestamp: timestamp || new Date().toISOString()
        });
      } catch (err: any) {
        console.error(`🔴 DHL Webhook async processing failed for tracking ${shipmentNumber}:`, err.message);
      }
    })();

    // Return 200 immediately
    return NextResponse.json({
      success: true,
      data: { status: 'queued' },
      message: 'DHL tracking event webhook received and queued for async processing.'
    });
  } catch (err: any) {
    console.error('🔴 DHL Webhook ingestion error:', err);
    return NextResponse.json({ success: false, message: 'Ingestion error.' }, { status: 500 });
  }
}
