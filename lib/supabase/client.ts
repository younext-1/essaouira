'use client'

import { useAuth } from '@clerk/nextjs'
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

/**
 * Browser-side Supabase client authenticated with Clerk JWT.
 * Uses a custom fetch wrapper to inject the Clerk token on every request.
 */
export function useClerkSupabase() {
  const { getToken } = useAuth()

  return useMemo(() => {
    return supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
            const token = await getToken({ template: 'supabase' })
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
              },
            })
          },
        },
      }
    )
  }, [getToken])
}

/**
 * Unauthenticated browser Supabase client for public reads.
 */
export function createPublicClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Legacy export — pages using `createClient()` for public reads
export const createClient = createPublicClient
