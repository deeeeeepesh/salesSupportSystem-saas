import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProductById } from '@/lib/google-sheets';
import { getProductsFromStore, isPriceAuthorityEnabled, FALLBACK_VALID_DURATION_MS } from '@/lib/price-store';
import { FreshnessMetadata } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let product;
    let freshness: FreshnessMetadata;

    if (isPriceAuthorityEnabled()) {
      try {
        const storeData = await getProductsFromStore();
        product = storeData.products.find(p => p.id === params.id);
        freshness = {
          price_list_version: storeData.version,
          server_generated_timestamp: Date.now(),
          max_valid_duration_ms: storeData.maxValidDurationMs,
        };
      } catch (error) {
        console.error('[Product API] Failed to fetch from price store:', error);
        // Fallback to Google Sheets
        product = await getProductById(params.id);
        freshness = {
          price_list_version: 0,
          server_generated_timestamp: Date.now(),
          max_valid_duration_ms: FALLBACK_VALID_DURATION_MS,
        };
      }
    } else {
      // Feature flag OFF - use existing Google Sheets fetching
      product = await getProductById(params.id);
      freshness = {
        price_list_version: 0,
        server_generated_timestamp: Date.now(),
        max_valid_duration_ms: FALLBACK_VALID_DURATION_MS,
      };
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ ...product, freshness });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
