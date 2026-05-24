import { createClient } from '@/lib/supabase/server'
import type { Cart, CartSummary, FullCartItem, StoreCartSummary } from '../cart-checkout.types'
import {
  getCartWithItems,
  getCartByBuyer,
  getCartByGuestToken,
  createCart,
  addCartItem,
  updateCartItem as dbUpdateCartItem,
  removeCartItem,
  mergeGuestCart as dbMergeGuestCart
} from '../db/cart'
import { validateCoupon } from '../checkout/coupon-validator'

/**
 * Returns an active cart for an authenticated buyer or guest token.
 * Creates a new one if no active session is found.
 */
export async function getOrCreateCart(buyerId?: string | null, guestToken?: string | null): Promise<Cart> {
  if (buyerId) {
    const cart = await getCartByBuyer(buyerId)
    if (cart) return cart
    return createCart(buyerId, null)
  }

  if (guestToken) {
    const cart = await getCartByGuestToken(guestToken)
    if (cart) return cart
    return createCart(null, guestToken)
  }

  throw new Error('Invalid authentication: either buyerId or guestToken must be provided.')
}

/**
 * Adds an item to the cart after validating active catalog status and inventory limits.
 */
export async function addToCart(
  cartId: string,
  productId: string,
  variantId: string | null = null,
  quantity: number
): Promise<{ cart: Cart; itemCount: number }> {
  const supabase = await createClient()

  // 1. Validate Product is Active
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('status', 'active')
    .maybeSingle()

  if (prodError || !product) {
    throw new Error('Product not found or is currently inactive.')
  }

  // 2. Validate Variant (if specified)
  let variant = null
  let price = Number(product.price)

  if (variantId) {
    const { data: varData, error: varError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle()

    if (varError || !varData) {
      throw new Error('Variant not found or is currently inactive.')
    }
    variant = varData
    if (varData.price_override !== null) {
      price = Number(varData.price_override)
    }
  }

  // 3. Query inventory stock (quantity - reserved = available)
  const { data: inventory, error: invError } = await supabase
    .from('product_inventory')
    .select('*')
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .maybeSingle()

  if (invError || !inventory) {
    throw new Error('Inventory details not found for this product/variant.')
  }

  // Check existing cart items to see if we already have some quantity in the cart
  const { data: existingCartItem } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .maybeSingle()

  const currentCartQty = existingCartItem ? existingCartItem.quantity : 0
  const requestedTotalQty = currentCartQty + quantity
  const availableStock = inventory.quantity - inventory.reserved

  if (availableStock < requestedTotalQty) {
    throw new Error(`Insufficient stock available. Requested ${requestedTotalQty}, available: ${availableStock}.`)
  }

  // 4. Add or increment item in DB
  await addCartItem(cartId, {
    product_id: productId,
    variant_id: variantId,
    quantity,
    price_at_add: price,
    store_id: product.store_id
  })

  // 5. Get refreshed totals and item count
  const updatedCartDetails = await getCartWithItems(cartId)
  const itemCount = updatedCartDetails?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return {
    cart: updatedCartDetails!.cart,
    itemCount
  }
}

/**
 * Updates a cart item's quantity with stock checks.
 */
export async function updateCart(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<{ cart: Cart; items: FullCartItem[] }> {
  const supabase = await createClient()

  if (quantity <= 0) {
    await removeCartItem(cartId, itemId)
    const refreshed = await getCartWithItems(cartId)
    return { cart: refreshed!.cart, items: refreshed!.items }
  }

  // 1. Fetch Cart Item details
  const { data: cartItem, error: itemError } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .maybeSingle()

  if (itemError || !cartItem) {
    throw new Error('Cart item not found.')
  }

  // 2. Fetch price snapshot from product or variant
  let freshPrice = Number(cartItem.product.price)
  if (cartItem.variant_id) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', cartItem.variant_id)
      .maybeSingle()
    if (variant && variant.price_override !== null) {
      freshPrice = Number(variant.price_override)
    }
  }

  // 3. Query inventory stock
  const { data: inventory } = await supabase
    .from('product_inventory')
    .select('*')
    .eq('product_id', cartItem.product_id)
    .eq('variant_id', cartItem.variant_id)
    .maybeSingle()

  if (!inventory) {
    throw new Error('Inventory details not found for this product/variant.')
  }

  const availableStock = inventory.quantity - inventory.reserved
  if (availableStock < quantity) {
    throw new Error(`Insufficient stock available. Requested ${quantity}, available: ${availableStock}.`)
  }

  // 4. Update quantity and fresh price snapshot
  const { error: updateError } = await supabase
    .from('cart_items')
    .update({
      quantity,
      price_at_add: freshPrice
    })
    .eq('id', itemId)

  if (updateError) throw updateError

  const refreshed = await getCartWithItems(cartId)
  return { cart: refreshed!.cart, items: refreshed!.items }
}

/**
 * Removes an item from the cart.
 */
export async function removeFromCart(cartId: string, itemId: string): Promise<{ cart: Cart; itemCount: number }> {
  await removeCartItem(cartId, itemId)

  const refreshed = await getCartWithItems(cartId)
  const itemCount = refreshed?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return {
    cart: refreshed!.cart,
    itemCount
  }
}

/**
 * Clears all items and resets applied coupons from the cart.
 */
export async function clearCart(cartId: string): Promise<Cart> {
  const supabase = await createClient()

  // 1. Delete all cart items
  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)

  if (deleteError) throw deleteError

  // 2. Clear coupons/discounts
  const { data: updatedCart, error: updateError } = await supabase
    .from('carts')
    .update({
      coupon_code: null,
      discount_amount: 0.00,
      updated_at: new Date().toISOString()
    })
    .eq('id', cartId)
    .select()
    .single()

  if (updateError) throw updateError
  return updatedCart as Cart
}

