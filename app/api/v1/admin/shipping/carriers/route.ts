// API Route: app/api/v1/admin/shipping/carriers/route.ts
// Handles admin retrieval and creation of active shipping carrier configurations.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const carrierCreateSchema = z.object({
  name: z.string().min(2, 'Carrier name must be provided.'),
  code: z.string().min(2, 'Unique carrier code is required (e.g. amana, dhl).'),
  type: z.enum(['local', 'national', 'international']),
  logo_url: z.string().url('Invalid logo URL format.').optional().nullable(),
  tracking_url_template: z.string().min(10, 'Tracking URL template must be provided (e.g. https://.../track?num={tracking_number}).'),
  api_endpoint: z.string().url('Invalid API endpoint URL.').optional().nullable(),
  api_key_encrypted: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  estimated_days_min: z.number().int().min(0, 'Minimum estimated days cannot be negative.'),
  estimated_days_max: z.number().int().min(0, 'Maximum estimated days cannot be negative.')
});

/**
 * Validates that the logged-in user carries the 'admin' or 'moderator' role.
 */
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

    const { data: carriers, error } = await supabase
      .from('carrier_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: carriers,
      message: 'Carrier configurations retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/shipping/carriers error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to fetch carrier configs.'
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
    const parsed = carrierCreateSchema.safeParse(body);

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

    const { data: newCarrier, error } = await adminClient
      .from('carrier_configs')
      .insert({
        name: input.name,
        code: input.code.toLowerCase().trim(),
        type: input.type,
        logo_url: input.logo_url || null,
        tracking_url_template: input.tracking_url_template,
        api_endpoint: input.api_endpoint || null,
        api_key_encrypted: input.api_key_encrypted || null,
        is_active: input.is_active !== undefined ? input.is_active : true,
        estimated_days_min: input.estimated_days_min,
        estimated_days_max: input.estimated_days_max
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newCarrier,
      message: 'New shipping carrier registered successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/shipping/carriers error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to register shipping carrier.'
      },
      { status: err.message?.includes('Forbidden') ? 403 : err.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
