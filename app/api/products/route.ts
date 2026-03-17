import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchProductsFromSheets } from '@/lib/google-sheets';
import { getProductsFromStore, isPriceAuthorityEnabled, FALLBACK_VALID_DURATION_MS } from '@/lib/price-store';
import { FreshnessMetadata } from '@/types';

export const dynamic = 'force-dynamic';

// Fuzzy matching threshold - allow up to 2 character differences
const MAX_FUZZY_MATCH_DISTANCE = 2;

// Simple Levenshtein distance function for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const tenantId = session.user.tenantId;

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
        const storeData = await getProductsFromStore(tenantId);
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
          max_valid_duration_ms: FALLBACK_VALID_DURATION_MS,
        };
      }
    } else {
      // Feature flag OFF - use existing Google Sheets fetching
      products = await fetchProductsFromSheets();
      freshness = {
        price_list_version: 0,
        server_generated_timestamp: Date.now(),
        max_valid_duration_ms: FALLBACK_VALID_DURATION_MS,
      };
    }

    // Apply search filter with multi-word, additional fields, and fuzzy matching
    if (search) {
      const searchWords = search.toLowerCase().trim().split(/\s+/);

      products = products.filter(p => {
        // For each word, check if it matches at least one field
        return searchWords.every(word => {
          const searchableFields = [
            p.brand,
            p.model,
            p.variant,
            p.quickPitch,
            p.bankOffers,
            p.upgradeExchangeOffers,
            p.storeOffersGifts,
          ];

          // Try exact match first
          const exactMatch = searchableFields.some(field =>
            field && field.toLowerCase().includes(word)
          );

          if (exactMatch) return true;

          // Try fuzzy match for words longer than 4 characters
          if (word.length > 4) {
            return searchableFields.some(field => {
              if (!field) return false;
              const fieldLower = field.toLowerCase();
              // Check for fuzzy match within the field
              const fieldWords = fieldLower.split(/\s+/);
              return fieldWords.some(fieldWord =>
                levenshteinDistance(word, fieldWord) <= MAX_FUZZY_MATCH_DISTANCE
              );
            });
          }

          return false;
        });
      });
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

    const response = NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      perPage,
      hasMore: endIndex < total,
      freshness,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error in products API:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
