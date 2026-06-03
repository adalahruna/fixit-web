-- ============================================
-- FIX: RLS Policy Recursion on Bookings Table
-- ============================================
-- Issue: "infinite recursion detected in policy for relation bookings"
-- Root cause: Policy yang terlalu kompleks atau reference bookings di dalam check
-- Solution: Simplify policies untuk avoid recursion
-- ============================================

-- Step 1: Check current policies on bookings table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- Step 2: Drop all existing policies on bookings
DROP POLICY IF EXISTS "Customers can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Mechanic can read assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;

-- Step 3: Create SIMPLE, non-recursive policies
-- Key: Avoid subqueries that reference bookings table

-- Policy 1: SELECT - Customers read own, staff read all
CREATE POLICY "bookings_select_policy"
ON bookings FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Policy 2: INSERT - Customers can create their own bookings
CREATE POLICY "bookings_insert_policy"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Policy 3: UPDATE - Customers update own, admin/owner update all
CREATE POLICY "bookings_update_policy"
ON bookings FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Policy 4: DELETE - Only admin/owner
CREATE POLICY "bookings_delete_policy"
ON bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Step 4: Verify policies are created
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

SELECT '✅ RLS policies recreated - recursion fixed!' as result;
