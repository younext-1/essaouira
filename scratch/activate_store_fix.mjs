import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const clerkId = 'user_3DqetnZU62CVhvs9JLaDukuDYLm'; // user clerk id
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('clerk_id', clerkId).single();
  
  if (profile) {
    const { data: store, error } = await supabaseAdmin.from('stores')
      .update({ is_active: true })
      .eq('owner_id', profile.id)
      .select()
      .single();
      
    if (error) console.error('Error:', error);
    console.log('Store activated successfully:', store?.id);
  } else {
    console.log('Profile not found.');
  }
}
run();
