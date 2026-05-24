import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { hasRole, type UserRole } from '@/lib/auth/permissions'
import type { Profile } from '@/lib/database.types'

/**
 * Standard typed route handler with dynamic, pre-fetched Profile injection.
 */
export type AuthenticatedRouteHandler = (
  request: Request,
  context: any,
  profile: Profile
) => Promise<Response> | Response

/**
 * Higher-order Route Handler wrapper that enforces Clerk auth and custom database role policies.
 * Automatically injects the caller's validated profile object into the route parameters.
 */
export function withAuth(handler: AuthenticatedRouteHandler, allowedRoles?: UserRole[]) {
  return async (request: Request, context: any) => {
    try {
      // 1. Authenticate the Clerk session token
      const { userId: clerkId } = await auth()
      if (!clerkId) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: 'Unauthenticated: Secure sign-in required to execute this request.',
          },
          { status: 401 }
        )
      }

      // 2. Fetch the relational user profile details
      const profile = await getProfileByClerkId(clerkId)
      if (!profile) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: 'Unauthorized: No matching relational profile found for this authenticated user.',
          },
          { status: 403 }
        )
      }

      // 3. Enforce role-based access list conditions
      if (allowedRoles && allowedRoles.length > 0) {
        if (!hasRole(profile, allowedRoles)) {
          return NextResponse.json(
            {
              success: false,
              data: null,
              message: `Forbidden: This route requires elevated privileges. Allowed roles: [${allowedRoles.join(', ')}].`,
            },
            { status: 403 }
          )
        }
      }

      // 4. Execute handler injecting profile for easy access
      return await handler(request, context, profile)
    } catch (err: any) {
      console.error('🔴 Auth Middleware verification crash:', err)
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'An unexpected security authorization error occurred.',
        },
        { status: 500 }
      )
    }
  }
}
