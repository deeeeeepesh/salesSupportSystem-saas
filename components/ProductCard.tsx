import React from 'react';
import Link from 'next/link';
import { Product, PriceFreshnessState } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, isSelloutActive } from '@/lib/utils';
import { PriceFreshnessGuard } from '@/components/PriceFreshnessGuard';

interface ProductCardProps {
  product: Product;
  freshnessState?: PriceFreshnessState; // Optional, defaults to 'VALID' for backward compatibility
}

export default function ProductCard({ product, freshnessState = 'VALID' }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer bg-yellow-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Badges */}
            <div className="flex gap-1 flex-wrap">
              {isSelloutActive(product.selloutFromDate, product.selloutToDate) && product.selloutMop !== null && (
                <Badge className="text-xs bg-green-500 hover:bg-green-600 text-white">Sellout</Badge>
              )}
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
            
            {/* Price with freshness guard */}
            <PriceFreshnessGuard state={freshnessState}>
              <div className="space-y-1">
                {isSelloutActive(product.selloutFromDate, product.selloutToDate) && product.selloutMop !== null ? (
                  <>
                    {/* Sellout MOP - big and bold */}
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(product.selloutMop)}
                    </p>
                    {/* Original MOP - smaller, not strikethrough */}
                    {product.mop && (
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.mop)}
                      </p>
                    )}
                    {/* MRP - strikethrough */}
                    {product.mrp && product.mrp !== product.selloutMop && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.mrp)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Normal display: MOP big and bold */}
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(product.mop)}
                    </p>
                    {/* MRP strikethrough */}
                    {product.mrp && product.mrp !== product.mop && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.mrp)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </PriceFreshnessGuard>
            
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
