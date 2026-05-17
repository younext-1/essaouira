"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { createPublicClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/database.types"

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function useProfile() {
  return useContext(ProfileContext)
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (clerkId: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", clerkId)
      .single()

    setProfile((data as Profile) ?? null)
    setLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user) {
      fetchProfile(user.id)
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, user, fetchProfile])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
