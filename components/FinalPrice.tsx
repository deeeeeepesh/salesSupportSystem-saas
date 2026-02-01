'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

interface FinalPriceProps {
  finalPrice: number | null;
  mop: number | null;
  userRole: string;
}

export function FinalPrice({ finalPrice, mop, userRole }: FinalPriceProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Only show to store_manager and admin
  if (userRole !== 'STORE_MANAGER' && userRole !== 'ADMIN') {
    return null;
  }

  const handleDoubleClick = () => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Reveal the price
    setIsRevealed(true);

    // Set new timeout to hide after 10 seconds
    const newTimeoutId = setTimeout(() => {
      setIsRevealed(false);
    }, 10000);

    setTimeoutId(newTimeoutId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/30">
      <div
        onDoubleClick={handleDoubleClick}
        className="cursor-pointer select-none transition-all hover:bg-muted/50 p-2 rounded"
        title="Double-click to reveal"
      >
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Final Price:</span>
          <span className={`text-lg font-semibold ${isRevealed ? 'text-primary' : 'text-muted-foreground'}`}>
            {isRevealed && finalPrice !== null ? formatPrice(finalPrice) : 'MOP is the best'}
          </span>
        </div>
        {!isRevealed && (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Double-click to reveal (10s timer)
          </p>
        )}
      </div>
    </div>
  );
}
