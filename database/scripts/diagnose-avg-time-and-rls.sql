-- DIAGNOSTIC SCRIPT: Check avg time data and RLS function settings
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Check if atomic functions have SECURITY DEFINER
-- ============================================
SELECT 
  'Function Security Check' as check_type,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER (bypasses RLS)'
    ELSE '❌ INVOKER (uses caller RLS - CAUSES INFINITE RECURSION)'
  END as security_mode
FROM pg_proc 
WHERE proname LIKE '%_atomic'
ORDER BY proname;

-- Expected: ALL functions should have SECURITY DEFINER

-- ============================================
-- 2. Check actual_duration data for completed bookings
-- ============================================
SELECT 
  'Actual Duration Check' as check_type,
  b.id as booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  CASE 
    WHEN sp.actual_duration IS NULL AND sp.start_time IS NOT NULL AND sp.end_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60
    ELSE sp.actual_duration
  END as calculated_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.created_at DESC;

-- ============================================
-- 3. Count bookings with missing actual_duration
-- ============================================
SELECT 
  'Missing Duration Summary' as check_type,
  COUNT(*) as total_done_bookings,
  COUNT(sp.actual_duration) as bookings_with_duration,
  COUNT(*) - COUNT(sp.actual_duration) as bookings_missing_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done';

-- ============================================
-- 4. Check RLS policies on bookings table
-- ============================================
SELECT 
  'RLS Policy Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- ============================================
-- 5. Check if triggers still exist (should be 0)
-- ============================================
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

-- Expected: 0 rows (triggers should be removed)
