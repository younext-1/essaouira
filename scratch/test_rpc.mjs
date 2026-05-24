import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  // Create an RPC function to test what Supabase sees in the JWT
  const sql = `
    CREATE OR REPLACE FUNCTION public.test_auth_jwt()
    RETURNS json AS $$
    BEGIN
      RETURN json_build_object(
        'sub', current_setting('request.jwt.claim.sub', true),
        'role', current_setting('request.jwt.claim.role', true),
        'clerk_id', public.get_clerk_id()
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  // We can't execute raw SQL directly from the client without an RPC that executes SQL, which we don't have.
  // Instead, let's use the REST API to query `pg_policies` for products, maybe `products_owner_insert` has a bug?
  
  const { data, error } = await supabaseAdmin.from('products').select('*').limit(1);
  console.log('Test:', data, error);
}
run();
