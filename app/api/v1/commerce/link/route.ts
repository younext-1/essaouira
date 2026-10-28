import { NextRequest, NextResponse } from 'next/server';
import { validateCommerceKey } from '@/lib/commerce/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/phone';

export async function POST(req: NextRequest) {
  try {
    if (!validateCommerceKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, agent_name, agent_description } = body;

    if (!phone || !agent_name) {
      return NextResponse.json({ error: 'Missing required fields: phone, agent_name' }, { status: 400 });
    }

    // Normalize phone securely
    const normalizedPhone = normalizePhone(phone);
    
    const supabase = createAdminClient();

    // Check if profile exists with this phone
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, clerk_id, username')
      .eq('phone', normalizedPhone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is not found
      return NextResponse.json({ error: 'Database error checking profile', details: profileError }, { status: 500 });
    }

    let profileId;

    if (!profile) {
      // Create a new profile
      const clerk_id = `wa_phone_${normalizedPhone.replace(/\D/g, '')}`;
      const username = `user_${normalizedPhone.replace(/\D/g, '')}`;

      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          clerk_id,
          phone: normalizedPhone,
          username,
          full_name: agent_name,
          role: 'artisan',
          is_artisan: true,
          verified: true,
          whatsapp: normalizedPhone
        })
        .select()
        .single();

      if (createProfileError) {
        return NextResponse.json({ error: 'Failed to create profile', details: createProfileError }, { status: 500 });
      }
      profileId = newProfile.id;
    } else {
      profileId = profile.id;
    }

    // Check if profile has a store
    let { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, slug')
      .eq('owner_id', profileId)
      .single();

    if (storeError && storeError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error checking store', details: storeError }, { status: 500 });
    }

    let storeId;
    let storeSlug;

    if (!store) {
      // Create store
      const baseSlug = agent_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedSlug = `${baseSlug}-${uniqueSuffix}`;

      const { data: newStore, error: createStoreError } = await supabase
        .from('stores')
        .insert({
          owner_id: profileId,
          name: agent_name,
          slug: generatedSlug,
          description: agent_description || '',
          phone: normalizedPhone,
          whatsapp: normalizedPhone,
          is_active: true,
          is_verified: true
        })
        .select()
        .single();

      if (createStoreError) {
        return NextResponse.json({ error: 'Failed to create store', details: createStoreError }, { status: 500 });
      }
      storeId = newStore.id;
      storeSlug = newStore.slug;
    } else {
      storeId = store.id;
      storeSlug = store.slug;
    }

    const storeUrl = `https://essaouira.com/store/${storeSlug}`;

    return NextResponse.json({
      success: true,
      store_id: storeId,
      store_slug: storeSlug,
      store_url: storeUrl,
      profile_id: profileId
    });

  } catch (error) {
    console.error('Commerce API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
