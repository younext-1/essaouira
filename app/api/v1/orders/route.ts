import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getOrdersByBuyer } from '@/lib/db/orders'
import { z } from 'zod'
import { OrderStatus } from '@/types/orders.types'
import { createAdminClient } from '@/lib/supabase/admin'

const querySchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'refund_requested',
    'refunded'
  ]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => Number(val ?? 10), z.number().int().min(1).max(100).default(10)),
});

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.format()
      }, { status: 400 });
    }

    const validatedQuery = validation.data;

    const { orders, totalCount } = await getOrdersByBuyer(
      profile.id,
      {
        status: validatedQuery.status as OrderStatus | undefined,
        date_from: validatedQuery.date_from,
        date_to: validatedQuery.date_to
      },
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    );

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching buyer orders:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Connect with admin privilege to bypass RLS safely
    const supabaseAdmin = createAdminClient();

    // 1. Resolve user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ success: false, message: 'Buyer profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { items, shippingAddress, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No items in order payload' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.phone) {
      return NextResponse.json({ success: false, message: 'Incomplete shipping address' }, { status: 400 });
    }

    // Group items by storeId (multi-vendor)
    const storesItems: Record<string, any[]> = {};
    items.forEach((item) => {
      if (!storesItems[item.storeId]) {
        storesItems[item.storeId] = [];
      }
      storesItems[item.storeId].push(item);
    });

    const totalAmountAllStores = items.reduce(
      (sum, item) => sum + item.priceAtPurchase * item.quantity,
      0
    );

    // Create Parent Order with bypass RLS admin client
    const { data: parentOrder, error: parentError } = await supabaseAdmin
      .from('parent_orders')
      .insert({
        buyer_id: profile.id,
        total_amount: totalAmountAllStores,
        shipping_address: {
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.addressLine1,
          city: shippingAddress.city,
          country: shippingAddress.country || 'Morocco',
          zip: shippingAddress.zip || '',
          phone: shippingAddress.phone
        },
        currency: 'MAD',
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (parentError || !parentOrder) {
      console.error('Failed to create parent order via admin:', parentError);
      return NextResponse.json({ success: false, message: parentError?.message || 'Failed to create parent order' }, { status: 500 });
    }

    const placedOrders: any[] = [];

    // Create Child Order and Order Items for each store
    for (const [storeId, storeItems] of Object.entries(storesItems)) {
      const subtotal = storeItems.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      // Insert Child Order with bypass RLS admin client
      const { data: childOrder, error: childError } = await supabaseAdmin
        .from('child_orders')
        .insert({
          parent_id: parentOrder.id,
          store_id: storeId,
          status: 'pending',
          subtotal,
          shipping_cost: 0.00, // standard domestic cod
          platform_fee: Math.round(subtotal * 0.05 * 100) / 100, // 5% fee
          seller_earnings: Math.round(subtotal * 0.95 * 100) / 100,
        })
        .select()
        .single();

      if (childError || !childOrder) {
        console.error('Failed to create child order via admin:', childError);
        return NextResponse.json({ success: false, message: childError?.message || 'Failed to create child order' }, { status: 500 });
      }

      // Insert Order Items with bypass RLS admin client
      const orderItemsToInsert = storeItems.map((item) => ({
        child_order_id: childOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.priceAtPurchase,
        total_price: item.priceAtPurchase * item.quantity,
        selected_options: item.variant || null,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error('Failed to insert order items via admin:', itemsError);
        return NextResponse.json({ success: false, message: itemsError.message }, { status: 500 });
      }

      placedOrders.push(childOrder);
    }

    // Server-side: Clear active cart items to prevent cart sync issues
    const { data: cartData } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('buyer_id', profile.id)
      .eq('status', 'active')
      .maybeSingle();

    if (cartData) {
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('cart_id', cartData.id);
    }

    return NextResponse.json({
      success: true,
      data: placedOrders
    });

  } catch (error: any) {
    console.error('Error placing order via secure API:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

