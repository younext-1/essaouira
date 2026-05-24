import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { getProductReviews, createProductReview } from '@/lib/db/reviews';
import { z } from 'zod';

const createProductReviewSchema = z.object({
  childOrderId: z.string().uuid('Invalid childOrderId format'),
  productId: z.string().uuid('Invalid productId format'),
  variantId: z.string().uuid('Invalid variantId format').nullable().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1, 'Title cannot be empty').max(255),
  body: z.string().trim().min(5, 'Review body must be at least 5 characters'),
  images: z.array(z.string().url('Invalid image URL format')).optional()
});

/**
 * GET /api/v1/reviews
 * Fetches all published reviews for a specific product.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Missing required query parameter: productId' },
        { status: 400 }
      );
    }

    const reviews = await getProductReviews(productId);

    return NextResponse.json({
      success: true,
      data: reviews,
      message: 'Product reviews retrieved successfully.'
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/reviews error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to retrieve reviews.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/reviews
 * Creates a new product review from an authenticated buyer.
 * Double-blind gate rules apply. Verified purchase is strictly checked in db.
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
    const validated = createProductReviewSchema.safeParse(body);

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

    // Call database helper to insert product review
    const review = await createProductReview(profile.id, {
      child_order_id: input.childOrderId,
      product_id: input.productId,
      variant_id: input.variantId || null,
      rating: input.rating,
      title: input.title,
      body: input.body,
      images: input.images || []
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Product review submitted successfully. Review will be published once the seller submits a matching review or the 14-day window expires.'
    }, { status: 201 });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/reviews error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to submit review.' },
      { status: 500 }
    );
  }
}
