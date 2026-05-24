// API Route: app/api/v1/shipping/pickup-hubs/route.ts
// Returns list of active partner pickup hubs, with optional city filtering.

import { NextResponse } from 'next/server';
import { getPickupHubs } from '@/lib/db/shipping';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || undefined;

    const hubs = await getPickupHubs(city);

    return NextResponse.json({
      success: true,
      data: hubs,
      message: 'Active pickup hubs retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/shipping/pickup-hubs error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch pickup hubs.'
      },
      { status: 500 }
    );
  }
}
