"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Helper: get the Supabase profile.id for the current Clerk user.
 */
async function getProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  return data?.id ?? null;
}

export async function toggleLikeAction(postId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { error: "Not authenticated" };

  const supabase = await createClerkSupabaseClient();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profileId)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: profileId });
  }

  revalidatePath("/");
  return { liked: !existing };
}

export async function toggleBookmarkAction(postId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { error: "Not authenticated" };

  const supabase = await createClerkSupabaseClient();

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profileId)
    .single();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
  } else {
    await supabase.from("bookmarks").insert({ post_id: postId, user_id: profileId });
  }

  revalidatePath("/");
  return { saved: !existing };
}

export async function toggleFollowAction(targetProfileId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { error: "Not authenticated" };

  const supabase = await createClerkSupabaseClient();

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", profileId)
    .eq("following_id", targetProfileId)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
  } else {
    await supabase.from("follows").insert({ follower_id: profileId, following_id: targetProfileId });
  }

  revalidatePath("/");
  return { following: !existing };
}

export async function createBookingAction(formData: FormData) {
  const profileId = await getProfileId();
  if (!profileId) return { error: "Not authenticated" };

  const supabase = await createClerkSupabaseClient();

  const guideId = formData.get("guide_id") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("guide_bookings").insert({
    tourist_id: profileId,
    guide_id: guideId,
    date,
    time: time || null,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/book");
  return { success: true };
}
