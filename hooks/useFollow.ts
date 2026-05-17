"use client"

import { useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useSupabase } from "./useSupabase"
import { useAuthModal } from "@/store/useAuthModal"
import { useProfile } from "@/lib/auth/profile-provider"

export function useFollow(targetProfileId: string, initialFollowing = false) {
  const { isSignedIn } = useUser()
  const { profile } = useProfile()
  const supabase = useSupabase()
  const { open: openSignIn } = useAuthModal()
  const [following, setFollowing] = useState(initialFollowing)

  const toggleFollow = useCallback(async () => {
    if (!isSignedIn || !profile) { openSignIn(); return }
    if (profile.id === targetProfileId) return // can't follow self

    setFollowing(!following)

    try {
      if (following) {
        await supabase.from("follows").delete()
          .eq("follower_id", profile.id)
          .eq("following_id", targetProfileId)
      } else {
        await supabase.from("follows").insert({
          follower_id: profile.id,
          following_id: targetProfileId,
        })
      }
    } catch {
      setFollowing(following)
    }
  }, [isSignedIn, profile, following, targetProfileId, supabase, openSignIn])

  return { following, toggleFollow }
}
