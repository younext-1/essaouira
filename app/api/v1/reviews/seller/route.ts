import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { createBuyerReview } from '@/lib/db/reviews';
import { z } from 'zod';

const createBuyerReviewSchema = z.object({
  childOrderId: z.string().uuid('Invalid childOrderId format'),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(5, 'Review body must be at least 5 characters')
});

/**
 * POST /api/v1/reviews/seller
 * Allows sellers (artisans) to review buyers.
 * Double-blind gate rules apply. Order fulfillment checks are validated in db.
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
    const validated = createBuyerReviewSchema.safeParse(body);

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

    const input = validated.data;

    // Call database helper to insert buyer review
    const review = await createBuyerReview(profile.id, {
      child_order_id: input.childOrderId,
      rating: input.rating,
      body: input.body
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Buyer review submitted successfully. All reviews for this order will be published once the buyer submits a review or the 14-day window expires.'
    }, { status: 201 });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/reviews/seller error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to submit buyer review.' },
      { status: 500 }
    );
  }
}
