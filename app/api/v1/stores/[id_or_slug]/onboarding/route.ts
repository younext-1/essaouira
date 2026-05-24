import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, getStoreBySlug, getOnboardingStatus } from '@/lib/db/stores'

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

async function resolveStore(idOrSlug: string) {
  if (isUuid(idOrSlug)) {
    return await getStore(idOrSlug)
  }
  return await getStoreBySlug(idOrSlug)
}

/**
 * GET /api/v1/stores/[id_or_slug]/onboarding
 * Retrieves the onboarding checklist status for the store.
 * Restricted to the store owner or admin/moderator.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const idOrSlug = resolvedParams?.id_or_slug

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store ID or Slug parameter is required.' },
        { status: 400 }
      )
    }

    const store = await resolveStore(idOrSlug)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // Verify ownership or elevated administrative roles
    const isAuthorized =
      store.owner_id === profile.id ||
      profile.role === 'admin' ||
      profile.role === 'moderator'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to view this store onboarding checklist.' },
        { status: 403 }
      )
    }

    const onboardingStatus = await getOnboardingStatus(store.id)

    return NextResponse.json({
      success: true,
      data: onboardingStatus,
      message: 'Onboarding checklist status retrieved successfully.',
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/stores/[id_or_slug]/onboarding API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching onboarding checklist status.',
      },
      { status: 500 }
    )
  }
})
