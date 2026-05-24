import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to:', url);
const supabaseAdmin = createClient(url, serviceKey);

async function run() {
  const clerkId = 'user_3DqetnZU62CVhvs9JLaDukuDYLm';
  console.log(`\n--- Fetching Profile for ${clerkId} ---`);
  
  const { data: profile, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (profError) {
    console.error('Error fetching profile:', profError);
    return;
  }

  console.log('Current Profile:', profile);

  console.log('\n--- Updating Profile to Artisan and Verified ---');
  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'artisan',
      is_artisan: true,
      verified: true
    })
    .eq('clerk_id', clerkId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    return;
  }

  console.log('Updated Profile:', updatedProfile);

  console.log('\n--- Checking if Store already exists ---');
  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('owner_id', profile.id)
    .maybeSingle();

  if (storeError) {
    console.error('Error checking store:', storeError);
  } else if (store) {
    console.log('Store already exists:', store);
    // If it exists, let's make sure it is active and onboarding is completed
    if (!store.is_active || !store.onboarding_completed) {
      console.log('Activating existing store...');
      const { data: updatedStore } = await supabaseAdmin
        .from('stores')
        .update({
          is_active: true,
          onboarding_completed: true
        })
        .eq('id', store.id)
        .select()
        .single();
      console.log('Activated Store:', updatedStore);
    }
  } else {
    console.log('No store exists. Creating a store for the user so they do not have to do it from scratch!');
    const { data: newStore, error: createStoreError } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'Essaouira Artisan Treasures',
        slug: 'essaouira-artisan-treasures',
        description: 'Authentic handcrafted items direct from the heart of the Essaouira Medina.',
        logo_url: 'https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300',
        banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        category: 'Wood & Thuya Crafts',
        location: 'Essaouira Medina',
        owner_id: profile.id,
        is_active: true,
        onboarding_completed: true
      })
      .select()
      .single();

    if (createStoreError) {
      console.error('Error creating store:', createStoreError);
    } else {
      console.log('Created Store:', newStore);
      
      // Seed some demo products for this store
      console.log('\n--- Seeding Demo Products for the new Store ---');
      const { data: newProducts, error: prodError } = await supabaseAdmin
        .from('products')
        .insert([
          {
            store_id: newStore.id,
            name: 'Handcrafted Thuya Wood Jewelry Box',
            slug: 'handcrafted-thuya-wood-jewelry-box-demo',
            description: 'Beautifully polished authentic Thuya wood box with secret lock mechanism, crafted by Medina master artisans.',
            price: 450,
            images: ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600'],
            stock: 12,
            type: 'physical',
            status: 'active',
            is_featured: true
          },
          {
            store_id: newStore.id,
            name: 'Premium Pure Cosmetic Argan Oil',
            slug: 'premium-pure-cosmetic-argan-oil-demo',
            description: '100% organic, cold-pressed cosmetic Argan oil for face, hair, and nails, ethically sourced from local cooperatives.',
            price: 180,
            images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],
            stock: 25,
            type: 'physical',
            status: 'active',
            is_featured: true
          }
        ])
        .select();

      if (prodError) {
        console.error('Error seeding products:', prodError);
      } else {
        console.log('Successfully seeded products:', newProducts.length);
      }
    }
  }
}

run();
