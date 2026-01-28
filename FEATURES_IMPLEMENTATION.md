# Auto-Refresh & Single Device Login Implementation

This document describes the implementation of two key features: Auto-Refresh All Open Sessions and Single Device Login.

## Feature 1: Auto-Refresh All Open Sessions After Cache Refresh

### Overview
When an admin refreshes the cache, all users with the application open automatically see the new data without needing to manually refresh their browser (F5).

### How It Works

1. **Redis Pub/Sub System** (`lib/redis.ts`):
   - Provides pub/sub functionality for broadcasting events
   - Creates publisher and subscriber clients
   - Handles connection errors and reconnection

2. **SSE Endpoint** (`app/api/cache/events/route.ts`):
   - Server-Sent Events endpoint that clients connect to
   - Listens for `cache:refresh` events from Redis
   - Sends real-time updates to all connected clients
   - Includes heartbeat mechanism to keep connections alive

3. **Updated Cache Refresh API** (`app/api/cache/refresh/route.ts`):
   - When admin clicks "Refresh Cache", broadcasts message to Redis channel
   - All connected clients receive the notification via SSE

4. **Client Hook** (`hooks/useCacheRefresh.ts`):
   - Subscribes to SSE endpoint on component mount
   - When cache refresh event received, calls `queryClient.invalidateQueries()`
   - React Query automatically refetches all active queries
   - Includes automatic reconnection on connection loss

5. **Integration** (`app/layout.tsx`):
   - `SessionMonitor` component is added to the app layout
   - The hook is initialized through the SessionMonitor component
   - All pages automatically benefit from auto-refresh

### Usage

No manual intervention required. The system works automatically:

1. Admin navigates to admin page and clicks "Refresh Cache"
2. Server broadcasts cache refresh event
3. All connected clients receive the event
4. Each client automatically refetches their data
5. Users see updated data without page refresh

### Requirements

- Redis server must be configured (set `REDIS_URL` environment variable)
- If Redis is not available, the feature gracefully degrades (no auto-refresh, but manual refresh still works)

---

## Feature 2: Single Device Login

### Overview
A user can only be logged in on ONE device at a time. When a user logs in on a new device, previous sessions are automatically invalidated.

### How It Works

1. **Database Schema** (`prisma/schema.prisma`):
   - Added `activeSessionId` field to store the current active session
   - Added `lastLoginAt` field to track last login time

2. **Session Management** (`lib/session.ts`):
   - `generateSessionId()`: Creates unique session IDs using UUIDs
   - `updateUserSession()`: Updates user's active session in database and broadcasts invalidation
   - `validateSession()`: Checks if a session ID matches the active one
   - `clearUserSession()`: Clears user's active session

3. **Auth Configuration** (`lib/auth.ts`):
   - On sign in, generates a unique session ID
   - Stores session ID in JWT token
   - Updates user's `activeSessionId` in database
   - Broadcasts session invalidation event to previous devices

4. **Session Validation API** (`app/api/auth/validate-session/route.ts`):
   - Validates if a session ID is still active
   - Called periodically by clients to check session validity

5. **Session Events SSE** (`app/api/auth/session-events/route.ts`):
   - Real-time session invalidation notifications
   - Each user subscribes to their own channel
   - Receives immediate notification when logged in elsewhere

6. **Client Hook** (`hooks/useSessionCheck.ts`):
   - Subscribes to session invalidation events
   - Validates session every 30 seconds
   - Automatically signs out user if session invalidated
   - Redirects to login page with informative message

7. **UI Component** (`components/SessionMonitor.tsx`):
   - Displays message when logged out due to another device login
   - Shows: "You've been logged out because you logged in on another device"
   - Dismissable notification

8. **TypeScript Types** (`types/next-auth.d.ts`):
   - Extended NextAuth types to include `sessionId` in session and JWT

### Usage

The system works automatically:

1. **User A logs in on Device 1**:
   - Session ID generated: `abc123`
   - Stored in database as `activeSessionId`
   - Stored in JWT token

2. **User A logs in on Device 2**:
   - New session ID generated: `xyz789`
   - Database updated with new `activeSessionId`
   - Broadcast sent to Device 1: "session invalidated"

