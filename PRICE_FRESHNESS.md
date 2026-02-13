# Price Freshness System

## Overview

The Price Freshness System eliminates silent stale pricing by ensuring customers always see accurate, up-to-date prices or are clearly blocked from viewing expired data.

**Core Principle: Fail loudly > be fast. Correctness > availability.**

## Architecture

### Backend Components

1. **Database Layer** (`prisma/schema.prisma`)
   - `PriceListMeta`: Singleton table tracking price version, sync status, and validity window
   - `CachedProduct`: Persistent storage of product prices with versioning

2. **Price Store** (`lib/price-store.ts`)
   - `syncFromGoogleSheets()`: Fetches from Google Sheets → PostgreSQL with SHA-256 change detection
   - `getProductsFromStore()`: Reads from PostgreSQL (never touches Google Sheets)
   - `getVersionInfo()`: Lightweight endpoint for version polling (~100 bytes)
   - `startBackgroundSync()`: Runs sync every 2 minutes (configurable)

3. **API Routes**
   - `/api/products` & `/api/products/[id]`: Include freshness metadata in responses
   - `/api/price-version`: Lightweight polling endpoint for version checks
   - `/api/price-sync`: Admin-only manual sync trigger

4. **Instrumentation** (`instrumentation.ts`)
   - Starts background sync on server startup when feature flag is enabled

### Client Components

1. **Freshness Hook** (`hooks/usePriceFreshness.ts`)
   - State machine: `VALID`, `STALE_REFRESHING`, `EXPIRED_BLOCKED`, `OFFLINE_VALID`, `OFFLINE_EXPIRED`
   - Hard expiry timer: Blocks prices exactly at `max_valid_duration_ms`
   - Fast start: Loads from localStorage (&lt;100ms) then validates
   - Background checks: 30s polling + visibility/online events + SSE

2. **UI Guards** (`components/PriceFreshnessGuard.tsx`)
   - `PriceFreshnessGuard`: Wraps price content, blocks/overlays based on state
   - `FreshnessBadge`: Status indicator for headers

3. **Integration**
   - `ProductCard`: Optional `freshnessState` prop (defaults to `VALID`)
   - All pages (`products`, `catalogue`, `product/[id]`) use `usePriceFreshness()`

## Configuration

### Environment Variables

```bash
# Feature flag - set to 'false' to disable and use legacy caching
PRICE_AUTHORITY_ENABLED="true"

# Client-side freshness window - default 5 minutes (300000 ms)
PRICE_MAX_VALID_MS="300000"

# Server background sync interval - default 2 minutes (120000 ms)
PRICE_SYNC_INTERVAL_MS="120000"
```

### Feature Flag Behavior

**When `PRICE_AUTHORITY_ENABLED=true` (default):**
- Prices stored in PostgreSQL with versioning
- Background sync every 2 minutes
- Clients poll for version changes
- Hard expiry blocks after 5 minutes

**When `PRICE_AUTHORITY_ENABLED=false`:**
- Falls back to existing Google Sheets in-memory cache
- All freshness indicators show `VALID`
- System behaves exactly as before

## Freshness States

| State | Description | UI Behavior |
|-------|-------------|-------------|
| `VALID` | Data fresh within validity window | Show prices normally |
| `OFFLINE_VALID` | Offline but data still valid | Show prices + "Offline" badge |
| `STALE_REFRESHING` | Expired but refresh in progress | Show prices with opacity + overlay |
| `EXPIRED_BLOCKED` | Hard expired | **BLOCK** prices with red error |
| `OFFLINE_EXPIRED` | Offline and data expired | **BLOCK** prices with gray error |

## Data Flow

```
1. Server Startup
   └─> instrumentation.ts
       └─> startBackgroundSync()
           └─> Initial sync + interval (every 2 min)

2. Background Sync (every 2 min)
   └─> lib/price-store.ts: syncFromGoogleSheets()
       ├─> Fetch from Google Sheets
       ├─> Compute SHA-256 hash
       ├─> If changed: Atomic DB update
       │   ├─> Delete old products
       │   ├─> Insert new products
       │   └─> Increment version
       └─> Publish Redis event: cache:refresh

3. Client Request
   └─> /api/products
       ├─> getProductsFromStore() → PostgreSQL
       └─> Return: { products, freshness: { version, timestamp, max_valid } }

4. Client Freshness Engine
   └─> usePriceFreshness()
       ├─> Fast start: Load from localStorage
       ├─> Validate: GET /api/price-version
       ├─> Set hard expiry timer
       └─> Background checks:
           ├─> 30s polling
           ├─> Visibility change
           ├─> Online event
           └─> SSE cache:refresh
```

