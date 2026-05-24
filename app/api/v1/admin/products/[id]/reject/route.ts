import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/db/users'

const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters long.')
})

/**
 * POST /api/v1/admin/products/[id]/reject
 * Rejects a product listing. Requires a reason in request body, writes to audit logs.
 * Restricted to administrators and moderators.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Parse rejection reason
    const body = await request.json()
    const parseResult = rejectSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid rejection request parameters.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { reason } = parseResult.data
    const supabase = createPublicSupabaseClient()

    // 2. Fetch the target product
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()

    if (findError || !product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product listing not found.' },
        { status: 404 }
      )
    }

    // 3. Mark the product status back to 'draft' or a custom rejected status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'draft',
        metadata: {
          ...product.metadata,
          moderation_status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: profile.id
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) throw updateError

    // 4. Write admin action audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    await writeAuditLog({
      actor_id: profile.id,
      action: 'REJECT_PRODUCT',
      target_type: 'products',
      target_id: productId,
      metadata: { product_name: product.name, reason, reviewer: profile.email },
      ip_address: ipAddress
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: `Product '${product.name}' was rejected with reason: '${reason}'.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/products/[id]/reject error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during product rejection.'
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
