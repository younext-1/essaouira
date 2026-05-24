import type { Profile } from '@/lib/database.types'

export type UserRole = 'tourist' | 'artisan' | 'moderator' | 'admin'

/**
 * Validates if the user's active role matches any of the targeted permissions parameters.
 */
export function hasRole(profile: Profile | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!profile || !profile.role) return false
  return allowedRoles.includes(profile.role as UserRole)
}

/**
 * Verifies if the profile is an Administrator.
 */
export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin'
}

/**
 * Verifies if the profile is a Moderator or higher.
 */
export function isModerator(profile: Profile | null | undefined): boolean {
  return profile?.role === 'moderator' || profile?.role === 'admin'
}

/**
 * Verifies if the profile is an Artisan/Seller.
 */
export function isArtisan(profile: Profile | null | undefined): boolean {
  return profile?.role === 'artisan'
}

/**
 * Verifies if the profile is a Tourist/Buyer.
 */
export function isTourist(profile: Profile | null | undefined): boolean {
  return profile?.role === 'tourist'
}

/**
 * Determines numerical order mapping for platform role hierarchy levels.
 */
export function getRoleHierarchy(role: UserRole | null | undefined): number {
  if (!role) return 0
  switch (role) {
    case 'tourist':
      return 1
    case 'artisan':
      return 2
    case 'moderator':
      return 3
    case 'admin':
      return 4
    default:
      return 0
  }
}

/**
 * Ensures an actor has higher platform clearance than a target profile before execution.
 */
export function canModerate(actor: Profile, target: Profile): boolean {
  const actorLevel = getRoleHierarchy(actor.role as UserRole)
  const targetLevel = getRoleHierarchy(target.role as UserRole)
  return actorLevel > targetLevel
}