## Migration Steps

### 1. Run Database Migration

```bash
npm run db:migrate
# Or in production:
npx prisma migrate deploy
```

This creates:
- `price_list_meta` table (singleton)
- `cached_products` table with version indexing

### 2. Initial Sync

On first deployment, the system will:
1. Create `PriceListMeta` record with version 0
2. Fetch from Google Sheets on first API call
3. Populate `CachedProduct` table
4. Start background sync

### 3. Monitor Sync Status

Check logs for:
```
[PriceStore] Starting background sync...
[PriceStore] Sync complete: version 1, 250 products
```

### 4. Admin Manual Sync

Admins can trigger manual sync:
```bash
POST /api/price-sync
# Requires ADMIN role
# Returns: { success: true, version: 2, productsCount: 250 }
```

## Backward Compatibility

### ProductCard Component
The `freshnessState` prop is **optional** with a default of `'VALID'`. Existing usages without the prop will continue to work:

```typescript
// Old code - still works
<ProductCard product={product} />

// New code - with freshness
<ProductCard product={product} freshnessState={freshnessState} />
```

### API Responses
All API responses include `freshness` metadata **additively**. Existing fields remain unchanged:

```typescript
// Old response structure still present
{ products: [...], total: 100, page: 1, perPage: 20, hasMore: true }

// New field added
{ products: [...], total: 100, page: 1, perPage: 20, hasMore: true, 
  freshness: { price_list_version: 5, server_generated_timestamp: 1234567890, max_valid_duration_ms: 300000 } }
```

## Security Considerations

1. **Admin-only sync trigger**: `/api/price-sync` requires ADMIN role
2. **Version info authenticated**: `/api/price-version` requires valid session
3. **No user-facing version manipulation**: Version only incremented by server
4. **SHA-256 change detection**: Prevents unnecessary DB writes
5. **Sync lock**: Prevents concurrent syncs with `syncInProgress` flag

## Performance Optimizations

1. **Fast start**: localStorage snapshot loads in <100ms
2. **Lightweight polling**: `/api/price-version` returns ~100 bytes
3. **Change detection**: Only writes to DB when data actually changes
4. **Indexed queries**: Version and brand indexes on `cached_products`
5. **SSE multiplexing**: Single Redis pub/sub per channel

## Troubleshooting

### Prices Not Updating
1. Check background sync logs: `[PriceStore] Sync complete`
2. Verify Google Sheets credentials: `GOOGLE_SHEETS_CREDENTIALS`
3. Check database connection: `DATABASE_URL`
4. Trigger manual sync: `POST /api/price-sync` (ADMIN)

### Prices Blocked Unexpectedly
1. Check client time sync (freshness based on client timestamp)
2. Verify `PRICE_MAX_VALID_MS` value (default 5 minutes)
3. Check network connectivity (offline states)
4. Inspect localStorage: `price_freshness_snapshot`

### Feature Flag Not Working
1. Verify env var: `PRICE_AUTHORITY_ENABLED` must be string `"false"` to disable
2. Restart server to pick up changes
3. Check instrumentation logs: `[Instrumentation] Price authority enabled/disabled`

## Testing

### Manual Testing
1. **Feature flag ON**: Set `PRICE_AUTHORITY_ENABLED=true`, restart, verify DB sync
2. **Feature flag OFF**: Set `PRICE_AUTHORITY_ENABLED=false`, restart, verify fallback to Google Sheets
3. **Expiry timer**: Wait 5 minutes on a page, verify prices become blocked
4. **Offline mode**: Disconnect network, verify offline states
5. **Version mismatch**: Manually increment DB version, verify refetch

### Monitoring
- Server logs: `[PriceStore]` prefix
- Client logs: `[PriceFreshness]` prefix
- Redis pub/sub: `cache:refresh` channel
- Database: `price_list_meta.version` and `cached_products` count

## Future Enhancements

1. **Configurable validity per user role** (e.g., longer for admins)
2. **Push notifications** instead of polling (via WebSockets)
3. **Historical price tracking** (retain old versions)
4. **A/B testing** for validity windows
5. **Metrics dashboard** for sync health and freshness states
