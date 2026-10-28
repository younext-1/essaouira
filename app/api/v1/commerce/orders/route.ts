import { NextRequest, NextResponse } from 'next/server';
import { validateCommerceKey } from '@/lib/commerce/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/phone';

async function getStoreByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  const supabase = createAdminClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .single();
    
  if (!profile) return null;
  
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', profile.id)
    .single();
    
  return store || null;
}

export async function GET(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    const { data: orders, error } = await supabase
      .from('child_orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders });

  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, order_id, status, tracking_number } = body;

    if (!phone || !order_id || !status) {
      return NextResponse.json({ error: 'Missing required fields: phone, order_id, status' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: existingOrder } = await supabase
      .from('child_orders')
      .select('id, store_id')
      .eq('id', order_id)
      .single();

    if (!existingOrder || existingOrder.store_id !== store.id) {
      return NextResponse.json({ error: 'Order not found or not owned by this store' }, { status: 404 });
    }

    const updates: any = { status };
    if (tracking_number !== undefined) {
      updates.tracking_number = tracking_number;
    }

    const { data: order, error } = await supabase
      .from('child_orders')
      .update(updates)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update order', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, customer_name, customer_phone, city, address, items, total_amount } = body;

    if (!phone || !customer_name || !customer_phone || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Stock validation & auto decrement check
    for (const item of items) {
      if (item.product_id) {
        const { data: dbProduct } = await supabase
          .from('products')
          .select('id, name, stock, status')
          .eq('id', item.product_id)
          .single();

        if (dbProduct) {
          const orderQty = item.quantity || 1;
          if (dbProduct.stock !== undefined && dbProduct.stock !== null && dbProduct.stock < orderQty) {
            return NextResponse.json({
              error: `المنتج "${dbProduct.name}" غير متوفر بالكمية الكافية فالمخزون حالياً (المتبقي: ${dbProduct.stock})`,
              out_of_stock: true
            }, { status: 400 });
          }

          if (dbProduct.stock !== undefined && dbProduct.stock !== null) {
            const updatedStock = Math.max(0, dbProduct.stock - orderQty);
            const updatedStatus = updatedStock === 0 ? 'sold_out' : dbProduct.status;

            await supabase
              .from('products')
              .update({ stock: updatedStock, status: updatedStatus })
              .eq('id', dbProduct.id);
          }
        }
      }
    }

    const shippingAddress = {
      customer_name,
      customer_phone,
      city: city || '',
      address: address || '',
    };

    // 1. Create parent_order
    const { data: parentOrder, error: parentError } = await supabase
      .from('parent_orders')
      .insert({
        total_amount: total_amount || 0,
        shipping_address: shippingAddress,
        currency: 'MAD',
        status: 'pending',
        notes: 'طلب مؤكد عبر WhatsApp AI Bot (الدفع عند الاستلام COD)'
      })
      .select()
      .single();

    if (parentError) {
      return NextResponse.json({ error: 'Failed to create parent order', details: parentError }, { status: 500 });
    }

    // 2. Create child_order for seller's store
    const { data: childOrder, error: childError } = await supabase
      .from('child_orders')
      .insert({
        parent_id: parentOrder.id,
        store_id: store.id,
        status: 'confirmed',
        subtotal: total_amount || 0,
        seller_earnings: total_amount || 0,
        seller_notes: `اسم العميل: ${customer_name} | المدينة: ${city || ''} | العنوان: ${address || ''} | الهاتف: ${customer_phone}`
      })
      .select()
      .single();

    if (childError) {
      return NextResponse.json({ error: 'Failed to create child order', details: childError }, { status: 500 });
    }

    // 3. Create order_items
    const orderItemsToInsert = items.map((item: any) => ({
      child_order_id: childOrder.id,
      product_id: item.product_id || null,
      product_snapshot: { name: item.name, price: item.price },
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      total_price: (item.price || 0) * (item.quantity || 1)
    }));

    await supabase.from('order_items').insert(orderItemsToInsert);

    // Update store total_sales
    await supabase
      .from('stores')
      .update({ total_sales: (store.total_sales || 0) + 1 })
      .eq('id', store.id);

    return NextResponse.json({
      success: true,
      order_id: childOrder.id,
      order: childOrder,
      receipt_text: `🧾 *وصل الطلب (Bon de Commande)*\n\n👤 *العميل:* ${customer_name}\n📞 *الهاتف:* ${customer_phone}\n📍 *المدينة/العنوان:* ${city} - ${address}\n💰 *المبلغ الإجمالي:* ${total_amount} درهم\n🚚 *طريقة الدفع:* الدفع عند الاستلام (COD)`
    });

  } catch (error) {
    console.error('Commerce Order POST API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
