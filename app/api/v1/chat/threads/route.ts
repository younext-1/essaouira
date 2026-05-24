import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { getThreadsForUser, getOrCreateThread } from '@/lib/db/messaging';
import { z } from 'zod';

const createThreadSchema = z.object({
  storeId: z.string().uuid('Invalid storeId format'),
  sellerId: z.string().uuid('Invalid sellerId format'),
  childOrderId: z.string().uuid('Invalid childOrderId format').nullable().optional()
});

/**
 * GET /api/v1/chat/threads
 * Retrieves all chat threads associated with the authenticated user (as buyer or seller).
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Authenticated user profile not found.' },
        { status: 404 }
      );
    }

    const threads = await getThreadsForUser(profile.id);

    return NextResponse.json({
      success: true,
      data: threads,
      message: 'Chat threads retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/chat/threads error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve chat threads.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/chat/threads
 * Finds or creates a chat thread between the authenticated buyer and an artisan's store.
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Authenticated user profile not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createThreadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: validated.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { storeId, sellerId, childOrderId } = validated.data;

    // Enforce that a seller cannot start a thread with themselves
    if (profile.id === sellerId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Artisans cannot start chat threads with their own stores.' },
        { status: 400 }
      );
    }

    const thread = await getOrCreateThread(
      profile.id, // Current authenticated user is the buyer
      storeId,
      sellerId,
      childOrderId || null
    );

    return NextResponse.json({
      success: true,
      data: thread,
      message: 'Chat thread resolved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/chat/threads error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to resolve chat thread.' },
      { status: 500 }
    );
  }
}
