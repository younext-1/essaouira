import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

/**
 * Upload an image to Supabase Storage from the browser.
 * Returns the public URL of the uploaded file.
 *
 * Usage: const url = await uploadImage(file, 'posts', userId, clerkToken)
 */
export async function uploadImage(
  file: File,
  bucket: string,
  userId: string,
  getToken?: () => Promise<string | null>,
): Promise<string> {
  const headers: Record<string, string> = {}

  if (getToken) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const supabase = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers } },
  )

  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600' })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrl
}
