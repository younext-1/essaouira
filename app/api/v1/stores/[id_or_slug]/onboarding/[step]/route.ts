import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, getStoreBySlug, updateOnboardingStep } from '@/lib/db/stores'

const stepEnum = z.enum([
  'profile_added',
  'payout_connected',
  'first_product_created',
  'shipping_policy_set',
  'store_description_added'
])

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
 * POST /api/v1/stores/[id_or_slug]/onboarding/[step]
 * Marks an onboarding step as completed.
 * Restricted to the store owner only.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const idOrSlug = resolvedParams?.id_or_slug
    const stepParam = resolvedParams?.step

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store ID or Slug parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Validate the onboarding step parameter
    const parsedStep = stepEnum.safeParse(stepParam)
    if (!parsedStep.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid onboarding step. Allowed values: profile_added, payout_connected, first_product_created, shipping_policy_set, store_description_added.',
        },
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

    // 2. Verify store ownership
    if (store.owner_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to update onboarding for this store.' },
        { status: 403 }
      )
    }

    // 3. Mark onboarding step as complete in the database
    const step = parsedStep.data
    const updatedOnboarding = await updateOnboardingStep(store.id, step, true)

    // Note: The database triggers will auto-update onboarding_completed and is_active to TRUE
    // in stores when all steps are completed. Fetching the updated store status to show the user.
    const updatedStore = await getStore(store.id)

    return NextResponse.json({
      success: true,
      data: {
        onboarding: updatedOnboarding,
        store: updatedStore,
      },
      message: `Onboarding step '${step}' marked as complete successfully.`,
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/stores/[id_or_slug]/onboarding/[step] API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while updating onboarding step.',
      },
      { status: 500 }
    )
  }
})
