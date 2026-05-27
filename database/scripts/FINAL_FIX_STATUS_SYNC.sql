-- ============================================================================
-- FINAL FIX: Sync all booking and service_progress statuses
-- ============================================================================

-- STEP 1: Fix bookings that have been completed (have end_time) but status is wrong
UPDATE bookings b
SET 
  status = 'done',
  updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.end_time IS NOT NULL
  AND b.status != 'done';

-- STEP 2: Fix service_progress status for completed bookings
UPDATE service_progress sp
SET 
  status = 'done',
  updated_at = NOW()
FROM bookings b
WHERE sp.booking_id = b.id
  AND sp.end_time IS NOT NULL
  AND sp.status != 'done';

-- STEP 3: Fix bookings that are in progress (have start_time but no end_time)
UPDATE bookings b
SET 
  status = 'in_progress',
  updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.start_time IS NOT NULL
  AND sp.end_time IS NULL
  AND b.status NOT IN ('done', 'cancelled');

-- STEP 4: Fix service_progress status for in_progress bookings
UPDATE service_progress sp
SET 
  status = 'in_progress',
  updated_at = NOW()
FROM bookings b
WHERE sp.booking_id = b.id
  AND sp.start_time IS NOT NULL
  AND sp.end_time IS NULL
  AND sp.status != 'in_progress';

-- STEP 5: Calculate actual_duration for all completed services
UPDATE service_progress
SET 
  actual_duration = ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60),
  updated_at = NOW()
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND (actual_duration IS NULL OR actual_duration = 0);

-- STEP 6: Verify the fixes
SELECT 
  '=== AFTER FIX ===' as status,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN b.status = 'done' THEN 1 END) as done_bookings,
  COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END) as in_progress_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  ROUND(AVG(CASE WHEN b.status = 'done' AND sp.actual_duration IS NOT NULL THEN sp.actual_duration END), 2) as avg_service_time_minutes
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id;

-- STEP 7: Show fixed bookings
SELECT 
  'Fixed Bookings' as info,
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status IN ('in_progress', 'done')
ORDER BY b.schedule_start DESC
LIMIT 10;

-- ============================================================================
-- DONE! Refresh your dashboards now
-- ============================================================================
