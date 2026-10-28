import { NextRequest, NextResponse } from 'next/server';
import { validateCommerceKey } from '@/lib/commerce/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { image_base64, filename } = body;

    if (!image_base64) {
      return NextResponse.json({ error: 'Missing image_base64' }, { status: 400 });
    }

    // Clean base64 string
    const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fileExt = filename ? filename.split('.').pop() : 'jpg';
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const filePath = `product_wa_${timestamp}_${uniqueId}.${fileExt}`;

    const supabase = createAdminClient();

    // Upload to 'products' bucket
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload image', details: uploadError }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error('Commerce Upload API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
