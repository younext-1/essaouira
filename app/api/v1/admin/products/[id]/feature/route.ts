import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/db/users'

const featureSchema = z.object({
  is_featured: z.boolean()
})

/**
 * POST /api/v1/admin/products/[id]/feature
 * Toggles the featured state of a product listing.
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

    // 1. Parse is_featured state
    const body = await request.json()
    const parseResult = featureSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid request parameter payload.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { is_featured } = parseResult.data
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

    // 3. Update products featured toggle
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        is_featured,
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
      action: is_featured ? 'FEATURE_PRODUCT' : 'UNFEATURE_PRODUCT',
      target_type: 'products',
      target_id: productId,
      metadata: { product_name: product.name, reviewer: profile.email },
      ip_address: ipAddress
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: `Product '${product.name}' was successfully ${is_featured ? 'marked as featured' : 'removed from featured products'}.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/products/[id]/feature error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while toggling featured status.'
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
