# Troubleshooting Admin Booking Detail 404 Error

## Problem
When clicking on a booking detail in admin panel, the page shows 404 Not Found.
URL: `localhost:3000/admin/bookings/ee0a2490-ef55-4e03-8cdb-8f803c95cf88`

## Root Cause Analysis
The file `frontend/src/app/admin/bookings/[id]/page.tsx` exists and has no syntax errors. This suggests a **runtime error** during data fetching or a **Next.js cache issue**.

## Solution Steps

### Step 1: Clear Next.js Cache
```bash
cd frontend
rmdir /s /q .next
npm run dev
```

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try accessing the booking detail page again
4. Look for any JavaScript errors (red text)
5. **Report any errors you see**

### Step 3: Check Terminal/Dev Server Logs
1. Look at the terminal where `npm run dev` is running
2. Try accessing the booking detail page again
3. Look for any error messages in the terminal
4. **Report any errors you see**

### Step 4: Verify Database Has the Booking
Run this query in Supabase SQL Editor:
```sql
SELECT 
  b.id,
  b.status,
  b.customer_id,
  u.name as customer_name,
  u.email as customer_email
FROM bookings b
LEFT JOIN users u ON u.id = b.customer_id
WHERE b.id = 'ee0a2490-ef55-4e03-8cdb-8f803c95cf88';
```

If this returns no rows, the booking doesn't exist in the database.

### Step 5: Check RLS Policies
The query might be blocked by Row Level Security. Run this as the admin user:
```sql
-- Check if admin can see bookings
SELECT id, status, customer_id 
FROM bookings 
LIMIT 5;

-- Check if admin can see users
SELECT id, name, email, role 
FROM users 
LIMIT 5;
```

If these queries return empty results, RLS policies might be blocking admin access.

### Step 6: Test with Simplified Query
Temporarily simplify the query in `page.tsx` to isolate the issue:

```typescript
// Replace the complex query with this simple one:
const { data: booking, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('id', id)
  .single();

console.log('Booking query result:', { booking, error });

if (!booking) {
  console.log('Booking not found, calling notFound()');
  notFound();
}
```

This will help identify if the issue is with the complex join query.

## Common Causes

### 1. Next.js Cache Issue (Most Likely)
- **Symptom**: Page worked before, now shows 404
- **Solution**: Clear `.next` folder and restart dev server

### 2. Runtime Error in Data Fetch
- **Symptom**: Error in browser console or terminal
- **Solution**: Check console/terminal logs, fix the error

### 3. RLS Policy Blocking Query
- **Symptom**: Query returns no data even though booking exists
- **Solution**: Check RLS policies in `database/migrations/002_rls_policies.sql`

### 4. Supabase Client Session Issue
- **Symptom**: User not authenticated properly
- **Solution**: Check if admin is logged in, try logging out and back in

## Quick Test
Try accessing a different booking ID from the list page. If all booking details show 404, it's likely a cache or code issue. If only specific bookings show 404, it's likely a data or RLS issue.

## Next Steps
1. Clear cache first (Step 1)
2. Check console and terminal for errors (Steps 2-3)
3. Report findings so we can proceed with the appropriate fix
