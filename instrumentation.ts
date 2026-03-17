export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { isPriceAuthorityEnabled } = await import('./lib/price-store');

    if (isPriceAuthorityEnabled()) {
      console.log('[Instrumentation] Price authority enabled - per-tenant sync available via /api/price-sync');
    } else {
      console.log('[Instrumentation] Price authority disabled - using legacy caching');
    }
  }
}
