'use client';

import { useAuth } from "@clerk/nextjs"
import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import { useMemo } from "react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Hook that returns a Clerk-authenticated Supabase client.
 * Injects Clerk JWT on every Supabase request for RLS.
 */
export function useSupabase() {
  const { getToken, isSignedIn } = useAuth()

  return useMemo(() => {
    return supabaseCreateClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false, 
        },
        global: {
          fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
            const token = isSignedIn
              ? await getToken({ template: "supabase" })
              : null

            // 🔥 الحل هنا: استخدام new Headers يحافظ على Content-Type لكي ينجح الـ POST
            const headers = new Headers(options?.headers);
            
            headers.set('apikey', supabaseAnonKey);
            headers.set('Authorization', token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`);

            return fetch(url, {
              ...options,
              headers,
            })
          },
        },
      }
    )
  }, [getToken, isSignedIn])
}