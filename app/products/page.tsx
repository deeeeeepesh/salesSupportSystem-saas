'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCacheRefresh } from '@/hooks/useCacheRefresh';

// Loading component
function ProductsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading products...</div>
    </div>
  );
}

// Products content component that uses useSearchParams
function ProductsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [selectedRam, setSelectedRam] = useState<number[]>([]);
  const [selectedRom, setSelectedRom] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('latest');
  const [filter, setFilter] = useState(searchParams.get('filter') || '');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/products?perPage=1000');
      const data = await res.json();
      const uniqueBrands = Array.from(new Set(data.products.map((p: Product) => p.brand))).sort();
      setBrands(uniqueBrands as string[]);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  }, []);

  const fetchProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        perPage: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedBrands.length > 0) params.append('brands', selectedBrands.join(','));
      if (minPrice) params.append('minPrice', minPrice.toString());
      if (maxPrice) params.append('maxPrice', maxPrice.toString());
      if (selectedRam.length > 0) params.append('ram', selectedRam.join(','));
      if (selectedRom.length > 0) params.append('rom', selectedRom.join(','));
      if (sortBy) params.append('sortBy', sortBy);
      if (filter) params.append('filter', filter);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (reset) {
        setProducts(data.products);
      } else {
        setProducts(prev => [...prev, ...data.products]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
      setError('');
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, selectedBrands, minPrice, maxPrice, selectedRam, selectedRom, sortBy, filter]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBrands();
      fetchProducts(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, searchTerm, selectedBrands, minPrice, maxPrice, selectedRam, selectedRom, sortBy, filter]);

  // Listen for cache refresh events and reload products
  useCacheRefresh(useCallback(() => {
    if (status === 'authenticated') {
      fetchBrands();
      fetchProducts(1, true);
    }
  }, [status, fetchBrands, fetchProducts]));

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1, false);
    }
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSelectedRam([]);
    setSelectedRom([]);
    setSearchTerm('');
    setFilter('');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 max-w-2xl">
              <SearchBar 
                placeholder="Search by brand, model, or variant..." 
                onSearch={setSearchTerm}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <FilterPanel
                brands={brands}
                selectedBrands={selectedBrands}
                onBrandsChange={setSelectedBrands}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
                selectedRam={selectedRam}
                onRamChange={setSelectedRam}
                selectedRom={selectedRom}
                onRomChange={setSelectedRom}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={handleLoadMore} 
                      disabled={loadingMore}
                      variant="outline"
                      size="lg"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Products'}
                    </Button>
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="text-center mt-8 text-sm text-muted-foreground">
                    You&apos;ve reached the end of the list
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
