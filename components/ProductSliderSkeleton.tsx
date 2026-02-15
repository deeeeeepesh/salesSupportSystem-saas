'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductSliderSkeletonProps {
  title: string;
  count?: number;
}

const DEFAULT_SKELETON_COUNT = 5;

export default function ProductSliderSkeleton({ title, count = DEFAULT_SKELETON_COUNT }: ProductSliderSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button variant="outline" disabled>View All</Button>
      </div>
      
      <div className="relative group">
        {/* Scroll buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Horizontal scroll container with skeleton cards */}
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[...Array(count)].map((_, index) => (
            <div key={index} className="flex-none w-[280px]">
              {/* Skeleton Card */}
              <div className="rounded-lg border bg-yellow-50 shadow-sm overflow-hidden animate-pulse">
                {/* Skeleton Image */}
                <div className="relative aspect-square bg-gray-200" />
                
                {/* Skeleton Content */}
                <div className="p-4 space-y-3">
                  {/* Skeleton Title */}
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  
                  {/* Skeleton Description */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                  
                  {/* Skeleton Price */}
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  
                  {/* Skeleton Button */}
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
