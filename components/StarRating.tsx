'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  rating,
  interactive = false,
  onRatingChange,
  size = 'md',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const handleStarClick = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const handleStarMouseEnter = (selectedRating: number) => {
    if (interactive) {
      setHoverRating(selectedRating);
    }
  };

  const handleStarMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  const renderStar = (index: number) => {
    const starIndex = index + 1;

    if (interactive) {
      const isGold = starIndex <= (hoverRating ?? rating);
      return (
        <button
          key={index}
          type="button"
          onClick={() => handleStarClick(starIndex)}
          onMouseEnter={() => handleStarMouseEnter(starIndex)}
          className="spring-transition hover:scale-110 focus:outline-none cursor-pointer"
          aria-label={`Rate ${starIndex} out of 5 stars`}
        >
          <Star
            className={`${starSizes[size]} ${
              isGold ? 'fill-[#CA8A04] text-[#CA8A04]' : 'fill-transparent text-[rgba(232,227,216,0.8)]'
            } transition-colors duration-200`}
          />
        </button>
      );
    }

    const difference = rating - index;
    let fillWidth = '0%';
    if (difference >= 1) {
      fillWidth = '100%';
    } else if (difference > 0) {
      fillWidth = `${difference * 100}%`;
    }

    return (
      <div key={index} className="relative inline-block select-none">
        <Star className={`${starSizes[size]} fill-[rgba(232,227,216,0.8)] text-[rgba(232,227,216,0.8)]`} />
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: fillWidth }}
        >
          <Star className={`${starSizes[size]} fill-[#CA8A04] text-[#CA8A04]`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={handleStarMouseLeave}
    >
      {[...Array(5)].map((_, i) => renderStar(i))}
    </div>
  );
}
