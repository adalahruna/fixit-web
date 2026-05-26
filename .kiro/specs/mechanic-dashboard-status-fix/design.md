# Design Document: Mechanic Dashboard Status Badge Fix

## Overview

This design addresses a critical bug where the mechanic dashboard displays incorrect counts for "Sedang Dikerjakan" (In Progress) status. The user has confirmed that data exists in the service_progress table with in_progress status, but the dashboard query returns 0. This indicates a query logic, RLS policy, or data linkage issue rather than a data persistence problem.

The fix will follow a systematic diagnostic approach:
1. Create diagnostic queries to identify the exact failure point
2. Test and fix RLS policies if they're blocking legitimate queries
3. Correct the dashboard query logic to properly join and filter data
4. Verify mechanic-user linkage is correct
5. Add comprehensive error logging for future debugging
6. Create integration tests to prevent regression

## Architecture

### Current System Flow

```
Mechanic clicks "Mulai Servis"
  ↓
ServiceActionButtons component calls startService()
  ↓
startService() calls start_service_atomic() RPC function
  ↓
Database function updates:
  - service_progress.status = 'in_progress'
  - service_progress.start_time = NOW()
  - bookings.status = 'in_progress'
  ↓
revalidateBookingPaths() clears cache
  ↓
Dashboard re-renders with fresh query
  ↓
❌ Query returns 0 (BUG HERE)
```

### Problem Areas

The bug occurs in the dashboard query phase. Possible failure points:

1. **RLS Policy Blocking**: The mechanic role may not have SELECT permission on service_progress or bookings when joined with assignments
2. **Query Join Logic**: The inner join on assignments may be filtering out rows incorrectly
3. **Mechanic User Linkage**: The mechanic.user_id may not match auth.uid(), causing the mechanic record lookup to fail
4. **Status Field Mismatch**: The status value in the database may not exactly match 'in_progress' (whitespace, case sensitivity)
5. **Cache Not Invalidating**: Despite revalidate=0, Next.js may be serving stale data

### Diagnostic Strategy

We'll create a diagnostic script that tests each hypothesis systematically:

```typescript
// Diagnostic query sequence
1. Direct count from service_progress WHERE status = 'in_progress'
2. Direct count from bookings WHERE status = 'in_progress'  
3. Verify mechanic record exists for auth.uid()
4. Count assignments for mechanic
5. Test exact dashboard query with detailed logging
6. Test alternative query approaches
```

## Components and Interfaces

### 1. Diagnostic Script

**File**: `database/scripts/diagnose-dashboard-counts.sql`

```sql
-- Diagnostic script to identify dashboard count issue
-- Run this as the mechanic user to see what they can access

-- Test 1: Direct service_progress count
SELECT 
  'Test 1: Direct service_progress count' as test_name,
  COUNT(*) as count
FROM service_progress
WHERE status = 'in_progress';

-- Test 2: Direct bookings count
SELECT 
  'Test 2: Direct bookings count' as test_name,
  COUNT(*) as count
FROM bookings
WHERE status = 'in_progress';

-- Test 3: Mechanic record lookup
SELECT 
  'Test 3: Mechanic record' as test_name,
  m.id,
  m.name,
  m.user_id,
  auth.uid() as current_user_id,
  (m.user_id = auth.uid()) as user_id_matches
FROM mechanics m
WHERE m.user_id = auth.uid();

-- Test 4: Assignments count
SELECT 
  'Test 4: Assignments for mechanic' as test_name,
  COUNT(*) as count
FROM assignments a
JOIN mechanics m ON a.mechanic_id = m.id
WHERE m.user_id = auth.uid();

-- Test 5: Current dashboard query (exact replica)
SELECT 
  'Test 5: Dashboard query' as test_name,
  COUNT(*) as count
FROM bookings b
JOIN assignments a ON b.id = a.booking_id
JOIN mechanics m ON a.mechanic_id = m.id
WHERE m.user_id = auth.uid()
AND b.status = 'in_progress';

-- Test 6: Alternative query via service_progress
SELECT 
  'Test 6: Via service_progress' as test_name,
  COUNT(*) as count
FROM service_progress sp
JOIN assignments a ON sp.booking_id = a.booking_id
JOIN mechanics m ON a.mechanic_id = m.id
WHERE m.user_id = auth.uid()
AND sp.status = 'in_progress';

-- Test 7: Show actual data (not just count)
SELECT 
  'Test 7: Actual in_progress bookings' as test_name,
  b.id as booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  a.mechanic_id,
  m.name as mechanic_name,
  m.user_id as mechanic_user_id
FROM bookings b
LEFT JOIN service_progress sp ON b.id = sp.booking_id
LEFT JOIN assignments a ON b.id = a.booking_id
LEFT JOIN mechanics m ON a.mechanic_id = m.id
WHERE sp.status = 'in_progress' OR b.status = 'in_progress';
```

### 2. RLS Policy Fix

**File**: `database/migrations/008_fix_dashboard_rls.sql`

The current RLS policies may be too restrictive. We need to ensure mechanics can read:
- Their own assignments
- Bookings assigned to them
- Service progress for their assigned bookings

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Staff can manage service progress" ON service_progress;
DROP POLICY IF EXISTS "Staff can manage assignments" ON assignments;

-- Create more specific policies for mechanics

-- Mechanics can read their own assignments
CREATE POLICY "Mechanics can read own assignments"
ON assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mechanics m
    WHERE m.id = assignments.mechanic_id
    AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Mechanics can read service progress for their assigned bookings
CREATE POLICY "Mechanics can read assigned service progress"
ON service_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN mechanics m ON a.mechanic_id = m.id
    WHERE a.booking_id = service_progress.booking_id
    AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Mechanics can update service progress for their assigned bookings
CREATE POLICY "Mechanics can update assigned service progress"
ON service_progress FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN mechanics m ON a.mechanic_id = m.id
    WHERE a.booking_id = service_progress.booking_id
    AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Admin/owner can manage all
CREATE POLICY "Admin can manage assignments"
ON assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admin can manage service progress"
ON service_progress FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);
```

### 3. Improved Dashboard Query

**File**: `frontend/src/app/mechanic/page.tsx` (updated)

The current query uses an inner join which may be filtering out rows. We'll test multiple approaches:

**Approach A: Current (may be failing)**
```typescript
const { count: inProgress } = await supabase
  .from('bookings')
  .select('*, assignments!inner(mechanic_id)', { count: 'exact', head: true })
  .eq('assignments.mechanic_id', mechanic.id)
  .eq('status', 'in_progress');
```

**Approach B: Via service_progress (alternative)**
```typescript
const { count: inProgress } = await supabase
  .f