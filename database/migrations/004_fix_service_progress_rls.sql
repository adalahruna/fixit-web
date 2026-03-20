-- Migration: Fix Service Progress RLS
-- Created: 2026-03-20
-- Description: Allow customers to read service_progress and assignments for their own bookings

-- ============================================
-- FIX SERVICE_PROGRESS RLS
-- ============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff can manage service progress" ON service_progress;

-- Create separate policies for different operations

-- Allow customers to read service_progress for their own bookings
CREATE POLICY "Customers can read own service progress"
ON service_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = service_progress.booking_id
    AND bookings.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can insert service_progress
CREATE POLICY "Staff can insert service progress"
ON service_progress FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can update service_progress
CREATE POLICY "Staff can update service progress"
ON service_progress FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can delete service_progress
CREATE POLICY "Staff can delete service progress"
ON service_progress FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- ============================================
-- FIX ASSIGNMENTS RLS
-- ============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Staff can manage assignments" ON assignments;

-- Create separate policies for different operations

-- Allow customers to read assignments for their own bookings
CREATE POLICY "Customers can read own assignments"
ON assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = assignments.booking_id
    AND bookings.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can insert assignments
CREATE POLICY "Staff can insert assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can update assignments
CREATE POLICY "Staff can update assignments"
ON assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Only staff can delete assignments
CREATE POLICY "Staff can delete assignments"
ON assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);
