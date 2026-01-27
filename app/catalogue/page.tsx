'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ProductSlider from '@/components/ProductSlider';
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
import { Product } from '@/types';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function CataloguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [weeklyFocus, setWeeklyFocus] = useState<Product[]>([]);
  const [allModels, setAllModels] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const [newArrivalsRes, weeklyFocusRes, allModelsRes] = await Promise.all([
        fetch('/api/products?filter=newLaunch&perPage=10'),
        fetch('/api/products?filter=weeklyFocus&perPage=10'),
        fetch('/api/products?filter=allModels&perPage=10'),
      ]);

      const [newArrivalsData, weeklyFocusData, allModelsData] = await Promise.all([
        newArrivalsRes.json(),
        weeklyFocusRes.json(),
        allModelsRes.json(),
      ]);

      setNewArrivals(newArrivalsData.products || []);
      setWeeklyFocus(weeklyFocusData.products || []);
      setAllModels(allModelsData.products || []);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/products?search=${encodeURIComponent(value)}`);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
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
              <SearchBar placeholder="Search products..." onSearch={handleSearch} />
            </div>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <ProductSlider
            title="New Arrivals"
            products={newArrivals}
            viewAllLink="/products?filter=newLaunch"
          />

          <ProductSlider
            title="Weekly Focus"
            products={weeklyFocus}
            viewAllLink="/products?filter=weeklyFocus"
          />

          <ProductSlider
            title="All Models"
            products={allModels}
            viewAllLink="/products?filter=allModels"
          />
        </div>
      </main>
    </div>
  );
}
