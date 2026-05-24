// API Route: app/api/v1/shipping/webhook/amana/route.ts
// Webhook endpoint to asynchronously process tracking event callbacks from Amana.

import { NextResponse } from 'next/server';
import { updateTrackingStatus } from '@/lib/shipping/tracker';
import type { ShipmentStatus } from '@/types/shipping.types';

// Map Amana carrier status codes to internal platform status enums
function mapAmanaStatus(code: string): ShipmentStatus {
  switch (code.toLowerCase()) {
    case 'depot_receive':
      return 'picked_up';
    case 'in_transit':
      return 'in_transit';
    case 'hub_arrive':
      return 'in_transit';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    case 'delivery_failed':
      return 'failed_delivery';
    case 'returned':
      return 'returned';
    default:
      return 'in_transit';
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-amana-signature');
    if (!signature) {
      return NextResponse.json({ success: false, message: 'Missing signature verification headers.' }, { status: 401 });
    }

    // Read payload
    const body = await request.json().catch(() => ({}));
    const { tracking_number, status_code, location, details, timestamp } = body;

    if (!tracking_number || !status_code) {
      return NextResponse.json({ success: false, message: 'Invalid payload properties.' }, { status: 400 });
    }

    // Map carrier status to system status
    const platformStatus = mapAmanaStatus(status_code);

    // Process asynchronously (do not await, immediately return 200)
    (async () => {
      try {
        await updateTrackingStatus(tracking_number, {
          status: platformStatus,
          location: location || 'Amana Center',
          description: details || `Package update received from Amana carrier.`,
          timestamp: timestamp || new Date().toISOString()
        });
      } catch (err: any) {
        console.error(`🔴 Amana Webhook async processing failed for tracking ${tracking_number}:`, err.message);
      }
    })();

    // Return 200 immediately
    return NextResponse.json({
      success: true,
      data: { status: 'queued' },
      message: 'Amana tracking event webhook received and queued for async processing.'
    });
  } catch (err: any) {
    console.error('🔴 Amana Webhook ingestion error:', err);
    return NextResponse.json({ success: false, message: 'Ingestion error.' }, { status: 500 });
  }
}
