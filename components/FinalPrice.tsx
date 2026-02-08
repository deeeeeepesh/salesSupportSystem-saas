'use client';

import { useState, useEffect } from 'react';
import { formatPrice, isSelloutActive } from '@/lib/utils';

interface FinalPriceProps {
  finalPrice: number | null;
  selloutFinal: number | null;
  selloutFromDate: string | null;
  selloutToDate: string | null;
  userRole: string;
}

export function FinalPrice({ finalPrice, selloutFinal, selloutFromDate, selloutToDate, userRole }: FinalPriceProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

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

  // Determine which price to display based on sellout status
  const isActiveSellout = isSelloutActive(selloutFromDate, selloutToDate) && selloutFinal !== null;
  const priceToDisplay = isActiveSellout ? selloutFinal : finalPrice;

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
            {isRevealed && priceToDisplay !== null ? formatPrice(priceToDisplay) : 'MOP is the best'}
          </span>
        </div>
      </div>
    </div>
  );
}
