// API Route: app/api/v1/admin/shipping/carriers/[id]/route.ts
// Handles admin update of a specific carrier configuration.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid Carrier ID format.')
});

const carrierUpdateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['local', 'national', 'international']).optional(),
  logo_url: z.string().url('Invalid logo URL format.').optional().nullable(),
  tracking_url_template: z.string().optional(),
  api_endpoint: z.string().url('Invalid API endpoint URL.').optional().nullable(),
  api_key_encrypted: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  estimated_days_min: z.number().int().min(0).optional(),
  estimated_days_max: z.number().int().min(0).optional()
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedId = '';
  try {
    const resolvedParams = await params;
    resolvedId = resolvedParams.id;
    await verifyAdminAccess();
    const adminClient = await createAdminClient();

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

    const { id } = parsedParams.data;
    const body = await request.json().catch(() => ({}));
    const parsedBody = carrierUpdateSchema.safeParse(body);

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

    const updates = parsedBody.data;

    const { data: updatedCarrier, error } = await adminClient
      .from('carrier_configs')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updatedCarrier,
      message: 'Carrier configuration updated successfully.'
    });
  } catch (err: any) {
    console.error(`🔴 PATCH /api/v1/admin/shipping/carriers/${resolvedId || 'unknown'} error:`, err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'Failed to update carrier configuration.'
      },
      { status: err.message?.includes('Forbidden') ? 403 : err.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
