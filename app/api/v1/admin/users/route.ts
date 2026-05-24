import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUsersList } from '@/lib/db/users'

/**
 * GET /api/v1/admin/users
 * Restricted to Admins and Moderators.
 * Lists all users with dynamic paging, role filters, verification indicators, and full-text searches.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query filters
    const role = searchParams.get('role') || undefined
    const verifiedParam = searchParams.get('verified')
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    let verified: boolean | undefined = undefined
    if (verifiedParam === 'true') verified = true
    if (verifiedParam === 'false') verified = false

    const result = await getUsersList({
      role,
      verified,
      search,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: {
        users: result.data,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
      message: 'Users list retrieved successfully.',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred while fetching users list.',
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
