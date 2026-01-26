import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, getPlaceholderImage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image || getPlaceholderImage();
  
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="relative w-full h-48 mb-3">
            <Image
              src={imageUrl}
              alt={`${product.brand} ${product.model}`}
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getPlaceholderImage();
              }}
            />
          </div>
          
          <div className="space-y-2">
            {/* Badges */}
            <div className="flex gap-1 flex-wrap">
              {product.newLaunch && (
                <Badge variant="destructive" className="text-xs">New Launch</Badge>
              )}
              {product.weeklyFocus && (
                <Badge variant="default" className="text-xs">Weekly Focus</Badge>
              )}
            </div>
            
            {/* Brand & Model */}
            <h3 className="font-semibold text-lg line-clamp-2">
              {product.brand} {product.model}
            </h3>
            
            {/* Variant */}
            <p className="text-sm text-muted-foreground">{product.variant}</p>
            
            {/* Price */}
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(product.mop)}
              </p>
              {product.mrp && product.mrp !== product.mop && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.mrp)}
                </p>
              )}
            </div>
            
            {/* Quick Pitch Preview */}
            {product.quickPitch && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {product.quickPitch}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
