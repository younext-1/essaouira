import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supabaseAdmin = createClient(url, serviceKey);

async function run() {
  console.log('=== Seeding Completed Orders & Published Reviews ===');

  try {
    // 1. Fetch products, stores, profiles
    const { data: products, error: prErr } = await supabaseAdmin.from('products').select('*');
    const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
    const { data: stores, error: stErr } = await supabaseAdmin.from('stores').select('*');

    if (prErr || profErr || stErr) {
      throw new Error(`Data fetch failed: ${prErr?.message || profErr?.message || stErr?.message}`);
    }

    console.log(`Loaded ${products.length} products, ${profiles.length} profiles, ${stores.length} stores.`);

    // Map profiles by roles
    const userProfile = profiles.find(p => p.clerk_id === 'user_3DqetnZU62CVhvs9JLaDukuDYLm');
    const artisanProfiles = profiles.filter(p => p.role === 'artisan');

    if (!userProfile) {
      console.warn('Warning: Your personal profile (user_3DqetnZU62CVhvs9JLaDukuDYLm) was not found in the DB. Make sure you are signed in.');
    }

    // Clear old reviews and orders to start clean
    console.log('Cleaning up existing reviews and orders...');
    await supabaseAdmin.from('review_helpful_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('product_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('buyer_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('child_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('parent_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Select products for seeding reviews
    const jewelryBox = products.find(p => p.name.includes('Jewelry Box'));
    const arganOil = products.find(p => p.name.includes('Cosmetic Argan Oil'));
    const surfLesson = products.find(p => p.name.includes('Surf Lesson'));

    if (!jewelryBox || !arganOil || !surfLesson) {
      throw new Error('Required seeded products are missing. Please run seed-products.mjs first.');
    }

    // Address mock format
    const shippingAddress = {
      line1: '12 Derb El Miter, Medina',
      city: 'Essaouira',
      postal_code: '44000',
      country: 'MA',
      recipient_name: 'Youssef El Kadiri'
    };

    // --- CASE 1: Seed a completed transaction for YOUR account ---
    // This allows your personal profile to have a transaction record for jewelryBox & arganOil, 
    // so you can write reviews through the website UI!
    let myChildOrderId = null;
    if (userProfile) {
      console.log('Seeding transaction for your profile...');
      const { data: myParent, error: myParentErr } = await supabaseAdmin
        .from('parent_orders')
        .insert({
          buyer_id: userProfile.id,
          total_amount: 550.00,
          shipping_address: shippingAddress,
          currency: 'MAD',
          status: 'completed'
        })
        .select()
        .single();

      if (myParentErr) throw myParentErr;

      // Seed child order for jewelryBox (Mogador Woodcraft, store_id: '78f254da-064b-41df-95ab-80e194d80171')
      const { data: myChild, error: myChildErr } = await supabaseAdmin
        .from('child_orders')
        .insert({
          parent_id: myParent.id,
          store_id: jewelryBox.store_id,
          status: 'delivered',
          subtotal: 350.00,
          shipping_cost: 20.00,
          delivered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (myChildErr) throw myChildErr;
      myChildOrderId = myChild.id;

      // Seed order item for jewelryBox
      const { error: item1Err } = await supabaseAdmin
        .from('order_items')
        .insert({
          child_order_id: myChild.id,
          product_id: jewelryBox.id,
          quantity: 1,
          unit_price: 350.00,
          total_price: 350.00
        });

      if (item1Err) throw item1Err;
      console.log(`Seeded complete order history for your user on product: "${jewelryBox.name}" (Child Order ID: ${myChild.id}). You are now fully permitted to write a review!`);
    }

    // --- CASE 2: Seed published reviews from other buyers to make pages look premium ---
    // Let's use artisanProfiles as simulated buyers of other products
    const buyers = artisanProfiles; // Amina, Youssef, Mehdi can buy each other's products

    const reviewsToSeed = [
      {
        buyer: buyers[1] || userProfile, // Amina buys Youssef's Woodcraft box
        product: jewelryBox,
        rating: 5,
        title: 'Bespoke Masterpiece!',
        body: 'The scent of the Thuya wood filled the entire room as soon as I opened the package. The craftsmanship is highly detailed, inlay work is perfectly flush, and it functions beautifully. A true masterpiece of Essaouira heritage!',
        is_published: true
      },
      {
        buyer: buyers[2] || userProfile, // Mehdi buys Amina's Argan oil
        product: arganOil,
        rating: 5,
        title: 'Authentic and Luxurious',
        body: 'Extremely high quality cosmetic argan oil! It absorbs incredibly quickly without leaving a greasy residue, and my skin feels exceptionally hydrated. Ethical sourcing from Medina cooperatives makes it even better.',
        is_published: true
      },
      {
        buyer: buyers[0] || userProfile, // Youssef buys Mehdi's surf lessons
        product: surfLesson,
        rating: 4,
        title: 'Amazing Surf Coaching in Essaouira',
        body: 'Super friendly and patient coaches. They got me standing up on the board within the first 30 minutes! Perfect waves for beginners, high quality wetsuits and equipment provided. Highly recommended experience!',
        is_published: true
      }
    ];

    for (const item of reviewsToSeed) {
      if (!item.buyer) continue;
      
      // 1. Create a parent order for this buyer
      const { data: pOrd, error: pOrdErr } = await supabaseAdmin
        .from('parent_orders')
        .insert({
          buyer_id: item.buyer.id,
          total_amount: item.product.price,
          shipping_address: shippingAddress,
          currency: 'MAD',
          status: 'completed'
        })
        .select()
        .single();

      if (pOrdErr) {
        console.error(`Failed parent order for review seed:`, pOrdErr);
        continue;
      }

      // 2. Create child order for this product's store
      const { data: cOrd, error: cOrdErr } = await supabaseAdmin
        .from('child_orders')
        .insert({
          parent_id: pOrd.id,
          store_id: item.product.store_id,
          status: 'delivered',
          subtotal: item.product.price,
          delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (cOrdErr) {
        console.error(`Failed child order for review seed:`, cOrdErr);
        continue;
      }

      // 3. Create order item
      const { error: oiErr } = await supabaseAdmin
        .from('order_items')
        .insert({
          child_order_id: cOrd.id,
          product_id: item.product.id,
          quantity: 1,
          unit_price: item.product.price,
          total_price: item.product.price
        });

      if (oiErr) {
        console.error(`Failed order item for review seed:`, oiErr);
        continue;
      }

      // 4. Create the product review (directly marking is_published = true as Admin, bypassing DB double-blind gate)
      const { data: rev, error: revErr } = await supabaseAdmin
        .from('product_reviews')
        .insert({
          child_order_id: cOrd.id,
          product_id: item.product.id,
          buyer_id: item.buyer.id,
          rating: item.rating,
          title: item.title,
          body: item.body,
          is_published: item.is_published,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (revErr) {
        console.error(`Failed seeding review on "${item.product.name}":`, revErr);
      } else {
        console.log(`Successfully seeded review on "${item.product.name}" from ${item.buyer.full_name} (Rating: ${item.rating})`);
      }
    }

    console.log('Seeding finished successfully!');

  } catch (err) {
    console.error('Fatal seeding error:', err);
  }
}

run();
