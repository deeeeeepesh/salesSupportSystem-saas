# Testing Guide: Store Manager Role & User Analytics

## Prerequisites
1. Ensure database is migrated: `npm run db:migrate:deploy`
2. Ensure application is running: `npm run dev`
3. Have admin credentials ready for testing

## Test 1: Store Manager User Creation

### Steps:
1. Log in as an Admin user
2. Navigate to Admin panel
3. Click "Create User" button
4. Fill in the form:
   - Name: "Test Manager"
   - Email: "manager@test.com"
   - Password: "password123"
   - Role: Select "Store Manager" from dropdown
5. Click "Create User"

### Expected Results:
- ✅ User created successfully
- ✅ New user appears in users list with "Store Manager" badge
- ✅ Badge should be styled with secondary variant (different from Admin/Sales)

## Test 2: Store Manager Login & Final Price Visibility

### Steps:
1. Log out from admin account
2. Log in with the store manager credentials
3. Navigate to Catalogue page
4. Click on any product to view details

### Expected Results:
- ✅ Store Manager can access all pages that Sales users can access
- ✅ Product detail page displays normally
- ✅ Below MOP price, there should be a "Final Price" section
- ✅ Final Price should show text: "MOP is the best"
- ✅ Should display hint: "Double-click to reveal (10s timer)"

## Test 3: Final Price Double-Tap Reveal

### Steps:
1. While on a product detail page as Store Manager
2. Double-click on the Final Price section
3. Wait and observe for 10 seconds

### Expected Results:
- ✅ On double-click, actual Final Price is revealed (₹XX,XXX format)
- ✅ Text changes from "MOP is the best" to actual price
- ✅ After 10 seconds, price automatically hides
- ✅ Text returns to "MOP is the best"

## Test 4: Final Price - Role-Based Visibility

### Steps:
1. Log in as Sales user
2. Navigate to any product detail page
3. Observe the pricing section

### Expected Results:
- ✅ Sales user does NOT see Final Price section at all
- ✅ Only MRP and MOP prices are visible

### Steps (Admin):
1. Log in as Admin user
2. Navigate to any product detail page
3. Double-click Final Price section

### Expected Results:
- ✅ Admin CAN see Final Price section
- ✅ Double-click reveal works same as Store Manager
- ✅ Auto-hide after 10 seconds works

## Test 5: Analytics Tracking - Visit

### Steps:
1. Clear browser cache/use incognito mode
2. Log in as any user (Sales/Store Manager/Admin)
3. Navigate to Admin panel (as admin)
4. Scroll to "User Analytics" section

### Expected Results:
- ✅ User's "Visits" count incremented by 1
- ✅ "Last Active" shows recent timestamp (e.g., "Just now" or "1m ago")

## Test 6: Analytics Tracking - Page Views

### Steps:
1. As logged-in user, navigate to multiple product pages
2. Visit 5-10 different products
3. As admin, check User Analytics dashboard

### Expected Results:
- ✅ User's "Page Views" count matches number of products viewed
- ✅ Each product page visit increments the counter
- ✅ "Last Active" updates with each page view

## Test 7: Analytics Tracking - Duration

### Steps:
1. Log in as a user
2. Keep browser tab active for at least 1 minute
3. Switch to another tab for 30 seconds
4. Return to the app tab
5. As admin, check User Analytics after 2-3 minutes

### Expected Results:
- ✅ "Duration" shows accumulated time (e.g., "2m" or "3m")
- ✅ Duration only counts when tab is active (visible)
- ✅ Duration is cumulative across sessions
- ✅ Multiple sessions add to total duration

## Test 8: Analytics Tracking - Refreshes

### Steps:
1. Log in as a user
2. Press F5 or click browser refresh button 3 times
3. As admin, check User Analytics dashboard

### Expected Results:
- ✅ "Refreshes" count shows 3 (or incremented by 3)
- ✅ Each page reload increments the counter
- ✅ Normal navigation does NOT count as refresh

