import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client authenticated with the current Clerk user's JWT.
 * Use in Server Components, Server Actions, and Route Handlers.
 * RLS policies will see the Clerk user_id as the JWT `sub` claim.
 */
export async function createClerkSupabaseClient() {
  const { getToken } = await auth()
  const supabaseToken = await getToken({ template: 'supabase' })

  const headers: Record<string, string> = {}

  // FIX 1: Only attach the Authorization header if supabaseToken is present.
  // If user is unauthenticated, omit the header entirely so Supabase falls back 
  // to anonymous public access safely (preventing Bearer null invalid token error).
  if (supabaseToken) {
    headers['Authorization'] = `Bearer ${supabaseToken}`
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers,
      },
    }
  )
}

/**
 * Unauthenticated Supabase client for public reads.
 * No JWT attached — only public RLS policies apply.
 */
export function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Re-export for backwards compat with existing `createClient` calls in db/ layer
export { createClerkSupabaseClient as createClient }

