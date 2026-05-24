import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, ProfileVerification, AuditLog } from '@/lib/database.types'

/**
 * Creates or updates a user profile from Clerk webhook event payloads.
 * Uses the admin (service-role) client to bypass RLS — this is safe because
 * this function is only ever called from trusted server-side routes/webhooks.
 */
export async function syncUserProfile(data: {
  clerk_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
}): Promise<Profile> {
  // Use admin client to bypass RLS for profile upsert
  const supabase = createAdminClient()

  // Extract a fallback username from the email
  const username = data.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6)

  // Use UPSERT to dynamically insert or update based on clerk_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(
      {
        clerk_id: data.clerk_id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        phone: data.phone,
        username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_id' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('🔴 Sync database user error:', error)
    throw error
  }
  return profile as Profile
}


/**
 * Fetches a user profile by their unique Clerk ID.
 */
export async function getProfileByClerkId(clerkId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return null
  return data as Profile
}

/**
 * Fetches a profile by Supabase UUID.
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return null
  return data as Profile
}

/**
 * Updates a user's allowed profile fields.
 */
export async function updateProfileFields(id: string, fields: {
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  phone?: string | null
}): Promise<Profile> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Submits dynamic documentation files for artisan/cooperative verifications.
 */
export async function submitVerification(data: {
  profile_id: string
  document_type: string
  document_url: string
}): Promise<ProfileVerification> {
  const supabase = await createClient()
  const { data: verification, error } = await supabase
    .from('profile_verifications')
    .insert({
      profile_id: data.profile_id,
      document_type: data.document_type,
      document_url: data.document_url,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw error
  return verification as ProfileVerification
}

/**
 * Lists all users with multi-functional search & status filters.
 */
export async function getUsersList(filters: {
  role?: string
  verified?: boolean
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Profile[]; total: number }> {
  const supabase = await createClient()
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters.verified !== undefined) {
    query = query.eq('verified', filters.verified)
  }

  if (filters.search) {
    const searchVal = `%${filters.search}%`
    query = query.or(`email.ilike.${searchVal},full_name.ilike.${searchVal},username.ilike.${searchVal}`)
  }

  const { data, count, error } = await query.range(from, to)

  if (error) throw error
  return {
    data: (data as Profile[]) ?? [],
    total: count ?? 0,
  }
}

/**
 * Admin role changer. Writes a manual audit log record and updates the DB value.
 */
export async function updateUserRole(
  userId: string,
  role: 'tourist' | 'artisan' | 'moderator' | 'admin',
  actorId: string,
  ipAddress?: string
): Promise<Profile> {
  const supabase = await createClient()

  // Update profile role
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      role,
      is_artisan: role === 'artisan',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error

  // Log to audit log (The SQL AFTER trigger also logs this, but we write a detailed administrative action row)
  await writeAuditLog({
    actor_id: actorId,
    action: 'ADMIN_CHANGE_ROLE',
    target_type: 'profile',
    target_id: userId,
    metadata: { assigned_role: role },
    ip_address: ipAddress || null,
  })

  return profile as Profile
}

/**
 * Retrieves the list of pending profile verifications with linked profile details.
 */
export async function getPendingVerifications(): Promise<any[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profile_verifications')
    .select('*, profile:profiles(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Approves or rejects a user profile verification. If approved, toggles profile.verified to true.
 */
export async function reviewVerification(
  verificationId: string,
  status: 'approved' | 'rejected',
  actorId: string,
  notes?: string,
  ipAddress?: string
): Promise<ProfileVerification> {
  const supabase = await createClient()

  // Update verification status
  const { data: verification, error: verifyError } = await supabase
    .from('profile_verifications')
    .update({
      status,
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select('*')
    .single()

  if (verifyError) throw verifyError

  // If approved, update profile verified status
  if (status === 'approved') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', verification.profile_id)

    if (profileError) throw profileError
  }

  // Log manual administrative action to the audit logs
  await writeAuditLog({
    actor_id: actorId,
    action: `VERIFICATION_${status.toUpperCase()}`,
    target_type: 'profile_verification',
    target_id: verificationId,
    metadata: { notes: notes || '' },
    ip_address: ipAddress || null,
  })

  return verification as ProfileVerification
}

/**
 * Manual audit log writer helper function.
 */
export async function writeAuditLog(data: {
  actor_id: string | null
  action: string
  target_type: string
  target_id: string
  metadata?: any
  ip_address?: string | null
}): Promise<AuditLog> {
  const supabase = await createClient()
  const { data: log, error } = await supabase
    .from('audit_logs')
    .insert({
      actor_id: data.actor_id,
      action: data.action,
      target_type: data.target_type,
      target_id: data.target_id,
      metadata: data.metadata ?? {},
      ip_address: data.ip_address || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return log as AuditLog;
}
