import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { getThreadById, getThreadMessages, createMessage, markMessagesAsRead } from '@/lib/db/messaging';
import { z } from 'zod';

const sendMessageSchema = z.object({
  threadId: z.string().uuid('Invalid threadId format'),
  content: z.string().trim().min(1, 'Message content cannot be empty')
});

/**
 * GET /api/v1/chat/messages
 * Retrieves paginated messages for a specific chat thread.
 * Automatically marks incoming messages as read for the active participant.
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

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!threadId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Missing required query parameter: threadId' },
        { status: 400 }
      );
    }

    // 1. Fetch thread and verify the user is a participant
    const thread = await getThreadById(threadId);
    if (!thread) {
      return NextResponse.json(
        { success: false, data: null, message: 'Chat thread not found.' },
        { status: 404 }
      );
    }

    if (thread.buyer_id !== profile.id && thread.seller_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You are not a participant in this chat thread.' },
        { status: 403 }
      );
    }

    // 2. Fetch messages
    const messages = await getThreadMessages(threadId, limit, offset);

    // 3. Mark incoming messages as read asynchronously
    // (Non-blocking to improve response latency)
    markMessagesAsRead(threadId, profile.id).catch(err => {
      console.error('⚠️ Failed to mark messages as read background task:', err);
    });

    return NextResponse.json({
      success: true,
      data: messages,
      message: 'Messages retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/chat/messages error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve messages.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/chat/messages
 * Sends a new message inside an active chat thread.
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
    const validated = sendMessageSchema.safeParse(body);

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

    const { threadId, content } = validated.data;

    // 1. Fetch thread and verify the user is a participant
    const thread = await getThreadById(threadId);
    if (!thread) {
      return NextResponse.json(
        { success: false, data: null, message: 'Chat thread not found.' },
        { status: 404 }
      );
    }

    if (thread.buyer_id !== profile.id && thread.seller_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You are not a participant in this chat thread.' },
        { status: 403 }
      );
    }

    // 2. Insert message
    const message = await createMessage({
      threadId,
      senderId: profile.id,
      content
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/chat/messages error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to send message.' },
      { status: 500 }
    );
  }
}
