import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/db/users'

/**
 * POST /api/v1/admin/products/[id]/approve
 * Approves a product listing, transitioning it from 'draft' to public 'active' visibility.
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

    const supabase = createPublicSupabaseClient()

    // 1. Verify product listing exists
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

    // 2. Transition status to 'active'
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Write admin action audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    await writeAuditLog({
      actor_id: profile.id,
      action: 'APPROVE_PRODUCT',
      target_type: 'products',
      target_id: productId,
      metadata: { product_name: product.name, reviewer: profile.email },
      ip_address: ipAddress
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: `Product '${product.name}' has been successfully approved and published.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/products/[id]/approve error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during product approval.'
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
