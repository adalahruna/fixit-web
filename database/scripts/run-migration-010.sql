-- Run Migration 010: Fix reassign mechanic
-- Execute this in Supabase SQL Editor

\i '../migrations/010_fix_reassign_mechanic.sql'

-- Verify the function was updated
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'assign_mechanic_atomic';
