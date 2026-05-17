"use client"

import { useAuth } from "@clerk/nextjs"
import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import { useMemo } from "react"

/**
 * Hook that returns a Clerk-authenticated Supabase client.
 * Injects Clerk JWT on every Supabase request for RLS.
 */
export function useSupabase() {
  const { getToken, isSignedIn } = useAuth()

  return useMemo(() => {
    return supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
            const token = isSignedIn
              ? await getToken({ template: "supabase" })
              : null
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            })
          },
        },
      }
    )
  }, [getToken, isSignedIn])
}
