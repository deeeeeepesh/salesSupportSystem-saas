import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchProductsFromSheets } from '@/lib/google-sheets';
import { getProductsFromStore, isPriceAuthorityEnabled } from '@/lib/price-store';
import { FreshnessMetadata } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') as 'newLaunch' | 'weeklyFocus' | 'allModels' | null;
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const ram = searchParams.get('ram')?.split(',').map(Number).filter(Boolean) || [];
    const rom = searchParams.get('rom')?.split(',').map(Number).filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') as 'latest' | 'priceLow' | 'priceHigh' | 'brandAZ' || 'latest';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    // Fetch products - use price authority if enabled, otherwise fall back to Google Sheets
    let products;
    let freshness: FreshnessMetadata;
    
    if (isPriceAuthorityEnabled()) {
      try {
        const storeData = await getProductsFromStore();
        products = storeData.products;
        freshness = {
          price_list_version: storeData.version,
          server_generated_timestamp: Date.now(),
          max_valid_duration_ms: storeData.maxValidDurationMs,
        };
      } catch (error) {
        console.error('[Products API] Failed to fetch from price store:', error);
        // Fallback to Google Sheets if store fails
        products = await fetchProductsFromSheets();
        freshness = {
          price_list_version: 0,
          server_generated_timestamp: Date.now(),
          max_valid_duration_ms: 120000, // 2 minutes default
        };
      }
    } else {
      // Feature flag OFF - use existing Google Sheets fetching
      products = await fetchProductsFromSheets();
      freshness = {
        price_list_version: 0,
        server_generated_timestamp: Date.now(),
        max_valid_duration_ms: 120000, // 2 minutes default
      };
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.brand.toLowerCase().includes(searchLower) ||
        p.model.toLowerCase().includes(searchLower) ||
        p.variant.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filter === 'newLaunch') {
      products = products.filter(p => p.newLaunch);
    } else if (filter === 'weeklyFocus') {
      products = products.filter(p => p.weeklyFocus);
    } else if (filter === 'allModels') {
      products = products.filter(p => p.allModels);
    }

    // Apply brand filter
    if (brands.length > 0) {
      products = products.filter(p => brands.includes(p.brand));
    }

    // Apply price filter
    if (minPrice !== undefined) {
      products = products.filter(p => p.mop !== null && p.mop >= minPrice);
    }
    if (maxPrice !== undefined) {
      products = products.filter(p => p.mop !== null && p.mop <= maxPrice);
    }

    // Apply RAM filter
    if (ram.length > 0) {
      products = products.filter(p => p.ram !== null && ram.includes(p.ram));
    }

    // Apply ROM filter
    if (rom.length > 0) {
      products = products.filter(p => p.rom !== null && rom.includes(p.rom));
    }

    // Apply sorting
    products.sort((a, b) => {
      switch (sortBy) {
        case 'priceLow':
          return (a.mop || Infinity) - (b.mop || Infinity);
        case 'priceHigh':
          return (b.mop || 0) - (a.mop || 0);
        case 'brandAZ':
          return a.brand.localeCompare(b.brand);
        case 'latest':
        default:
          // Sort by last updated, newest first
          const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return dateB - dateA;
      }
    });

    // Pagination
    const total = products.length;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      perPage,
      hasMore: endIndex < total,
      freshness,
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