/**
 * Merges a guest cart session into a buyer cart session.
 */
export async function mergeGuestCart(guestToken: string, buyerId: string): Promise<Cart | null> {
  return dbMergeGuestCart(guestToken, buyerId)
}

/**
 * Generates an exhaustive server-side Cart Summary.
 * Groups items by store, calculates subtotal, applied discount, and estimated total.
 */
export async function getCartSummary(cartId: string): Promise<CartSummary | null> {
  const supabase = await createClient()
  const cartDetails = await getCartWithItems(cartId)
  if (!cartDetails) return null

  const { cart, items } = cartDetails

  // 1. Group items by store_id
  const storeGroups: Record<string, { storeName: string; items: FullCartItem[] }> = {}

  for (const item of items) {
    const storeId = item.store_id
    if (!storeGroups[storeId]) {
      // Fetch store name
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .maybeSingle()

      storeGroups[storeId] = {
        storeName: store?.name || 'Artisan Partner Store',
        items: []
      }
    }
    storeGroups[storeId].items.push(item)
  }

  // 2. Map groups into StoreCartSummary partitions
  const stores: StoreCartSummary[] = []
  let subtotal = 0
  let itemCount = 0

  for (const [storeId, group] of Object.entries(storeGroups)) {
    let storeSubtotal = 0

    for (const item of group.items) {
      const itemPrice = item.variant?.price_override !== undefined && item.variant.price_override !== null
        ? Number(item.variant.price_override)
        : Number(item.product.price)

      storeSubtotal += itemPrice * item.quantity
      itemCount += item.quantity
    }

    subtotal += storeSubtotal

    // Default shipping estimate of 0 MAD inside simple cart view
    // Shipping calculation occurs dynamically in Checkout / Shipping APIs
    stores.push({
      storeId,
      storeName: group.storeName,
      items: group.items,
      subtotal: Math.round(storeSubtotal * 100) / 100,
      shippingCost: 0.00,
      storeTotal: Math.round(storeSubtotal * 100) / 100
    })
  }

  // 3. Recalculate and re-apply coupon if present
  let discountAmount = 0.00
  if (cart.coupon_code) {
    const couponVal = await validateCoupon(cart.coupon_code, cartId, cart.buyer_id)
    if (couponVal.valid) {
      discountAmount = couponVal.discountAmount
      
      // Update cart record with valid discount
      await supabase
        .from('carts')
        .update({ discount_amount: discountAmount })
        .eq('id', cartId)
    } else {
      // Reset invalid/expired coupon
      await supabase
        .from('carts')
        .update({ coupon_code: null, discount_amount: 0.00 })
        .eq('id', cartId)
      cart.coupon_code = null
    }
  }

  // Cap discount at subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal
  }

  const taxAmount = 0.00 // Assuming tax inclusive in product prices, or 0.00 for platform fees
  const shippingTotal = 0.00
  const totalAmount = Math.max(0, subtotal + shippingTotal - discountAmount)

  return {
    cartId: cart.id,
    stores,
    subtotal: Math.round(subtotal * 100) / 100,
    shippingTotal: 0.00,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: 0.00,
    totalAmount: Math.round(totalAmount * 100) / 100,
    itemCount,
    couponCode: cart.coupon_code
  }
}
