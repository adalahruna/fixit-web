-- FIX AVG TIME ONLY: Backfill missing actual_duration for completed bookings
-- This fixes KPI dashboard showing 0 minutes for average service time

-- ============================================
-- STEP 1: Check current state
-- ============================================
SELECT 
  '📊 Current State Check' as step,
  COUNT(*) as total_done_bookings,
  COUNT(sp.actual_duration) as bookings_with_duration,
  COUNT(*) - COUNT(sp.actual_duration) as bookings_missing_duration,
  ROUND(AVG(sp.actual_duration), 2) as current_avg_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done';

-- ============================================
-- STEP 2: Show bookings that need fixing
-- ============================================
SELECT 
  '🔍 Bookings Missing Duration' as step,
  b.id as booking_id,
  b.status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration as current_duration,
  CASE 
    WHEN sp.start_time IS NOT NULL AND sp.end_time IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60, 2)
    ELSE NULL
  END as calculated_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
AND sp.actual_duration IS NULL
AND sp.start_time IS NOT NULL
AND sp.end_time IS NOT NULL;

-- ============================================
-- STEP 3: Backfill missing actual_duration
-- ============================================
UPDATE service_progress sp
SET actual_duration = EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60
WHERE sp.status = 'done'
AND sp.actual_duration IS NULL
AND sp.start_time IS NOT NULL
AND sp.end_time IS NOT NULL;

-- ============================================
-- STEP 4: Verify the fix
-- ============================================
SELECT 
  '✅ After Fix' as step,
  COUNT(*) as total_done_bookings,
  COUNT(sp.actual_duration) as bookings_with_duration,
  COUNT(*) - COUNT(sp.actual_duration) as bookings_still_missing,
  ROUND(AVG(sp.actual_duration), 2) as new_avg_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done';

-- ============================================
-- STEP 5: Show all completed bookings with duration
-- ============================================
SELECT 
  '📋 All Completed Bookings' as step,
  b.id as booking_id,
  b.schedule_start,
  sp.start_time,
  sp.end_time,
  sp.actual_duration as duration_minutes
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.schedule_start DESC;

-- ============================================
-- FINAL RESULT
-- ============================================
SELECT '✅ AVG TIME FIX COMPLETED!' as result;
SELECT '📊 Refresh your KPI dashboard to see the updated average service time' as instruction;
