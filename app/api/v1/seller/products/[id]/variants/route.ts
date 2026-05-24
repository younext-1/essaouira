import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug } from '@/lib/db/products'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

// Validation schema for creating/updating a product variant
const variantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Variant name (e.g. Color) is required'),
  options: z.array(
    z.object({
      name: z.string().min(1),
      price_modifier: z.number().default(0),
      stock: z.number().int().min(0).default(0)
    })
  ).default([]),
  sku: z.string().min(1, 'SKU identifier is required'),
  price_override: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
})

/**
 * POST /api/v1/seller/products/[id]/variants
 * Adds or updates an option variant specification for a product listing.
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

    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Fetch product details
    const product = await getProductBySlug(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found.' },
        { status: 404 }
      )
    }

    // 3. Enforce product ownership
    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    // 4. Parse body payload
    const body = await request.json()
    const parseResult = variantSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed for product variant.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const input = parseResult.data
    const supabase = createPublicSupabaseClient()

    // 5. Upsert variant record
    const variantData = {
      product_id: product.id,
      name: input.name,
      sku: input.sku,
      price_override: input.price_override || null,
      stock: input.stock,
      images: input.images,
      options: input.options,
      is_active: input.is_active,
      ...(input.id ? { id: input.id } : {})
    }

    const { data: upsertedVariant, error: variantError } = await supabase
      .from('product_variants')
      .upsert(variantData, { onConflict: 'sku' })
      .select()
      .single()

    if (variantError) throw variantError

    // 6. Keep matching inventory stock row in sync
    const { error: invError } = await supabase
      .from('product_inventory')
      .upsert({
        product_id: product.id,
        variant_id: upsertedVariant.id,
        quantity: input.stock,
        reserved: 0
      }, { onConflict: 'product_id,variant_id' })

    if (invError) throw invError

    return NextResponse.json({
      success: true,
      data: upsertedVariant,
      message: `Variant '${upsertedVariant.name}' registered and inventory synced successfully.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/products/[id]/variants error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while adding/updating product variants.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
