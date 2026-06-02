-- Check Mechanic Accounts Status
-- Run this in Supabase SQL Editor to diagnose mechanic account creation issues

-- 1. Check all users with mechanic role
SELECT 
  'Users with mechanic role' as check_type,
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE role = 'mechanic'
ORDER BY created_at DESC;

-- 2. Check all mechanics records
SELECT 
  'Mechanics table records' as check_type,
  id,
  name,
  user_id,
  is_active,
  daily_capacity_minutes,
  skill_notes,
  created_at
FROM mechanics
ORDER BY created_at DESC;

-- 3. Check mechanics WITHOUT linked user_id (orphaned mechanics)
SELECT 
  'Orphaned mechanics (no user_id)' as check_type,
  id,
  name,
  user_id,
  is_active,
  created_at
FROM mechanics
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 4. Check users with mechanic role WITHOUT linked mechanic record
SELECT 
  'Orphaned users (no mechanic record)' as check_type,
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at
FROM users u
WHERE u.role = 'mechanic'
  AND NOT EXISTS (
    SELECT 1 FROM mechanics m WHERE m.user_id = u.id
  )
ORDER BY u.created_at DESC;

-- 5. Check properly linked mechanic accounts (JOIN)
SELECT 
  'Properly linked accounts' as check_type,
  m.id as mechanic_id,
  m.name as mechanic_name,
  u.id as user_id,
  u.email,
  u.name as user_name,
  m.is_active,
  m.created_at
FROM mechanics m
INNER JOIN users u ON m.user_id = u.id
WHERE u.role = 'mechanic'
ORDER BY m.created_at DESC;

-- 6. Count summary
SELECT 
  'Summary' as check_type,
  (SELECT COUNT(*) FROM users WHERE role = 'mechanic') as total_mechanic_users,
  (SELECT COUNT(*) FROM mechanics) as total_mechanics,
  (SELECT COUNT(*) FROM mechanics WHERE user_id IS NULL) as orphaned_mechanics,
  (SELECT COUNT(*) FROM users u WHERE u.role = 'mechanic' AND NOT EXISTS (SELECT 1 FROM mechanics m WHERE m.user_id = u.id)) as orphaned_users,
  (SELECT COUNT(*) FROM mechanics m INNER JOIN users u ON m.user_id = u.id WHERE u.role = 'mechanic') as properly_linked;
