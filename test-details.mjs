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

const supabaseAdmin = createClient(url, serviceKey);

async function run() {
  console.log('--- Fetching all categories ---');
  const { data: categories, error: catError } = await supabaseAdmin.from('categories').select('*');
  if (catError) {
    console.error('Error categories:', catError);
  } else {
    console.log('Categories:', categories?.length);
    console.log(categories);
  }

  console.log('\n--- Fetching all stores ---');
  const { data: stores, error: storeError } = await supabaseAdmin.from('stores').select('*');
  if (storeError) {
    console.error('Error stores:', storeError);
  } else {
    console.log('Stores:', stores?.length);
    console.log(stores);
  }

  console.log('\n--- Fetching all products ---');
  const { data: products, error: prodError } = await supabaseAdmin.from('products').select('*');
  if (prodError) {
    console.error('Error products:', prodError);
  } else {
    console.log('Products:', products?.length);
    console.log(products);
  }
}

run();
