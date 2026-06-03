-- ============================================
-- DIAGNOSTIC: Check All Policies on Bookings
-- ============================================
-- Run this to see what policies exist and might cause recursion
-- ============================================

-- Simple query - List all policies on bookings
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE pol.polpermissive
    WHEN true THEN 'PERMISSIVE'
    WHEN false THEN 'RESTRICTIVE'
  END as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'bookings'
  AND nsp.nspname = 'public'
ORDER BY pol.polname;

-- Check if RLS is enabled
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'bookings';

-- Check triggers on bookings
SELECT 
  tgname as trigger_name,
  tgtype as trigger_type,
  proname as function_name
FROM pg_trigger trg
JOIN pg_class cls ON trg.tgrelid = cls.oid
JOIN pg_proc prc ON trg.tgfoid = prc.oid
WHERE cls.relname = 'bookings'
  AND NOT tgisinternal
ORDER BY tgname;
