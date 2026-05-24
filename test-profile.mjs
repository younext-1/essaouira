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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);
const clerkId = 'user_3DqetnZU62CVhvs9JLaDukuDYLm';

async function run() {
  console.log('--- Querying Profile Anonymously ---');
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (profError) {
    console.error('Error fetching profile:', profError);
  } else {
    console.log('Profile found anonymously:', profile);
  }

  if (profile) {
    console.log('\n--- Querying Store Anonymously ---');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (storeError) {
      console.error('Error fetching store:', storeError);
    } else {
      console.log('Store found anonymously:', store);
    }
  }
}

run();
