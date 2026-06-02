-- Run Migration 008: Fix Users INSERT RLS
-- This fixes the issue where admin cannot create mechanic accounts
-- because RLS blocks inserting user records with different UID

\echo '========================================='
\echo 'Running Migration 008: Fix Users INSERT RLS'
\echo '========================================='
\echo ''

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

\echo ''
\echo '✅ Migration 008 completed successfully!'
\echo ''
\echo 'Changes applied:'
\echo '- Dropped old "Users can insert own data" policy'
\echo '- Created new "Users can insert own data" policy (for self-registration)'
\echo '- Created new "Admin can insert user data" policy (for admin creating mechanics)'
\echo ''
\echo 'Now admin can create mechanic accounts without RLS blocking!'
