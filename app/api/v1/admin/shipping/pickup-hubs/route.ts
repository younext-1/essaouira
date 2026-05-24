// API Route: app/api/v1/admin/shipping/pickup-hubs/route.ts
// Handles admin retrieval and creation of partner pickup hubs.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const coordsSchema = z.object({
  x: z.number(),
  y: z.number()
});

const hubCreateSchema = z.object({
  name: z.string().min(2, 'Pickup hub name must be provided.'),
  address: z.string().min(5, 'Detailed physical address is required.'),
  coords: coordsSchema,
  city: z.string().min(2).default('Essaouira'),
  contact_phone: z.string().optional().nullable(),
  working_hours: z.object({
    weekdays: z.string(),
    saturday: z.string(),
    sunday: z.string()
  }).optional(),
  max_storage_days: z.number().int().min(1).default(7),
  is_active: z.boolean().optional(),
  partner_store_id: z.string().uuid().optional().nullable()
});

async function verifyAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    throw new Error('Forbidden. Administrative privileges required.');
  }
}

export async function GET() {
  try {
    await verifyAdminAccess();
    const supabase = await createClient();

    const { data: hubs, error } = await supabase
      .from('pickup_hubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: hubs,
      message: 'Pickup hubs list retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/shipping/pickup-hubs error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch pickup hubs.'
      },
      { status: err.message?.includes('Forbidden') ? 403 : err.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdminAccess();
    const adminClient = await createAdminClient();

    const body = await request.json().catch(() => ({}));
    const parsed = hubCreateSchema.safeParse(body);

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

    const input = parsed.data;
    const { x, y } = input.coords;

    // Convert coords to PostGIS point format
    const pointString = `SRID=4326;POINT(${x} ${y})`;

    const { data: newHub, error } = await adminClient
      .from('pickup_hubs')
      .insert({
        name: input.name,
        address: input.address,
        coords: pointString,
        city: input.city,
        contact_phone: input.contact_phone || null,
        working_hours: input.working_hours || { weekdays: '09:00-18:00', saturday: '09:00-13:00', sunday: 'closed' },
        max_storage_days: input.max_storage_days,
        is_active: input.is_active !== undefined ? input.is_active : true,
        partner_store_id: input.partner_store_id || null
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newHub,
      message: 'Partner pickup hub registered successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/shipping/pickup-hubs error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to register pickup hub.'
      },
      { status: err.message?.includes('Forbidden') ? 403 : err.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
