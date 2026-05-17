import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/profile/edit(.*)',
  '/book(.*)',
  '/posts/new(.*)',
  '/onboarding(.*)',
  '/marketplace/sell(.*)',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isWebhookRoute = createRouteMatcher(['/api/webhooks(.*)'])
const isSignRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect private routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Skip onboarding check for webhooks, sign pages, and static assets
  if (isWebhookRoute(req) || isSignRoute(req)) {
    return NextResponse.next()
  }

  // Check onboarding status for signed-in users
  const { userId } = await auth()
  if (userId && !isOnboardingRoute(req)) {
    // Check Supabase for onboarding status
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?clerk_id=eq.${userId}&select=onboarding_done`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      )
      const data = await response.json()

      // Profile exists but onboarding not done → redirect
      if (data?.[0] && data[0].onboarding_done === false) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    } catch {
      // If check fails, allow through (fail open for hackathon)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
