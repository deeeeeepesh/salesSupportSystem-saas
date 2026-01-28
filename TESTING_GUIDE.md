# Testing Guide for Auto-Refresh & Single Device Login Features

This guide provides step-by-step instructions for testing the new features.

## Prerequisites

Before testing, ensure:

1. **Database is set up**:
   ```bash
   npm run db:migrate:deploy
   ```

2. **Redis is running** (optional but recommended):
   ```bash
   # If using Docker:
   docker run -d -p 6379:6379 redis:latest
   
   # Or install locally
   # Mac: brew install redis && brew services start redis
   # Linux: sudo apt install redis-server && sudo systemctl start redis
   ```

3. **Environment variables are configured**:
   ```bash
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   REDIS_URL="redis://localhost:6379"  # Optional but recommended
   ```

4. **Application is running**:
   ```bash
   npm run dev
   ```

---

## Test 1: Auto-Refresh All Open Sessions

### Objective
Verify that when an admin refreshes the cache, all open browser sessions automatically show new data.

### Steps

1. **Prepare test environment**:
   - Open the application in Browser Tab 1 (e.g., Chrome Tab 1)
   - Open the application in Browser Tab 2 (e.g., Chrome Tab 2)
   - Login as an admin user in Tab 1
   - Login as any user (admin or regular) in Tab 2

2. **Navigate to products page**:
   - In both tabs, navigate to the products listing page
   - Note the current products displayed

3. **Update data source** (simulate data change):
   - Update your Google Sheets data source with new product information
   - Or modify existing product data in the sheet

4. **Trigger cache refresh**:
   - In Tab 1 (admin), navigate to the admin page
   - Click the "Refresh Cache" button
   - You should see a success message

5. **Verify auto-refresh**:
   - **Expected**: Tab 2 should automatically show updated products WITHOUT manually refreshing (F5)
   - Check browser console in Tab 2 for message: "Product data refreshed automatically"
   - The product list should update within 1-2 seconds

6. **Check SSE connection**:
   - Open browser DevTools → Network tab
   - Look for connection to `/api/cache/events`
   - Should show as "EventStream" with status 200 (ongoing)
   - Should have heartbeat comments every 30 seconds

### Expected Results

✅ **Pass Criteria**:
- Tab 2 shows updated data automatically
- No manual page refresh (F5) needed
- Console shows "Product data refreshed automatically"
- SSE connection remains active in Network tab

❌ **Failure Scenarios**:
- If Tab 2 doesn't update: Check Redis connection
- If SSE connection fails: Check browser console for errors
- If no products show: Check Google Sheets API credentials

### Without Redis

If Redis is not available:
- Feature will degrade gracefully
- Console will show: "Redis not available, skipping publish"
- Manual refresh (F5) will still work
- Auto-refresh will not work (expected behavior)

---

## Test 2: Single Device Login - Basic Flow

### Objective
Verify that a user can only be logged in on one device at a time.

### Steps

1. **Login on Device A**:
   - Open the application in Browser A (e.g., Chrome)
   - Login with user credentials (e.g., user@example.com)
   - Navigate to any page (e.g., products page)
   - Verify you're logged in successfully

2. **Login on Device B with same user**:
   - Open the application in Browser B (e.g., Firefox)
   - Login with the SAME user credentials (user@example.com)
   - Verify successful login on Browser B

3. **Check Device A**:
   - **Expected**: Browser A should show a yellow notification box
   - Message: "You've been logged out because you logged in on another device"
   - This should appear within 1-2 seconds

4. **Try to navigate on Device A**:
   - Try clicking any link or navigating to another page
   - **Expected**: Should be redirected to login page
   - URL should contain `?message=logged-out-another-device`

5. **Verify Device B still works**:
   - Navigate to different pages in Browser B
   - Should work normally without issues

### Expected Results

✅ **Pass Criteria**:
- Device A shows logout notification immediately
- Device A redirected to login on navigation attempts
- Device B continues working normally
- Notification is user-friendly and dismissable

❌ **Failure Scenarios**:
- If Device A doesn't logout: Check database migration applied
- If no notification shows: Check `SessionMonitor` component loaded
- If SSE connection fails: Check `/api/auth/session-events` endpoint

---

## Test 3: Single Device Login - Periodic Validation

### Objective
Verify that session validation works even if SSE connection is lost.

### Steps

1. **Login on Device A**:
   - Login with user credentials in Browser A
   - Keep browser open and active

2. **Simulate SSE failure** (optional):
   - Open DevTools → Network tab
   - Right-click on `/api/auth/session-events` connection
   - Select "Block request URL" or close the connection

3. **Login on Device B**:
   - Login with same user in Browser B
   - Wait up to 5 minutes

4. **Check Device A**:
   - After maximum 5 minutes, Device A should detect invalid session
   - Should be logged out even without SSE working
   - This tests the polling fallback mechanism

### Expected Results

✅ **Pass Criteria**:
- Device A logs out within 5 minutes (validation interval)
- Polling validation works as fallback when SSE fails

---

## Test 4: Multiple Logins (Ping-Pong Test)

### Objective
Verify that rapid logins between devices work correctly.

### Steps

1. **Rapid login sequence**:
   - Login on Device A → Device A active
   - Login on Device B → Device A logged out, Device B active
   - Login on Device A → Device B logged out, Device A active
   - Login on Device B → Device A logged out, Device B active

2. **Verify each transition**:
   - Each time, previous device should show logout notification
   - New device should work normally
   - No session conflicts or errors

### Expected Results

✅ **Pass Criteria**:
- Each login properly invalidates previous session
- No database errors or race conditions
- Clear user feedback on each device

