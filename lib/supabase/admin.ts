import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use ONLY in trusted server contexts (webhooks, admin tasks).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
