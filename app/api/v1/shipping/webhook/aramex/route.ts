// API Route: app/api/v1/shipping/webhook/aramex/route.ts
// Webhook endpoint to asynchronously process tracking event callbacks from Aramex.

import { NextResponse } from 'next/server';
import { updateTrackingStatus } from '@/lib/shipping/tracker';
import type { ShipmentStatus } from '@/types/shipping.types';

// Map Aramex carrier status codes to internal platform status enums
function mapAramexStatus(code: string): ShipmentStatus {
  switch (code.toUpperCase()) {
    case 'SH001': // Picked up by Aramex
      return 'picked_up';
    case 'SH005': // In transit
    case 'SH014': // Departed origin facility
    case 'SH022': // Arrived destination facility
      return 'in_transit';
    case 'SH012': // Out with courier for delivery
      return 'out_for_delivery';
    case 'SH006': // Delivered successfully
      return 'delivered';
    case 'SH007': // Delivery failed / Awaiting customer pickup
      return 'failed_delivery';
    case 'SH008': // Returned to Shipper
      return 'returned';
    default:
      return 'in_transit';
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-aramex-signature');
    if (!signature) {
      return NextResponse.json({ success: false, message: 'Missing signature verification headers.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { trackingNumber, aramexStatusCode, currentLocation, aramexDetails, eventDateTime } = body;

    if (!trackingNumber || !aramexStatusCode) {
      return NextResponse.json({ success: false, message: 'Invalid payload properties.' }, { status: 400 });
    }

    const platformStatus = mapAramexStatus(aramexStatusCode);

    // Process asynchronously (do not await, immediately return 200)
    (async () => {
      try {
        await updateTrackingStatus(trackingNumber, {
          status: platformStatus,
          location: currentLocation || 'Aramex Terminal',
          description: aramexDetails || `Package status update received from Aramex global shipping network.`,
          timestamp: eventDateTime || new Date().toISOString()
        });
      } catch (err: any) {
        console.error(`🔴 Aramex Webhook async processing failed for tracking ${trackingNumber}:`, err.message);
      }
    })();

    // Return 200 immediately
    return NextResponse.json({
      success: true,
      data: { status: 'queued' },
      message: 'Aramex tracking event webhook received and queued for async processing.'
    });
  } catch (err: any) {
    console.error('🔴 Aramex Webhook ingestion error:', err);
    return NextResponse.json({ success: false, message: 'Ingestion error.' }, { status: 500 });
  }
}
