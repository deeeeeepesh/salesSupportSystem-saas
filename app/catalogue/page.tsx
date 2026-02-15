'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ProductSlider from '@/components/ProductSlider';
import ProductSliderSkeleton from '@/components/ProductSliderSkeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Product, ProductsResponse } from '@/types';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useCacheRefresh } from '@/hooks/useCacheRefresh';
import { usePriceFreshness } from '@/hooks/usePriceFreshness';
import { FreshnessBadge } from '@/components/PriceFreshnessGuard';

export default function CataloguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [weeklyFocus, setWeeklyFocus] = useState<Product[]>([]);
  const [allModels, setAllModels] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Price freshness hook
  const {
    state: freshnessState,
    updateFreshness,
  } = usePriceFreshness({
    onVersionMismatch: useCallback(() => {
      console.log('[Catalogue] Version mismatch - refetching products');
      fetchProducts(false); // Background refresh - don't show skeleton
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    onExpired: useCallback(() => {
      console.log('[Catalogue] Prices expired - auto-refreshing');
      fetchProducts(false); // Background refresh - don't show skeleton
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchProducts = useCallback(async (isInitialLoad: boolean = true) => {
    try {
      // Only show loading skeleton on initial page load, not on background refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const [newArrivalsRes, weeklyFocusRes, allModelsRes] = await Promise.all([
        fetch('/api/products?filter=newLaunch&perPage=10'),
        fetch('/api/products?filter=weeklyFocus&perPage=10'),
        fetch('/api/products?filter=allModels&perPage=10'),
      ]);

      const [newArrivalsData, weeklyFocusData, allModelsData]: [ProductsResponse, ProductsResponse, ProductsResponse] = await Promise.all([
        newArrivalsRes.json(),
        weeklyFocusRes.json(),
        allModelsRes.json(),
      ]);

      // Update freshness from first response (all should have same metadata)
      if (newArrivalsData.freshness) {
        updateFreshness(newArrivalsData.freshness);
      }

      setNewArrivals(newArrivalsData.products || []);
      setWeeklyFocus(weeklyFocusData.products || []);
      setAllModels(allModelsData.products || []);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [updateFreshness]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts(true); // Initial load - show skeleton
    }
  }, [status, fetchProducts]);

  // Listen for cache refresh events and reload products
  useCacheRefresh({ 
    onRefresh: useCallback(() => {
      if (status === 'authenticated') {
        fetchProducts(false); // Background refresh - don't show skeleton
      }
    }, [status, fetchProducts])
  });

  // Build suggestions from all products
  const suggestions = useMemo(() => {
    const allProducts = [...newArrivals, ...weeklyFocus, ...allModels];
    const brandSet = new Set<string>();
    const modelSet = new Set<string>();
    
    allProducts.forEach(p => {
      brandSet.add(p.brand);
      modelSet.add(`${p.brand} ${p.model}`);
    });
    
    return [
      ...Array.from(brandSet).map(b => ({ type: 'brand' as const, value: b })),
      ...Array.from(modelSet).map(m => ({ type: 'model' as const, value: m })),
    ];
  }, [newArrivals, weeklyFocus, allModels]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/products?search=${encodeURIComponent(value)}`);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const userInitials = session?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <SearchBar placeholder="Search products..." onSubmit={handleSearch} suggestions={suggestions} />
            </div>
            <div className="flex items-center gap-2">
              <FreshnessBadge state={freshnessState} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session?.user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <>
              <ProductSliderSkeleton title="New Arrivals" />
              <ProductSliderSkeleton title="Weekly Focus" />
              <ProductSliderSkeleton title="All Models" />
            </>
          ) : (
            <>
              <ProductSlider
                title="New Arrivals"
                products={newArrivals}
                viewAllLink="/products?filter=newLaunch"
                freshnessState={freshnessState}
              />

              <ProductSlider
                title="Weekly Focus"
                products={weeklyFocus}
                viewAllLink="/products?filter=weeklyFocus"
                freshnessState={freshnessState}
              />

              <ProductSlider
                title="All Models"
                products={allModels}
                viewAllLink="/products?filter=allModels"
                freshnessState={freshnessState}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
