-- Migration: Fix Users INSERT RLS for Admin Creating Mechanics
-- Created: 2026-05-28
-- Description: Allow admin/owner to create user records for mechanics

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Allow users to insert their own data (for self-registration)
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow admin/owner to insert user data for mechanics
CREATE POLICY "Admin can insert user data"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);
