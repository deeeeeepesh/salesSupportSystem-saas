export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { isPriceAuthorityEnabled, startBackgroundSync } = await import('./lib/price-store');
    
    if (isPriceAuthorityEnabled()) {
      console.log('[Instrumentation] Price authority enabled - starting background sync');
      startBackgroundSync();
    } else {
      console.log('[Instrumentation] Price authority disabled - using legacy caching');
    }
  }
}
