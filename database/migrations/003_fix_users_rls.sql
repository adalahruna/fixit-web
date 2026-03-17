-- Migration: Fix Users RLS for Middleware
-- Created: 2026-03-17
-- Description: Allow authenticated users to read role from users table for routing

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Allow users to read their own full data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow all authenticated users to read role (for middleware routing)
CREATE POLICY "Authenticated users can read roles"
ON users FOR SELECT
TO authenticated
USING (true);
