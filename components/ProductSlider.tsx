'use client';

import React, { useRef } from 'react';
import { Product, PriceFreshnessState } from '@/types';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProductSliderProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
  freshnessState?: PriceFreshnessState;
}

export default function ProductSlider({ title, products, viewAllLink, freshnessState = 'VALID' }: ProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink}>
            <Button 
              className="px-6 py-3 text-base font-semibold rounded-lg border-0 shadow-sm hover:shadow-md transition-all"
              style={{ 
                backgroundColor: '#EEFF00', 
                color: '#000000',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D4E600'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EEFF00'}
            >
              View All
            </Button>
          </Link>
        )}
      </div>
      
      <div className="relative group">
        {/* Scroll buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[280px]">
              <ProductCard product={product} freshnessState={freshnessState} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
