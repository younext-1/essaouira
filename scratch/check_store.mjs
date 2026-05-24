import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jdfhchjicxmsjpxjipou.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
// We will use service role key if available, but let's just query profiles as anon if RLS allows, wait, profiles RLS might block anon.
// Let's use service_role key to bypass RLS and see what the database has.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const clerkId = 'user_3DqetnZU62CVhvs9JLaDukuDYLm'; // The user's clerk ID from context
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('id, verified, role').eq('clerk_id', clerkId).single();
  console.log('Profile:', profile);

  if (profile) {
    const { data: store } = await supabaseAdmin.from('stores').select('id, name, is_active, deleted_at, status').eq('owner_id', profile.id).single();
    console.log('Store:', store);
  }
}
run();
