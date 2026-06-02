# Fix: Infinite Recursion + Avg Time Bug

## Problems
1. **Infinite recursion error** when assigning mechanics to bookings
2. **Avg time showing 0 minutes** in KPI dashboard despite having completed bookings

## Root Causes
1. **Infinite Recursion**: Atomic functions missing `SECURITY DEFINER` - they use caller's RLS permissions which creates infinite loop when checking user role
2. **Avg Time Bug**: Old completed bookings don't have `actual_duration` calculated (only new bookings after the atomic function fix have it)

## Solution

### Step 1: Run Diagnostic (Optional)
```sql
-- Run this in Supabase SQL Editor to see current state
-- File: database/scripts/diagnose-avg-time-and-rls.sql
```

This will show:
- Which functions are missing `SECURITY DEFINER`
- How many bookings are missing `actual_duration`
- Current RLS policies
- Whether triggers still exist

### Step 2: Apply Complete Fix
```sql
-- Run this in Supabase SQL Editor
-- File: database/scripts/COMPLETE_FIX_RLS_AND_AVG_TIME.sql
```

This script will:
1. ✅ Drop and recreate ALL atomic functions with `SECURITY DEFINER`
2. ✅ Backfill missing `actual_duration` for old completed bookings
3. ✅ Remove any remaining triggers
4. ✅ Verify all fixes were applied correctly

### Step 3: Test
1. **Test Assign Mechanic**: Go to admin dashboard and assign a mechanic to a booking
   - Should work without "infinite recursion" error
2. **Test KPI Dashboard**: Go to admin KPI dashboard
   - Avg time should now show correct values (not 0 minutes)

## Technical Details

### Why SECURITY DEFINER?
Without `SECURITY DEFINER`, the function runs with the caller's permissions. When a mechanic tries to update a booking:
1. Function tries to UPDATE bookings table
2. RLS policy checks if user is mechanic by querying users table
3. This triggers another RLS check
4. Which triggers another check... → **infinite recursion**

With `SECURITY DEFINER`, the function runs with the function owner's permissions (bypasses RLS), but we still validate assignments inside the function for security.

### Why Backfill actual_duration?
The KPI calculation filters for bookings with `actual_duration`:
```typescript
const completedWithProgress = bookings?.filter(b => 
  b.status === 'done' && 
  b.service_progress && 
  Array.isArray(b.service_progress) && 
  b.service_progress[0]?.actual_duration  // ← This filters out old bookings
) || [];
```

Old bookings completed before the atomic function fix don't have `actual_duration`, so they're excluded from the average calculation.

## Files Changed
- `database/scripts/diagnose-avg-time-and-rls.sql` (new - diagnostic)
- `database/scripts/COMPLETE_FIX_RLS_AND_AVG_TIME.sql` (new - complete fix)

## Related Files
- `database/scripts/FIX_ALL_ATOMIC_FUNCTIONS.sql` (had the right solution but wasn't applied)
- `database/migrations/007_atomic_status_functions.sql` (missing SECURITY DEFINER)
- `frontend/src/lib/kpi/calculations.ts` (KPI calculation logic)
