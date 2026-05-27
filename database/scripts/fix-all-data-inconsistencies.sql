-- Fix All Data Inconsistencies
-- This script fixes booking status, service_progress, and calculates actual_duration

-- STEP 1: Check current state
SELECT 
  'Current State' as step,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN b.status = 'done' THEN 1 END) as done_bookings,
  COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END) as in_progress_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN sp.id IS NULL THEN 1 END) as missing_service_progress,
  COUNT(CASE WHEN sp.actual_duration IS NULL AND b.status = 'done' THEN 1 END) as done_without_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id;

-- STEP 2: Create missing service_progress records for confirmed bookings
INSERT INTO service_progress (booking_id, status, created_at, updated_at)
SELECT 
  b.id,
  CASE 
    WHEN b.status = 'confirmed' THEN 'queued'
    WHEN b.status = 'in_progress' THEN 'in_progress'
    WHEN b.status = 'done' THEN 'done'
    ELSE 'queued'
  END as status,
  NOW(),
  NOW()
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM service_progress sp WHERE sp.booking_id = b.id
)
AND b.status IN ('confirmed', 'in_progress', 'done');

-- STEP 3: Sync booking status with service_progress status
-- Update service_progress to match booking status
UPDATE service_progress sp
SET 
  status = CASE 
    WHEN b.status = 'confirmed' THEN 'queued'
    WHEN b.status = 'in_progress' THEN 'in_progress'
    WHEN b.status = 'done' THEN 'done'
    ELSE sp.status
  END,
  start_time = CASE 
    WHEN b.status IN ('in_progress', 'done') AND sp.start_time IS NULL 
    THEN b.schedule_start
    ELSE sp.start_time
  END,
  end_time = CASE 
    WHEN b.status = 'done' AND sp.end_time IS NULL 
    THEN b.schedule_end
    ELSE sp.end_time
  END,
  updated_at = NOW()
FROM bookings b
WHERE sp.booking_id = b.id
  AND (
    (b.status = 'confirmed' AND sp.status != 'queued') OR
    (b.status = 'in_progress' AND sp.status != 'in_progress') OR
    (b.status = 'done' AND sp.status != 'done')
  );

-- STEP 4: Calculate actual_duration for all service_progress with start and end times
UPDATE service_progress
SET 
  actual_duration = EXTRACT(EPOCH FROM (end_time - start_time)) / 60,
  updated_at = NOW()
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND actual_duration IS NULL;

-- STEP 5: For done bookings without proper times, use schedule times
UPDATE service_progress sp
SET 
  start_time = b.schedule_start,
  end_time = b.schedule_end,
  actual_duration = EXTRACT(EPOCH FROM (b.schedule_end - b.schedule_start)) / 60,
  updated_at = NOW()
FROM bookings b
WHERE sp.booking_id = b.id
  AND b.status = 'done'
  AND (sp.start_time IS NULL OR sp.end_time IS NULL OR sp.actual_duration IS NULL);

-- STEP 6: Verify the fixes
SELECT 
  'After Fix' as step,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN b.status = 'done' THEN 1 END) as done_bookings,
  COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END) as in_progress_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN sp.id IS NULL THEN 1 END) as missing_service_progress,
  COUNT(CASE WHEN sp.actual_duration IS NULL AND b.status = 'done' THEN 1 END) as done_without_duration,
  ROUND(AVG(CASE WHEN b.status = 'done' THEN sp.actual_duration END), 2) as avg_service_time
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id;

-- STEP 7: Show detailed status for verification
SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  b.schedule_start,
  b.schedule_end
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status IN ('in_progress', 'done')
ORDER BY b.schedule_start DESC
LIMIT 20;
