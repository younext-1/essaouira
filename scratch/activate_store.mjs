import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const clerkId = 'user_3DqetnZU62CVhvs9JLaDukuDYLm'; // The user's clerk ID from context
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('id, verified, role').eq('clerk_id', clerkId).single();
  
  if (profile) {
    const { data: store, error } = await supabaseAdmin.from('stores')
      .update({ is_active: true, status: 'active' })
      .eq('owner_id', profile.id)
      .select()
      .single();
      
    if (error) console.error(error);
    console.log('Store activated:', store);
  }
}
run();