3. **Device 1 receives invalidation**:
   - SSE event or periodic validation detects mismatch
   - User automatically signed out
   - Notification displayed
   - Redirected to login page

### Security Considerations

- Session IDs are cryptographically secure UUIDs
- Session validation happens both via SSE (immediate) and polling (every 30s)
- Backward compatible: Users without `activeSessionId` can still log in
- Graceful degradation: If Redis unavailable, polling still works

### Requirements

- Database must have migration applied (`prisma migrate deploy`)
- Redis recommended for real-time notifications (optional but recommended)

---

## Environment Variables

Required environment variables:

```bash
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"

# Optional but recommended for real-time features
REDIS_URL="redis://localhost:6379"
```

---

## Migration

To apply the database changes:

```bash
npm run db:migrate:deploy
# or
npx prisma migrate deploy
```

This adds:
- `activeSessionId TEXT` (nullable)
- `lastLoginAt TIMESTAMP` (nullable)

---

## Testing

### Testing Auto-Refresh:

1. Open the app in two browser tabs
2. Login as admin in one tab
3. Navigate to different pages in both tabs
4. In admin tab, click "Refresh Cache"
5. Observe both tabs automatically showing updated data

### Testing Single Device Login:

1. Login as a user on Browser A (e.g., Chrome)
2. Verify successful login
3. Login with same user on Browser B (e.g., Firefox)
4. Observe Browser A shows logout notification
5. Try to navigate in Browser A - should redirect to login
6. Browser B should work normally

---

## Architecture Decisions

### Why Server-Sent Events (SSE)?
- Simpler than WebSockets for one-way server-to-client communication
- Built-in reconnection logic in EventSource API
- Lower overhead than polling for most use cases
- Works with standard HTTP/HTTPS

### Why Redis Pub/Sub?
- Efficient broadcasting to multiple server instances
- Scales horizontally (multiple Next.js instances can share events)
- Persistence not required (ephemeral events)
- Battle-tested for real-time features

### Why Both SSE and Polling?
- SSE provides immediate notifications (best UX)
- Polling provides fallback if SSE connection drops
- Polling ensures session validity even without Redis

### Why Session IDs in JWT?
- Avoids database lookup on every request
- Session ID is non-sensitive metadata
- Enables stateless validation with occasional database checks

---

## Troubleshooting

### Auto-refresh not working:
1. Check if `REDIS_URL` is configured
2. Check Redis server is running
3. Check browser console for SSE connection errors
4. Verify `/api/cache/events` endpoint is accessible

### Single device login not working:
1. Run database migration
2. Check if `activeSessionId` column exists in users table
3. Verify session events endpoint `/api/auth/session-events`
4. Check browser console for session validation errors

### Build errors:
1. Run `npm install` to ensure all dependencies installed
2. Run `npx prisma generate` to regenerate Prisma client
3. Check TypeScript errors with `npm run lint`

---

## Future Enhancements

Possible improvements:

1. **Admin Dashboard**: Show currently active sessions per user
2. **Session History**: Track login history and locations
3. **Selective Refresh**: Refresh only specific data, not all queries
4. **Toast Notifications**: Show user-friendly toast when data refreshes
5. **Session Expiry Warning**: Warn users before auto-logout
6. **Multiple Device Support**: Allow N devices per user (configurable)

---

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── session-events/route.ts      # SSE for session invalidation
│   │   └── validate-session/route.ts    # Session validation endpoint
│   └── cache/
│       ├── events/route.ts              # SSE for cache refresh
│       └── refresh/route.ts             # Updated to broadcast events
├── layout.tsx                           # Integrated SessionMonitor
components/
└── SessionMonitor.tsx                   # UI for monitoring and notifications
hooks/
├── useCacheRefresh.ts                   # Auto-refresh hook
└── useSessionCheck.ts                   # Session validation hook
lib/
├── auth.ts                              # Updated NextAuth config
├── redis.ts                             # Redis pub/sub utilities
└── session.ts                           # Session management functions
prisma/
├── schema.prisma                        # Updated schema
└── migrations/
    └── 20260128164700_add_session_fields/
        └── migration.sql                # Migration file
types/
└── next-auth.d.ts                       # Extended NextAuth types
```
