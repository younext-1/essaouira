import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug } from '@/lib/db/products'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

/**
 * DELETE /api/v1/seller/products/[id]/slots/[slotId]
 * Deletes a specific experience booking slot from the experience calendar.
 * Slot is only deletable if it does not have any bookings (booked_count = 0).
 */
export const DELETE = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id
    const slotId = resolvedParams?.slotId

    if (!productId || !slotId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Both Product ID and Slot ID parameters are required.' },
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

    const supabase = createPublicSupabaseClient()

    // 4. Fetch the target slot
    const { data: slot, error: slotError } = await supabase
      .from('experience_slots')
      .select('*')
      .eq('id', slotId)
      .eq('product_id', product.id)
      .maybeSingle()

    if (slotError || !slot) {
      return NextResponse.json(
        { success: false, data: null, message: 'Booking slot not found on this experience listing.' },
        { status: 404 }
      )
    }

    // 5. Block deletion if bookings exist
    if (slot.booked_count && slot.booked_count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          data: null, 
          message: 'Deletions blocked. Cannot delete an experience slot that has active tourist bookings.' 
        },
        { status: 400 }
      )
    }

    // 6. Delete the slot
    const { error: deleteError } = await supabase
      .from('experience_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      data: { id: slotId },
      message: 'Booking slot deleted successfully.'
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/seller/products/[id]/slots/[slotId] error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while deleting the booking slot.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
