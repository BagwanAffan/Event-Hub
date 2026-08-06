'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  className,
  showText = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  const displayRating = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              className={cn(
                'transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm',
                !readOnly && 'hover:scale-110 cursor-pointer',
                readOnly && 'cursor-default'
              )}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <Star
                className={cn(
                  starSizes[size],
                  'transition-colors duration-150',
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]'
                    : 'fill-slate-200 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                )}
              />
            </button>
          );
        })}
      </div>
      {showText && (
        <span className={cn('text-slate-700 dark:text-slate-300 ml-1', textSizes[size])}>
          {value > 0 ? value.toFixed(1) : 'Unrated'}
        </span>
      )}
    </div>
  );
}
