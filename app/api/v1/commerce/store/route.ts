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

    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id);

    // Get order count
    const { count: orderCount } = await supabase
      .from('child_orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id);

    return NextResponse.json({
      success: true,
      store,
      stats: {
        product_count: productCount || 0,
        order_count: orderCount || 0,
        total_sales: store.total_sales || 0,
        rating: store.rating || 0
      }
    });

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
    const { phone, name, description, logo_url, category } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (category !== undefined) updates.category = category;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: updatedStore, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', store.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update store', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, store: updatedStore });

  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
