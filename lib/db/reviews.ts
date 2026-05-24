// Database Helpers: lib/db/reviews.ts
// Handles database CRUD operations for the Double-Blind Reviews & Trust Scores system (P3).

import { createClient } from '@/lib/supabase/server';
import type { 
  ProductReview, 
  BuyerReview, 
  StoreTrustMetrics, 
  CreateProductReviewInput, 
  CreateBuyerReviewInput 
} from '@/types/reviews.types';

/**
 * Fetches all published reviews for a product, including hydrated buyer profile details.
 */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id,
      child_order_id,
      product_id,
      variant_id,
      buyer_id,
      rating,
      title,
      body,
      images,
      helpful_count,
      is_published,
      published_at,
      created_at,
      profiles:buyer_id(id, full_name, avatar_url)
    `)
    .eq('product_id', productId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('🔴 Error in getProductReviews:', error);
    throw new Error(`Failed to retrieve product reviews: ${error.message}`);
  }

  return (data as unknown as ProductReview[]) ?? [];
}

/**
 * Creates a new product review from a buyer. 
 * Database triggers validate that the buyer purchased this product in a completed/delivered order.
 */
export async function createProductReview(
  buyerId: string,
  input: CreateProductReviewInput
): Promise<ProductReview> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      child_order_id: input.child_order_id,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      buyer_id: buyerId,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      images: input.images || []
    })
    .select(`
      id,
      child_order_id,
      product_id,
      variant_id,
      buyer_id,
      rating,
      title,
      body,
      images,
      helpful_count,
      is_published,
      published_at,
      created_at
    `)
    .single();

  if (error) {
    console.error('🔴 Error in createProductReview:', error);
    throw new Error(error.message || 'Failed to create product review');
  }

  return data as unknown as ProductReview;
}

/**
 * Creates a new buyer review from a seller.
 * Database triggers validate that the seller fulfilled the order, and target buyer is the order buyer.
 */
export async function createBuyerReview(
  sellerId: string,
  input: CreateBuyerReviewInput
): Promise<BuyerReview> {
  const supabase = await createClient();

  // 1. Resolve order details to verify target buyer_id
  const { data: order, error: orderError } = await supabase
    .from('child_orders')
    .select(`
      store_id,
      parent_orders(buyer_id)
    `)
    .eq('id', input.child_order_id)
    .single();

  if (orderError || !order) {
    console.error('🔴 Error resolving order in createBuyerReview:', orderError);
    throw new Error('Failed to resolve target order details.');
  }

  // Cast Parent Order details
  const parentOrder = order.parent_orders as unknown as { buyer_id: string } | null;
  if (!parentOrder || !parentOrder.buyer_id) {
    throw new Error('Could not determine buyer for this order context.');
  }

  const { data, error } = await supabase
    .from('buyer_reviews')
    .insert({
      child_order_id: input.child_order_id,
      seller_id: sellerId,
      buyer_id: parentOrder.buyer_id,
      rating: input.rating,
      body: input.body.trim()
    })
    .select(`
      id,
      child_order_id,
      seller_id,
      buyer_id,
      rating,
      body,
      is_published,
      published_at,
      created_at
    `)
    .single();

  if (error) {
    console.error('🔴 Error in createBuyerReview:', error);
    throw new Error(error.message || 'Failed to create buyer review');
  }

  return data as unknown as BuyerReview;
}

/**
 * Fetches the trust score metrics and active awards/badges of a merchant store.
 */
export async function getStoreTrustMetrics(storeId: string): Promise<StoreTrustMetrics | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stores_trust_metrics')
    .select(`
      store_id,
      avg_rating,
      total_reviews,
      communication_score,
      order_completion_rate,
      on_time_delivery_rate,
      trust_score,
      badges,
      updated_at
    `)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in getStoreTrustMetrics:', error);
    throw new Error(`Failed to retrieve store trust metrics: ${error.message}`);
  }

  return (data as unknown as StoreTrustMetrics) ?? null;
}

/**
 * Submits a helpful vote for a specific product review.
 */
export async function voteHelpful(profileId: string, reviewId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('review_helpful_votes')
    .insert({
      review_id: reviewId,
      profile_id: profileId
    });

  if (error) {
    console.error('🔴 Error in voteHelpful:', error);
    throw new Error(`Failed to vote helpful: ${error.message}`);
  }

  return true;
}

/**
 * Removes a helpful vote from a specific product review.
 */
export async function unvoteHelpful(profileId: string, reviewId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('review_helpful_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('profile_id', profileId);

  if (error) {
    console.error('🔴 Error in unvoteHelpful:', error);
    throw new Error(`Failed to remove helpful vote: ${error.message}`);
  }

  return true;
}

/**
 * Helper to check if a specific profile has voted a review as helpful.
 */
export async function hasUserVotedHelpful(profileId: string, reviewId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_helpful_votes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in hasUserVotedHelpful:', error);
    return false;
  }

  return !!data;
}
