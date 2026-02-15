'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatDate, isSelloutActive } from '@/lib/utils';
import { ArrowLeft, Tag, Smartphone } from 'lucide-react';
import { FinalPrice } from '@/components/FinalPrice';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePriceFreshness } from '@/hooks/usePriceFreshness';
import { PriceFreshnessGuard, FreshnessBadge } from '@/components/PriceFreshnessGuard';

export default function ProductDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { trackPageView } = useAnalytics();

  // Price freshness hook
  const {
    state: freshnessState,
    updateFreshness,
  } = usePriceFreshness({
    onVersionMismatch: useCallback(() => {
      console.log('[ProductDetail] Version mismatch - refetching product');
      fetchProduct();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    onExpired: useCallback(() => {
      console.log('[ProductDetail] Prices expired - auto-refreshing');
      fetchProduct();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      
      if (!res.ok) {
        throw new Error('Product not found');
      }
      
      const data = await res.json();
      
      // Extract freshness metadata
      if (data.freshness) {
        updateFreshness(data.freshness);
        delete data.freshness; // Remove from product object
      }
      
      setProduct(data);
      
      // Track page view
      trackPageView();
    } catch (err) {
      setError('Failed to load product details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="p-8 text-center">
            <p className="text-lg text-red-600">{error || 'Product not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button and Freshness Badge */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <FreshnessBadge state={freshnessState} />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Product Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {isSelloutActive(product.selloutFromDate, product.selloutToDate) && product.selloutMop !== null && (
                <Badge className="text-sm bg-green-500 hover:bg-green-600 text-white">Sellout</Badge>
              )}
              {product.newLaunch && (
                <Badge variant="destructive" className="text-sm">New Launch</Badge>
              )}
              {product.weeklyFocus && (
                <Badge variant="default" className="text-sm">Weekly Focus</Badge>
              )}
              {product.allModels && (
                <Badge variant="secondary" className="text-sm">All Models</Badge>
              )}
            </div>

            {/* Brand & Model */}
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {product.brand} {product.model}
              </h1>
              <p className="text-xl text-muted-foreground">{product.variant}</p>
            </div>

            {/* Price */}
            <PriceFreshnessGuard state={freshnessState}>
              <div className="space-y-2">
                {isSelloutActive(product.selloutFromDate, product.selloutToDate) && product.selloutMop !== null ? (
                  <>
                    {/* Sellout MOP - big and bold */}
                    <div className="text-5xl font-bold text-primary">
                      {formatPrice(product.selloutMop)}
                    </div>
                    {/* Original MOP - smaller, not strikethrough */}
                    {product.mop && (
                      <div className="text-xl text-muted-foreground">
                        {formatPrice(product.mop)}
                      </div>
                    )}
                    {/* MRP - strikethrough with savings badge */}
                    {product.mrp && product.mrp !== product.selloutMop && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-muted-foreground line-through">
                          {formatPrice(product.mrp)}
                        </span>
                        <Badge variant="outline" className="text-green-600">
                          Save {formatPrice(product.mrp - (product.selloutMop || 0))}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Normal display: MOP big and bold */}
                    <div className="text-5xl font-bold text-primary">
                      {formatPrice(product.mop)}
                    </div>
                    {/* MRP strikethrough with savings badge */}
                    {product.mrp && product.mrp !== product.mop && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-muted-foreground line-through">
                          {formatPrice(product.mrp)}
                        </span>
                        <Badge variant="outline" className="text-green-600">
                          Save {formatPrice(product.mrp - (product.mop || 0))}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
                
                {/* Final Price - Only visible to Store Manager and Admin */}
                <FinalPrice 
                  finalPrice={product.finalPrice}
                  selloutFinal={product.selloutFinal}
                  selloutFromDate={product.selloutFromDate}
                  selloutToDate={product.selloutToDate}
                  userRole={session?.user?.role || ''}
                />
              </div>
            </PriceFreshnessGuard>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.ram && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">RAM</span>
                    <span className="font-medium">{product.ram}GB</span>
                  </div>
                )}
                {product.rom && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">{product.rom}GB</span>
                  </div>
                )}
                {product.selloutFromDate && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Sellout From</span>
                    <span className="font-medium">{formatDate(product.selloutFromDate)}</span>
                  </div>
                )}
                {product.selloutToDate && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Sellout To</span>
                    <span className="font-medium">{formatDate(product.selloutToDate)}</span>
                  </div>
                )}
                {product.lastUpdated && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">{formatDate(product.lastUpdated)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Pitch */}
            {product.quickPitch && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Pitch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.quickPitch}</p>
                </CardContent>
              </Card>
            )}

            {/* Bank Offers */}
            {product.bankOffers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Bank Offers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.bankOffers}</p>
                </CardContent>
              </Card>
            )}

            {/* Upgrade/Exchange Offers */}
            {product.upgradeExchangeOffers && (
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade / Exchange Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.upgradeExchangeOffers}</p>
                </CardContent>
              </Card>
            )}

            {/* Store Offers and Gifts */}
            {product.storeOffersGifts && (
              <Card>
                <CardHeader>
                  <CardTitle>Store Offers and Gifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.storeOffersGifts}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
