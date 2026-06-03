-- ============================================
-- FIX: RLS Policy Recursion on Bookings Table
-- ============================================
-- Issue: "infinite recursion detected in policy for relation bookings"
-- This happens when a policy references the same table it's protecting
-- ============================================

-- Step 1: Check current policies on bookings table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- Step 2: Drop all existing policies on bookings
DROP POLICY IF EXISTS "Customers can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Mechanic can read assigned bookings" ON bookings;

-- Step 3: Create simple, non-recursive policies

-- Policy 1: Customers can read their own bookings
CREATE POLICY "Customers can read own bookings"
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

-- Policy 2: Customers can create bookings
CREATE POLICY "Customers can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Policy 3: Customers and admin can update bookings
-- IMPORTANT: No recursive check on bookings table itself
CREATE POLICY "Customers can update own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Policy 4: Admin and owner can delete bookings
CREATE POLICY "Admin can delete bookings"
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

SELECT '✅ RLS policies recreated successfully!' as result,
       'Cancel and reschedule should now work' as note;
