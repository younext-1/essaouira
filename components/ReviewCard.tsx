'use client';

import { useState } from 'react';
import { ThumbsUp, Trash2, Edit3, Check } from 'lucide-react';
import { Review } from '@/types';
import StarRating from './StarRating';
import { useHelpfulVote } from '@/hooks/useHelpfulVote';
import { useUser } from '@clerk/nextjs';

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  const helpfulMutation = useHelpfulVote(review.product_id);

  const isOwner = user?.id === review.user_id;
  const hasVoted = review.has_voted || false;

  const handleHelpfulClick = () => {
    if (!user) {
      alert('Please sign in to vote.');
      return;
    }
    helpfulMutation.mutate({ reviewId: review.id, hasVoted });
  };

  const formattedDate = new Date(review.created_at || '').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const bodyText = review.body || '';
  const shouldTruncate = bodyText.length > 240;
  const displayBody = isExpanded ? bodyText : `${bodyText.slice(0, 240)}...`;

  return (
    <div className="rounded-[24px] glass-premium-white border border-[rgba(232,227,216,0.45)] p-6 shadow-sm spring-transition hover-lift animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={review.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={review.profiles?.full_name || 'Anonymous Reviewer'}
            className="h-11 w-11 rounded-full object-cover border border-[rgba(232,227,216,0.45)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#18181B]">
                {review.profiles?.full_name || 'Verified Buyer'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#CA8A04]/10 px-2 py-0.5 text-[9px] font-bold text-[#CA8A04] tracking-wider uppercase select-none">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
                Verified
              </span>
            </div>
            <span className="text-[10px] text-[#71717A] font-light">{formattedDate}</span>
          </div>
        </div>

        <div className="shrink-0">
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-display font-bold text-sm text-[#18181B] tracking-tight">{review.title}</h4>
        <p className="mt-2 text-xs leading-relaxed text-[#71717A] font-light whitespace-pre-wrap">
          {shouldTruncate && !isExpanded ? displayBody : review.body}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2.5 text-xs font-semibold text-[#18181B] hover:text-[#CA8A04] transition-colors focus:outline-none cursor-pointer"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(232,227,216,0.45)] pt-4 select-none">
        <button
          onClick={handleHelpfulClick}
          disabled={helpfulMutation.isPending}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold spring-transition active-push cursor-pointer ${
            hasVoted
              ? 'bg-[#CA8A04]/10 border-[#CA8A04] text-[#CA8A04] shadow-sm'
              : 'border-[rgba(232,227,216,0.8)] bg-transparent text-[#71717A] hover:border-[#CA8A04] hover:text-[#18181B]'
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? 'fill-[#CA8A04] text-[#CA8A04]' : ''}`} />
          <span>Helpful ({review.helpful_count})</span>
        </button>

        {isOwner && (
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#71717A] hover:text-[#18181B] spring-transition active-push cursor-pointer"
                aria-label="Edit review"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 spring-transition active-push cursor-pointer"
                aria-label="Delete review"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
