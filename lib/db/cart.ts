import { createClient } from '@/lib/supabase/server'
import type { Cart, CartItem, FullCartItem } from '../cart-checkout.types'
import type { Product, ProductVariant } from '../database.types'

/**
 * Fetches cart along with all detailed cart items (with product and variant relationships).
 */
export async function getCartWithItems(cartId: string): Promise<{ cart: Cart; items: FullCartItem[] } | null> {
  const supabase = await createClient()

  // 1. Fetch Cart
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('id', cartId)
    .maybeSingle()

  if (cartError || !cartData) return null

  // 2. Fetch Items with Products and Variants joined
  const { data: itemsData, error: itemsError } = await supabase
    .from('cart_items')
    .select('*, product:products(*), variant:product_variants(*)')
    .eq('cart_id', cartId)

  if (itemsError) throw itemsError

  return {
    cart: cartData as Cart,
    items: (itemsData as unknown as FullCartItem[]) ?? []
  }
}

/**
 * Fetches active cart for a specific buyer.
 */
export async function getCartByBuyer(buyerId: string): Promise<Cart | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) return null
  return data as Cart
}

/**
 * Fetches active cart for a guest user using guest_token.
 */
export async function getCartByGuestToken(token: string): Promise<Cart | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('guest_token', token)
    .eq('status', 'active')
    .maybeSingle()

  if (error) return null
  return data as Cart
}

/**
 * Creates a new active cart session for buyer or guest.
 */
export async function createCart(buyerId?: string | null, guestToken?: string | null): Promise<Cart> {
  const supabase = await createClient()

  const insertData: any = {
    status: 'active',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  }

  if (buyerId) {
    insertData.buyer_id = buyerId
  } else if (guestToken) {
    insertData.guest_token = guestToken
  }

  const { data, error } = await supabase
    .from('carts')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return data as Cart
}

/**
 * Adds an item to the cart or increments its quantity if it already exists.
 */
export async function addCartItem(
  cartId: string,
  item: Omit<CartItem, 'id' | 'cart_id' | 'added_at'>
): Promise<CartItem> {
  const supabase = await createClient()

  // Check if identical product/variant is already in the cart
  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('product_id', item.product_id)

  if (item.variant_id) {
    query = query.eq('variant_id', item.variant_id)
  } else {
    query = query.is('variant_id', null)
  }

  const { data: existingItem, error: fetchError } = await query.maybeSingle()

  if (fetchError) throw fetchError

  if (existingItem) {
    // Increment quantity
    const newQty = existingItem.quantity + item.quantity
    const { data: updated, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existingItem.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated as CartItem
  } else {
    // Insert new item
    const { data: inserted, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price_at_add: item.price_at_add,
        store_id: item.store_id
      })
      .select()
      .single()

    if (insertError) throw insertError
    return inserted as CartItem
  }
}

/**
 * Updates a cart item's quantity or deletes it if quantity <= 0.
 */
export async function updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CartItem | null> {
  const supabase = await createClient()

  if (quantity <= 0) {
    await removeCartItem(cartId, itemId)
    return null
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .select()
    .single()

  if (error) throw error
  return data as CartItem
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItem(cartId: string, itemId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cartId)

  if (error) throw error
  return true
}

/**
 * Merges a guest cart into a buyer cart upon authentication.
 * Handles duplicate items by summing their quantities.
 */
export async function mergeGuestCart(guestToken: string, buyerId: string): Promise<Cart | null> {
  const supabase = await createClient()

  // 1. Get active guest cart
  const guestCart = await getCartByGuestToken(guestToken)
  if (!guestCart) return null

  const guestCartDetails = await getCartWithItems(guestCart.id)
  if (!guestCartDetails || guestCartDetails.items.length === 0) {
    // No items to merge, mark as merged and exit
    await supabase.from('carts').update({ status: 'merged' }).eq('id', guestCart.id)
    return getCartByBuyer(buyerId)
  }

  // 2. Get or create buyer cart
  let buyerCart = await getCartByBuyer(buyerId)
  if (!buyerCart) {
    buyerCart = await createCart(buyerId, null)
  }

  // 3. Sequentially add items to buyer cart
  for (const item of guestCartDetails.items) {
    await addCartItem(buyerCart.id, {
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price_at_add: item.price_at_add,
      store_id: item.store_id
    })
  }

  // 4. Mark guest cart as merged
  const { error: mergeError } = await supabase
    .from('carts')
    .update({ status: 'merged' })
    .eq('id', guestCart.id)

  if (mergeError) throw mergeError

  return buyerCart
}