---

## Test 5: Database Migration Verification

### Objective
Verify that database schema was updated correctly.

### Steps

1. **Check users table**:
   ```sql
   -- Connect to your PostgreSQL database
   \d users
   
   -- Or use a GUI tool to inspect the users table
   ```

2. **Verify new columns exist**:
   - `activeSessionId` column (TEXT, nullable)
   - `lastLoginAt` column (TIMESTAMP, nullable)

3. **Check data after login**:
   ```sql
   SELECT id, email, "activeSessionId", "lastLoginAt" 
   FROM users 
   WHERE email = 'your-test-user@example.com';
   ```

4. **Verify values**:
   - `activeSessionId` should be a UUID string
   - `lastLoginAt` should be recent timestamp

### Expected Results

✅ **Pass Criteria**:
- Both columns exist in users table
- After login, fields are populated with valid data
- UUID format for activeSessionId

---

## Test 6: Error Handling & Edge Cases

### Test 6.1: Redis Unavailable

**Setup**: Stop Redis server or set invalid `REDIS_URL`

**Expected**:
- Application starts successfully
- Console warnings: "Redis not available"
- Cache refresh still works (no auto-update to clients)
- Single device login still works (using polling)

### Test 6.2: Database Connection Lost

**Setup**: Stop database temporarily

**Expected**:
- New logins fail with error
- Existing sessions continue working (JWT-based)
- Session validation fails gracefully

### Test 6.3: SSE Connection Interrupted

**Setup**: Block SSE endpoint in browser DevTools

**Expected**:
- Browser automatically attempts to reconnect
- Polling validation continues working
- Session eventually detected as invalid (within 5 minutes)

### Test 6.4: Concurrent Logins

**Setup**: Attempt 2+ logins for same user simultaneously

**Expected**:
- No database errors
- Last successful login wins
- Other sessions invalidated
- No race condition issues

---

## Test 7: Backward Compatibility

### Objective
Verify that existing users without session data can still login.

### Steps

1. **Reset user's session data**:
   ```sql
   UPDATE users 
   SET "activeSessionId" = NULL, "lastLoginAt" = NULL 
   WHERE email = 'test@example.com';
   ```

2. **Login with that user**:
   - Should login successfully
   - New session ID should be generated
   - Fields should be populated in database

3. **Verify session works**:
   - Navigate to different pages
   - Should work normally
   - Single device login should work for future logins

### Expected Results

✅ **Pass Criteria**:
- Users with NULL session fields can login
- Session fields populated on login
- Feature works for subsequent logins

---

## Test 8: Performance & Scalability

### Objective
Verify system performance with multiple users.

### Monitoring Points

1. **Database queries**:
   - Session validation: ~1 query per user per 5 minutes
   - Login: 2 queries (fetch user, update session)
   - Should not cause significant load

2. **Redis connections**:
   - 2 connections total (publisher + subscriber)
   - Not per-user, so scales well

3. **SSE connections**:
   - 1 connection per active browser tab
   - Lightweight (heartbeat only)

4. **Memory usage**:
   - Should remain stable over time
   - No memory leaks from SSE connections

### Tools

- Monitor with: `htop`, `pg_stat_activity`, Redis `INFO` command
- Check browser memory in DevTools → Memory tab

---

## Troubleshooting

### Issue: Auto-refresh not working

**Checks**:
1. Is Redis running? `redis-cli ping` should return "PONG"
2. Is `REDIS_URL` configured correctly?
3. Check browser console for SSE errors
4. Check `/api/cache/events` returns 200 in Network tab

**Solution**:
- Restart Redis server
- Verify environment variable
- Check firewall settings

### Issue: Session not invalidating

**Checks**:
1. Database migration applied? Check users table schema
2. Is `activeSessionId` being set on login?
3. Check browser console for session validation errors
4. Check `/api/auth/session-events` endpoint

**Solution**:
- Run `npm run db:migrate:deploy`
- Clear browser cache and login again
- Check NextAuth configuration

### Issue: Build fails

**Checks**:
1. Run `npm install`
2. Run `npx prisma generate`
3. Check TypeScript errors with `npm run lint`

**Solution**:
- Delete `node_modules` and reinstall
- Delete `.next` folder and rebuild

---

## Success Criteria Summary

### Feature 1: Auto-Refresh
- ✅ Multiple tabs update automatically
- ✅ No manual refresh needed
- ✅ Works within 1-2 seconds
- ✅ SSE connection stable

### Feature 2: Single Device Login
- ✅ Previous device logged out
- ✅ User-friendly notification shown
- ✅ Redirect to login on navigation
- ✅ New device works normally
- ✅ Polling fallback works

### Performance
- ✅ No significant database load increase
- ✅ No memory leaks
- ✅ Graceful degradation without Redis

---

## Test Results Template

Use this template to document your test results:

```
Test Date: ____________________
Tester: ____________________
Environment: [ ] Development [ ] Staging [ ] Production

Test 1: Auto-Refresh All Sessions
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 2: Single Device Login - Basic
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 3: Periodic Validation
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 4: Multiple Logins
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 5: Database Migration
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 6: Error Handling
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 7: Backward Compatibility
- [ ] PASS  [ ] FAIL  Notes: ________________

Test 8: Performance
- [ ] PASS  [ ] FAIL  Notes: ________________

Overall Status: [ ] All Tests Pass [ ] Issues Found
```

---

## Additional Notes

- Always test in an environment similar to production
- Use different browsers/incognito modes to simulate different devices
- Monitor logs for any warnings or errors
- Document any unexpected behavior

For questions or issues, refer to `FEATURES_IMPLEMENTATION.md` for technical details.
