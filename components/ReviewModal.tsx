'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Product, Review } from '@/types';
import StarRating from './StarRating';
import { useAddReview } from '@/hooks/useAddReview';
import { useEditReview } from '@/hooks/useEditReview';
import { useUser } from '@clerk/nextjs';

interface ReviewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  existingReview: Review | null;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export default function ReviewModal({
  product,
  isOpen,
  onClose,
  existingReview,
}: ReviewModalProps) {
  const { user } = useUser();
  const addReviewMutation = useAddReview();
  const editReviewMutation = useEditReview();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize values if editing
  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating);
        setTitle(existingReview.title || '');
        setBody(existingReview.body || '');
        setStep(1); // Start at Step 1, but loaded
      } else {
        setRating(0);
        setTitle('');
        setBody('');
        setStep(1);
      }
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1 && rating > 0) {
      setStep(2);
    } else if (step === 2) {
      if (!title.trim()) {
        setErrorMessage('Please enter a review title.');
        return;
      }
      if (body.trim().length < 20) {
        setErrorMessage('Your review must be at least 20 characters.');
        return;
      }
      setErrorMessage(null);
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      if (existingReview) {
        // Edit mode
        await editReviewMutation.mutateAsync({
          id: existingReview.id,
          productId: product.id,
          rating,
          title,
          body,
        });
      } else {
        // Create mode
        await addReviewMutation.mutateAsync({
          productId: product.id,
          rating,
          title,
          body,
        });
      }
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your review.');
    }
  };

  const isLoading = addReviewMutation.isPending || editReviewMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-md select-none animate-fade-in">
      {/* Centered Modal Frame */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-[rgba(232,227,216,0.8)] shadow-2xl transition-all duration-300">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#F5F0E8] px-6 py-4.5 bg-[#F5F0E8]">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#71717A] uppercase">
              {existingReview ? 'Modify Review' : 'New Review'}
            </span>
            <h3 className="font-display text-lg font-bold text-[#18181B] line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#71717A] hover:bg-[#E2E8F0] hover:text-[#18181B] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        {!isSuccess && (
          <div className="flex h-1.5 w-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full bg-[#18181B] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Form Body Frame */}
        <div className="p-6 md:p-8 min-h-[280px] flex flex-col justify-between">
          
          {isSuccess ? (
            /* Success Feedback Animation */
            <div className="flex flex-col items-center justify-center py-10 text-center animate-scale-up">
              <CheckCircle2 className="h-16 w-16 text-[#CA8A04] stroke-[1.5]" />
              <h4 className="mt-4 font-display text-2xl font-bold text-[#18181B]">
                Review Submitted
              </h4>
              <p className="mt-1.5 text-xs text-[#71717A] font-light">
                Thank you. Your feedback helps verified buyers shop with trust.
              </p>
            </div>
          ) : (
            <>
              {/* Error Callout */}
              {errorMessage && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                  {errorMessage}
                </div>
              )}

              {/* Step Forms */}
              <div className="flex-1">
                {step === 1 && (
                  /* Step 1: Rate It */
                  <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
                    <p className="text-sm font-semibold text-[#18181B] mb-4">
                      How would you rate this product?
                    </p>
                    <div className="flex justify-center scale-110">
                      <StarRating
                        rating={rating}
                        interactive
                        onRatingChange={setRating}
                        size="lg"
                      />
                    </div>
                    {rating > 0 && (
                      <span className="mt-4 inline-block rounded-full bg-[#CA8A04]/10 px-4 py-1 text-sm font-bold text-[#CA8A04] tracking-wide animate-scale-up">
                        {RATING_LABELS[rating]}
                      </span>
                    )}
                  </div>
                )}

                {step === 2 && (
                  /* Step 2: Write It */
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
                        Review Title
                      </label>
                      <input
                        type="text"
                        placeholder="Summarize your experience..."
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value.slice(0, 100));
                          setErrorMessage(null);
                        }}
                        className="w-full rounded-lg border border-[rgba(232,227,216,0.8)] px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none bg-[#F5F0E8] focus:bg-white transition-all"
                        maxLength={100}
                        required
                      />
                      <span className="text-[10px] text-right block mt-1 text-[#71717A] font-light">
                        {title.length} / 100 chars
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-1.5">
                        Your Review
                      </label>
                      <textarea
                        placeholder="Tell us what you loved or disliked about it..."
                        value={body}
                        onChange={(e) => {
                          setBody(e.target.value.slice(0, 1000));
                          setErrorMessage(null);
                        }}
                        rows={5}
                        className="w-full rounded-lg border border-[rgba(232,227,216,0.8)] px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none bg-[#F5F0E8] focus:bg-white transition-all resize-none"
                        maxLength={1000}
                        required
                      />
                      <div className="flex justify-between mt-1 text-[10px] text-[#71717A] font-light">
                        <span>Min. 20 characters</span>
                        <span>{body.length} / 1000 chars</span>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  /* Step 3: Review Preview Card */
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#71717A]">
                      Review Preview
                    </p>
                    
                    <div className="rounded-xl border border-[rgba(232,227,216,0.8)] p-5 bg-[#F5F0E8] shadow-sm select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={user?.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt="Your avatar"
                            className="h-8 w-8 rounded-full object-cover border border-[rgba(232,227,216,0.8)]"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#18181B] block">
                              {user?.fullName || 'Verified Buyer'}
                            </span>
                            <span className="text-[9px] text-[#71717A] font-light">Preview Mode</span>
                          </div>
                        </div>
                        <StarRating rating={rating} size="sm" />
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="font-bold text-xs text-[#18181B]">{title || 'No Title'}</h5>
                        <p className="mt-1 text-xs text-[#71717A] font-light leading-relaxed whitespace-pre-wrap">
                          {body || 'No review written yet.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons footer */}
              <div className="flex items-center justify-between border-t border-[#F5F0E8] pt-6 mt-6 select-none">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,227,216,0.8)] px-5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#F5F0E8] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={step === 1 ? rating === 0 : false}
                    className="inline-flex items-center gap-2 rounded-full bg-[#18181B] px-5 py-2 text-xs font-semibold text-[#F5F0E8] hover:bg-[#CA8A04] hover:text-[#18181B] transition-all disabled:opacity-40 disabled:hover:bg-[#18181B] disabled:hover:text-[#F5F0E8] cursor-pointer"
                  >
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full bg-[#CA8A04] px-6 py-2.5 text-xs font-bold text-[#18181B] hover:bg-[#18181B] hover:text-[#F5F0E8] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
