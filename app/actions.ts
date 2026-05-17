'use server'

import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Helper: get the Supabase profile.id for the current Clerk user.
 */
async function getProfileId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  return data?.id ?? null
}

// ── Save basic info ─────────────────────
export async function saveBasicInfo(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createClerkSupabaseClient()
  const { error } = await supabase.from('profiles').update({
    full_name:      formData.get('fullName') as string,
    username:       formData.get('username') as string,
    title:          formData.get('title') as string || null,
    location:       formData.get('location') as string || null,
    bio:            formData.get('bio') as string || null,
    whatsapp:       formData.get('whatsapp') as string || null,
    instagram:      formData.get('instagram') as string || null,
    facebook:       formData.get('facebook') as string || null,
    tiktok:         formData.get('tiktok') as string || null,
    website:        formData.get('website') as string || null,
    craft_category: formData.get('craftCategory') as string || null,
    updated_at:     new Date().toISOString(),
  }).eq('clerk_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/profile/edit')
  return { success: true }
}

// ── Upload avatar ────────────────────────
export async function uploadAvatar(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) throw new Error('No file provided')

  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = admin.storage
    .from('avatars')
    .getPublicUrl(path)

  const supabase = await createClerkSupabaseClient()
  await supabase.from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('clerk_id', userId)

  revalidatePath('/profile/edit')
  return publicUrl
}

// ── Save custom HTML ─────────────────────
export async function saveCustomHtml(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const file = formData.get('htmlFile') as File
  if (!file || file.size === 0) throw new Error('No file provided')

  if (file.size > 1024 * 1024) throw new Error('File must be under 1MB')

  const content = await file.text()

  const supabase = await createClerkSupabaseClient()
  await supabase.from('profiles').update({
    custom_html:          content,
    custom_html_filename: file.name,
    custom_html_enabled:  true,
    updated_at:           new Date().toISOString(),
  }).eq('clerk_id', userId)

  revalidatePath('/profile/edit')
  return { success: true }
}

// ── Toggle custom HTML on/off ─────────────
export async function toggleCustomHtml(enabled: boolean) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createClerkSupabaseClient()
  await supabase.from('profiles')
    .update({ custom_html_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('clerk_id', userId)

  revalidatePath('/profile/edit')
  return { success: true }
}

// ── Save markdown profile ────────────────
export async function saveProfileMd(markdown: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createClerkSupabaseClient()
  await supabase.from('profiles')
    .update({ profile_md: markdown, updated_at: new Date().toISOString() })
    .eq('clerk_id', userId)

  revalidatePath('/profile/edit')
  return { success: true }
}

// ── Create post ──────────────────────────
export async function createPostAction(formData: FormData) {
  const profileId = await getProfileId()
  if (!profileId) throw new Error('Unauthorized')

  const supabase = await createClerkSupabaseClient()

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id:    profileId,
      title:        formData.get('title') as string,
      content:      formData.get('content') as string,
      category:     formData.get('category') as string || 'other',
      location:     formData.get('location') as string || null,
      is_published: true,
    })
    .select()
    .single()

  if (postError || !post) throw new Error(postError?.message || 'Failed to create post')

  // Save image URLs (already uploaded to storage on client)
  const imageUrlsRaw = formData.get('imageUrls') as string
  if (imageUrlsRaw) {
    try {
      const imageUrls = JSON.parse(imageUrlsRaw) as string[]
      if (imageUrls.length > 0) {
        await supabase.from('post_images').insert(
          imageUrls.map((url, i) => ({
            post_id: post.id,
            url,
            sort_order: i,
          }))
        )
      }
    } catch { /* ignore parse errors */ }
  }

  // Save tags
  const tagsRaw = formData.get('tags') as string
  if (tagsRaw) {
    try {
      const tags = JSON.parse(tagsRaw) as string[]
      if (tags.length > 0) {
        await supabase.from('post_tags').insert(
          tags.map(tag => ({ post_id: post.id, tag }))
        )
      }
    } catch { /* ignore parse errors */ }
  }

  revalidatePath('/explore')
  return { success: true, postId: post.id }
}

// ── Delete post ──────────────────────────
export async function deletePostAction(postId: string) {
  const profileId = await getProfileId()
  if (!profileId) throw new Error('Unauthorized')

  const supabase = await createClerkSupabaseClient()
  await supabase.from('posts').delete().eq('id', postId)
  revalidatePath('/explore')
  return { success: true }
}

// ── Toggle like ──────────────────────────
export async function toggleLikeAction(postId: string) {
  const profileId = await getProfileId()
  if (!profileId) return { error: 'Not authenticated' }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', profileId)
    .maybeSingle()

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id)
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: profileId })
  }

  revalidatePath('/explore')
  return { liked: !existing }
}

// ── Toggle bookmark ──────────────────────
export async function toggleBookmarkAction(postId: string) {
  const profileId = await getProfileId()
  if (!profileId) return { error: 'Not authenticated' }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', profileId)
    .maybeSingle()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id)
  } else {
    await supabase.from('bookmarks').insert({ post_id: postId, user_id: profileId })
  }

  revalidatePath('/explore')
  return { saved: !existing }
}

// ── Toggle follow ────────────────────────
export async function toggleFollowAction(targetProfileId: string) {
  const profileId = await getProfileId()
  if (!profileId) return { error: 'Not authenticated' }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', profileId)
    .eq('following_id', targetProfileId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
  } else {
    await supabase.from('follows').insert({ follower_id: profileId, following_id: targetProfileId })
  }

  revalidatePath('/explore')
  return { following: !existing }
}

// ── Add product to marketplace ───────────
export async function addProduct(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const profileId = await getProfileId()
  if (!profileId) throw new Error('Profile not found')

  const supabase = await createClerkSupabaseClient()

  const imageUrl = formData.get('imageUrl') as string || null

  await supabase.from('products').insert({
    seller_id:   profileId,
    title:       formData.get('title') as string,
    description: formData.get('description') as string || null,
    price_mad:   parseFloat(formData.get('price') as string) || 0,
    category:    formData.get('category') as string || null,
    image_url:   imageUrl,
    in_stock:    true,
  })

  revalidatePath('/marketplace')
  return { success: true }
}
