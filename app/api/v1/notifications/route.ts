import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID format').optional(),
  all: z.boolean().optional()
});

/**
 * GET /api/v1/notifications
 * Retrieves notifications feed for the authenticated user.
 * Supports filtering for only unread notifications via '?unreadOnly=true'.
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const supabase = await createClient();
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('🔴 Database error in GET /api/v1/notifications:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      message: 'Notifications feed retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/notifications error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/notifications
 * Marks a specific notification as read, or bulk marks all unread notifications as read.
 */
export async function PATCH(request: Request) {
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
    const validated = updateNotificationSchema.safeParse(body);

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

    const { id, all } = validated.data;
    const supabase = await createClient();

    if (id) {
      // 1. Mark specific notification as read
      const { data: updated, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('profile_id', profile.id)
        .select('*')
        .single();

      if (error) {
        console.error(`🔴 Error marking notification ${id} as read:`, error);
        return NextResponse.json(
          { success: false, data: null, message: 'Notification not found or access denied.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Notification marked as read successfully.'
      });
    } else if (all === true || !id) {
      // 2. Bulk mark all notifications as read
      const { data: updatedList, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', profile.id)
        .eq('is_read', false)
        .select('*');

      if (error) {
        console.error('🔴 Bulk mark notifications as read failed:', error);
        throw new Error(`Bulk update failed: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        data: { count: updatedList?.length || 0 },
        message: 'All notifications marked as read successfully.'
      });
    }
  } catch (err: any) {
    console.error('🔴 PATCH /api/v1/notifications error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to update notifications.' },
      { status: 500 }
    );
  }
}
