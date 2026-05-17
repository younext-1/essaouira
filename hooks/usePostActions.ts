"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useSupabase } from "./useSupabase"
import { useAuthModal } from "@/store/useAuthModal"
import { useProfile } from "@/lib/auth/profile-provider"

export function usePostActions(postId: string, initialLiked = false, initialSaved = false, initialLikeCount = 0) {
  const { isSignedIn } = useUser()
  const { profile } = useProfile()
  const supabase = useSupabase()
  const { open: openSignIn } = useAuthModal()
  const [liked, setLiked] = useState(initialLiked)
  const [saved, setSaved] = useState(initialSaved)
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  // Sync initial values when they change
  useEffect(() => { setLiked(initialLiked) }, [initialLiked])
  useEffect(() => { setSaved(initialSaved) }, [initialSaved])
  useEffect(() => { setLikeCount(initialLikeCount) }, [initialLikeCount])

  const toggleLike = useCallback(async () => {
    if (!isSignedIn || !profile) { openSignIn(); return }

    // Optimistic update
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    try {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: profile.id })
      }
    } catch {
      // Revert on error
      setLiked(liked)
      setLikeCount(likeCount)
    }
  }, [isSignedIn, profile, liked, likeCount, postId, supabase, openSignIn])

  const toggleBookmark = useCallback(async () => {
    if (!isSignedIn || !profile) { openSignIn(); return }

    setSaved(!saved)

    try {
      if (saved) {
        await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("bookmarks").insert({ post_id: postId, user_id: profile.id })
      }
    } catch {
      setSaved(saved)
    }
  }, [isSignedIn, profile, saved, postId, supabase, openSignIn])

  return { liked, saved, likeCount, toggleLike, toggleBookmark }
}
