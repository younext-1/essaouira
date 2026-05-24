import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin.from('products').select('*').limit(1);
  if (error) console.error('Error fetching products:', error);
  else console.log('Successfully fetched products using service role.');
}
run();
