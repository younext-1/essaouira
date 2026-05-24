'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types';
import StarRating from '@/components/StarRating';
import ReviewModal from '@/components/ReviewModal';
import { Loader2, User, Award, ThumbsUp, Star, Edit3, Save, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const userId = user?.id;

  // Local States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeModalReview, setActiveModalReview] = useState<{ review: Review; productName: string } | null>(null);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<{ id: string; productId: string } | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isUserLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isUserLoaded, isSignedIn, router]);

  // Query User's profile details from Supabase using clerk_id
  const { data: dbProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-db-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading DB profile:', error);
      }
      return data || null;
    },
    enabled: !!userId,
  });

  // Query User's reviews from Supabase with Product names
  const { data: myReviews = [], isLoading: isReviewsLoading } = useQuery<any[]>({
    queryKey: ['my-reviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get profile uuid first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();
      
      if (!profile) return [];

      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name, images, thumbnail_url, category:categories(name))')
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!userId,
  });

  // Initialize editing state
  useEffect(() => {
    if (dbProfile?.full_name) {
      setNewName(dbProfile.full_name);
    }
  }, [dbProfile]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { fullName: string }) => {
      if (!userId) throw new Error('Not logged in');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: payload.fullName })
        .eq('clerk_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-db-profile', userId] });
      setIsEditingName(false);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to update name.');
    }
  });

  // Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id)
        .eq('buyer_id', dbProfile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews', userId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      setDeleteConfirmReview(null);
    },
  });

  const handleSaveName = () => {
    if (!newName.trim()) return;
    updateProfileMutation.mutate({ fullName: newName.trim() });
  };

  const handleDeleteClick = (reviewId: string, productId: string) => {
    setDeleteConfirmReview({ id: reviewId, productId });
  };

  const confirmDeleteReview = () => {
    if (!deleteConfirmReview) return;
    deleteReviewMutation.mutate(deleteConfirmReview);
  };

  // Calculate dynamic stats
  const totalReviews = myReviews.length;
  const totalHelpfulVotes = myReviews.reduce((acc, r) => acc + (r.helpful_count || 0), 0);
  const avgRatingGiven =
    totalReviews > 0
      ? (myReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  if (!isUserLoaded || isProfileLoading || isReviewsLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Your Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-24" >

      {/* Profile Header Block */}
      <section className="bg-white border-b border-gray-150 py-12 md:py-16 shadow-sm select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User Profile Frame */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={user?.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={dbProfile?.full_name || 'Buyer Avatar'}
                  className="h-20 w-20 rounded-full object-cover border-2 border-[#18181B] shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#18181B] flex items-center justify-center text-white border border-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="rounded-xl border border-[rgba(232,227,216,0.8)] px-3 py-1.5 text-xs text-[#18181B] focus:border-[#18181B] focus:outline-none bg-[#F5F0E8] font-bold"
                        maxLength={50}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={updateProfileMutation.isPending}
                        className="p-2 bg-[#18181B] rounded-xl text-white hover:bg-[#18181B]/90 transition-colors cursor-pointer shadow-sm"
                        aria-label="Save full name"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-extrabold text-[#18181B] tracking-tight" >
                        {dbProfile?.full_name || 'Verified Buyer'}
                      </h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                        aria-label="Edit name inline"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-[#71717A] font-semibold leading-none">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[8.5px] font-bold tracking-wider text-[#18181B] uppercase">
                  Verified Buyer Member
                </span>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto shrink-0 max-w-md">
              
              {/* Total Reviews Card */}
              <div className="bg-[#F5F0E8]/50 rounded-2xl border border-gray-150 p-4 text-center">
                <span className="block text-2xl font-extrabold text-[#18181B]">{totalReviews}</span>
                <span className="text-[9px] font-extrabold text-[#71717A] uppercase tracking-wider block mt-0.5">Reviews</span>
              </div>

              {/* Average Score Card */}
              <div className="bg-[#F5F0E8]/50 rounded-2xl border border-gray-150 p-4 text-center">
                <span className="block text-2xl font-extrabold text-[#18181B] flex items-center justify-center gap-0.5">
                  {avgRatingGiven}
                  <Star className="h-4 w-4 fill-current text-[#18181B]" />
                </span>
                <span className="text-[9px] font-extrabold text-[#71717A] uppercase tracking-wider block mt-0.5">Avg Rating</span>
              </div>

              {/* Helpful Votes Card */}
              <div className="bg-[#F5F0E8]/50 rounded-2xl border border-gray-150 p-4 text-center">
                <span className="block text-2xl font-extrabold text-[#18181B] flex items-center justify-center gap-1">
                  {totalHelpfulVotes}
                  <ThumbsUp className="h-4 w-4 text-[#71717A]" />
                </span>
                <span className="text-[9px] font-extrabold text-[#71717A] uppercase tracking-wider block mt-0.5">Helpful Recd</span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Reviews Management Feed Panel */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        
        <div className="border-b border-gray-150 pb-4 mb-6 select-none">
          <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Feedback Logs</span>
          <h2 className="text-xl font-bold text-[#18181B] mt-0.5" >
            Your Submitted Ratings & Reviews
          </h2>
        </div>

        {myReviews.length > 0 ? (
          <div className="space-y-6">
            {myReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-gray-150 bg-white overflow-hidden shadow-sm flex flex-col md:flex-row items-stretch hover:shadow-md transition-shadow"
              >
                
                {/* Product Detail Thumbnail link */}
                <div className="md:w-56 shrink-0 bg-[#F5F0E8] relative border-b md:border-b-0 md:border-r border-[rgba(232,227,216,0.45)] overflow-hidden group aspect-[4/3] md:aspect-auto">
                  <img
                    src={review.products?.images?.[0] || review.products?.thumbnail_url || '/placeholder.jpg'}
                    alt={review.products?.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#18181B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Link
                      href={`/product/${review.product_id}`}
                      className="rounded-xl bg-white px-4 py-2 text-[10px] font-bold text-[#18181B] tracking-wider uppercase flex items-center gap-1 shadow-md hover:bg-[#18181B] hover:text-white spring-transition"
                    >
                      View Product
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Review specifications and controls */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 select-none">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[8.5px] font-bold text-[#18181B] uppercase">
                        {review.products?.category?.name}
                      </span>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    
                    <h3 className="text-base font-extrabold text-[#18181B] mt-1.5" >
                      {review.products?.name}
                    </h3>
                    
                    <h4 className="font-bold text-xs text-[#18181B] mt-3.5 tracking-tight select-text">
                      &ldquo;{review.title}&rdquo;
                    </h4>
                    <p className="mt-1 text-xs text-[#71717A] font-light leading-relaxed whitespace-pre-wrap select-text">
                      {review.body}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[rgba(232,227,216,0.45)] pt-4 select-none">
                    <div className="flex items-center gap-1.5 text-[9.5px] text-[#71717A] font-bold uppercase tracking-wider">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Received {review.helpful_count} helpful votes</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveModalReview({ review, productName: review.products?.name })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                        aria-label="Edit review"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(review.id, review.product_id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty Personal Reviews listing */
          <div className="rounded-3xl border border-dashed border-gray-250 p-16 text-center bg-white select-none">
            <Award className="mx-auto h-12 w-12 text-gray-200 mb-4" />
            <h3 className="font-bold text-lg text-[#18181B]" >No Ratings Posted</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto font-light leading-relaxed mt-1">
              You haven't posted any reviews yet. Share your experience with the community by writing ratings on your purchases!
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#18181B]/95 spring-transition"
            >
              Explore the Collections
            </Link>
          </div>
        )}
      </main>

      {/* Mount review form composer modal on editor click */}
      {activeModalReview && (
        <ReviewModal
          product={{
            id: activeModalReview.review.product_id,
            name: activeModalReview.productName,
            avg_rating: 0,
            review_count: 0,
            description: '',
            images: [],
            category: '',
          } as any}
          isOpen={!!activeModalReview}
          onClose={() => {
            setActiveModalReview(null);
            queryClient.invalidateQueries({ queryKey: ['my-reviews', dbProfile?.id] });
          }}
          existingReview={activeModalReview.review}
        />
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[rgba(232,227,216,0.45)] p-6 shadow-2xl animate-scale-up text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-500 mb-4 animate-bounce" />
            <h4 className="font-bold text-lg text-[#18181B]" >Delete Review?</h4>
            <p className="mt-2 text-xs leading-relaxed text-[#71717A] font-light">
              Are you sure you want to permanently delete this review? Your average ratings and helpful counts will be updated.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmReview(null)}
                className="rounded-xl border border-[rgba(232,227,216,0.8)] px-4 py-2 text-xs font-bold text-[#71717A] hover:bg-[#F5F0E8] spring-transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReview}
                disabled={deleteReviewMutation.isPending}
                className="rounded-xl bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600 spring-transition disabled:opacity-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