## Test 9: Admin Analytics Dashboard Display

### Steps:
1. Create multiple test users (Sales, Store Manager, Admin)
2. Have each user log in and interact with the app
3. Log in as Admin
4. Navigate to Admin panel
5. Scroll to "User Analytics" section

### Expected Results:
- ✅ Table displays with columns: User, Role, Visits, Page Views, Duration, Refreshes, Last Active
- ✅ All users are listed in the table
- ✅ Roles are correctly badged (ADMIN = default, STORE_MANAGER = secondary, SALES = outline)
- ✅ Role display shows "Store Manager" (not "STORE_MANAGER")
- ✅ Duration is formatted human-readable (e.g., "12h 30m", "2d 5h")
- ✅ Last Active shows relative time (e.g., "2h ago", "5m ago", "Never")
- ✅ Font-mono style on numeric columns for better readability

## Test 10: Cumulative Duration Across Sessions

### Steps:
1. Log in as a user
2. Stay active for 2 minutes
3. Check duration in admin dashboard (note the value)
4. Log out
5. Log back in with same user
6. Stay active for 2 more minutes
7. Check duration again

### Expected Results:
- ✅ Duration after step 3: ~2m
- ✅ Duration after step 7: ~4m (cumulative)
- ✅ Duration is NEVER reset
- ✅ Each session adds to the total

## Test 11: Data Integrity - Existing Users

### Steps:
1. Check existing Sales and Admin users
2. Verify they can still log in
3. Verify their permissions are unchanged
4. Check that their data is intact

### Expected Results:
- ✅ All existing users can log in normally
- ✅ Sales users still have Sales permissions (no admin access)
- ✅ Admin users still have Admin permissions
- ✅ No data loss or corruption
- ✅ Analytics fields default to 0 for existing users

## Test 12: Error Handling

### Steps:
1. Try to access `/api/analytics/users` as Sales user
2. Try to access `/api/analytics/users` as Store Manager
3. Try to create Store Manager user as Sales user

### Expected Results:
- ✅ Sales/Store Manager get 403 Forbidden on analytics endpoint
- ✅ Only Admin can access analytics endpoints
- ✅ Only Admin can create users
- ✅ Proper error messages displayed

## Performance Tests

### Test 13: Page Load Performance
- ✅ Product pages load in reasonable time with Final Price component
- ✅ Admin dashboard loads analytics without significant delay
- ✅ Analytics tracking happens in background (no UI blocking)

### Test 14: Analytics API Performance
- ✅ Analytics POST requests don't slow down navigation
- ✅ Duration tracking runs smoothly in background
- ✅ No console errors or warnings

## Security Considerations

- ✅ Final Price only visible to authorized roles
- ✅ Analytics endpoints protected by role checks
- ✅ No sensitive data exposed in client-side code
- ✅ Database queries use proper Prisma ORM (prevents SQL injection)

## Known Limitations

1. **Google Sheets**: Final Price column must exist in the spreadsheet at column Q (index 6 after MOP)
2. **Analytics Accuracy**: Duration tracking depends on browser visibility API
3. **Refresh Detection**: Uses Performance API which may not work in all browsers
4. **Auto-hide Timer**: Final Price auto-hides after exactly 10 seconds (not configurable)

## Troubleshooting

### Final Price Not Showing
- Check that user role is STORE_MANAGER or ADMIN
- Verify Google Sheets has Final Price column
- Check browser console for errors

### Analytics Not Updating
- Ensure user is authenticated
- Check browser console for API errors
- Verify database connection
- Check that analytics API endpoints are accessible

### Migration Issues
- Run: `npm run db:migrate:deploy`
- Verify DATABASE_URL is set correctly
- Check migration files in `prisma/migrations/`

## Success Criteria

✅ All tests pass
✅ No console errors
✅ No TypeScript errors
✅ Build completes successfully
✅ Linting passes
✅ Existing functionality unchanged
