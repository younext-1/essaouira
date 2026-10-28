import { NextRequest, NextResponse } from 'next/server';
import { validateCommerceKey } from '@/lib/commerce/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/phone';

async function getStoreByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  const supabase = createAdminClient();
  
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .single();
    
  if (!profile) return null;
  
  // Get store
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
      return NextResponse.json({ error: 'Store not found for this phone' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, products });
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
    const { phone, name, name_ar, description, description_ar, price, images, stock, type, tags } = body;

    if (!phone || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields: phone, name, price' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found for this phone' }, { status: 404 });
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const supabase = createAdminClient();
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        name,
        name_ar,
        slug,
        description,
        description_ar,
        price,
        images: images || [],
        stock: stock !== undefined ? stock : 1,
        type: type || 'physical',
        status: 'active',
        tags: tags || []
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create product', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
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
    const { phone, product_id, ...updates } = body;

    if (!phone || !product_id) {
      return NextResponse.json({ error: 'Missing required fields: phone, product_id' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found for this phone' }, { status: 404 });
    }

    const supabase = createAdminClient();
    
    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, store_id')
      .eq('id', product_id)
      .single();

    if (!existingProduct || existingProduct.store_id !== store.id) {
      return NextResponse.json({ error: 'Product not found or not owned by this store' }, { status: 404 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', product_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update product', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, product_id } = body;

    if (!phone || !product_id) {
      return NextResponse.json({ error: 'Missing required fields: phone, product_id' }, { status: 400 });
    }

    const store = await getStoreByPhone(phone);
    if (!store) {
      return NextResponse.json({ error: 'Store not found for this phone' }, { status: 404 });
    }

    const supabase = createAdminClient();
    
    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, store_id')
      .eq('id', product_id)
      .single();

    if (!existingProduct || existingProduct.store_id !== store.id) {
      return NextResponse.json({ error: 'Product not found or not owned by this store' }, { status: 404 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete product', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
