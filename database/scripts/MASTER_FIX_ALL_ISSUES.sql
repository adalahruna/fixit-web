-- ============================================================================
-- MASTER FIX SCRIPT - Run this to fix all KPI, SLA, and Dashboard issues
-- ============================================================================
-- This script will:
-- 1. Update complete_service_atomic function to calculate actual_duration
-- 2. Fix all data inconsistencies between bookings and service_progress
-- 3. Sync statuses and calculate missing durations
-- ============================================================================

-- PART 1: Update complete_service_atomic function
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_actual_duration INTEGER;
BEGIN
  -- Get mechanic ID from user_id
  SELECT id INTO v_mechanic_id 
  FROM mechanics 
  WHERE user_id = p_mechanic_user_id;
  
  IF v_mechanic_id IS NULL THEN
    RETURN json_build_object('error', 'Mechanic not found for user');
  END IF;
  
  -- Check if assignment exists
  SELECT EXISTS(
    SELECT 1 FROM assignments 
    WHERE booking_id = p_booking_id AND mechanic_id = v_mechanic_id
  ) INTO v_assignment_exists;
  
  IF NOT v_assignment_exists THEN
    RETURN json_build_object('error', 'Assignment not found');
  END IF;
  
  -- Get start_time from service_progress
  SELECT start_time INTO v_start_time
  FROM service_progress
  WHERE booking_id = p_booking_id;
  
  -- Set end time to now
  v_end_time := NOW();
  
  -- Calculate actual duration in minutes
  IF v_start_time IS NOT NULL THEN
    v_actual_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 60;
  ELSE
    -- If no start time, use schedule times
    SELECT EXTRACT(EPOCH FROM (schedule_end - schedule_start)) / 60
    INTO v_actual_duration
    FROM bookings
    WHERE id = p_booking_id;
  END IF;
  
  -- Atomic update: both tables in single transaction
  UPDATE service_progress 
  SET 
    status = 'done',
    end_time = v_end_time,
    actual_duration = v_actual_duration,
    updated_at = NOW()
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Service progress not found or not in progress');
  END IF;
  
  UPDATE bookings 
  SET 
    status = 'done',
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object('success', true, 'actual_duration', v_actual_duration);
END;
$$ LANGUAGE plpgsql;

-- PART 2: Fix Data Inconsistencies
-- ============================================================================

-- Step 1: Check current state
DO $$
DECLARE
  v_total INTEGER;
  v_done INTEGER;
  v_in_progress INTEGER;
  v_missing_sp INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN b.status = 'done' THEN 1 END),
    COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END),
    COUNT(CASE WHEN sp.id IS NULL THEN 1 END)
  INTO v_total, v_done, v_in_progress, v_missing_sp
  FROM bookings b
  LEFT JOIN service_progress sp ON sp.booking_id = b.id;
  
  RAISE NOTICE '=== BEFORE FIX ===';
  RAISE NOTICE 'Total bookings: %', v_total;
  RAISE NOTICE 'Done bookings: %', v_done;
  RAISE NOTICE 'In progress bookings: %', v_in_progress;
  RAISE NOTICE 'Missing service_progress: %', v_missing_sp;
END $$;

-- Step 2: Create missing service_progress records
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

-- Step 3: Sync booking status with service_progress status
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
    (b.status = 'done' AND sp.status != 'done') OR
    (b.status IN ('in_progress', 'done') AND sp.start_time IS NULL) OR
    (b.status = 'done' AND sp.end_time IS NULL)
  );

-- Step 4: Calculate actual_duration for all service_progress
UPDATE service_progress
SET 
  actual_duration = EXTRACT(EPOCH FROM (end_time - start_time)) / 60,
  updated_at = NOW()
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND actual_duration IS NULL;

-- Step 5: Verify the fixes
DO $$
DECLARE
  v_total INTEGER;
  v_done INTEGER;
  v_in_progress INTEGER;
  v_missing_sp INTEGER;
  v_avg_duration NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN b.status = 'done' THEN 1 END),
    COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END),
    COUNT(CASE WHEN sp.id IS NULL THEN 1 END),
    ROUND(AVG(CASE WHEN b.status = 'done' THEN sp.actual_duration END), 2)
  INTO v_total, v_done, v_in_progress, v_missing_sp, v_avg_duration
  FROM bookings b
  LEFT JOIN service_progress sp ON sp.booking_id = b.id;
  
  RAISE NOTICE '=== AFTER FIX ===';
  RAISE NOTICE 'Total bookings: %', v_total;
  RAISE NOTICE 'Done bookings: %', v_done;
  RAISE NOTICE 'In progress bookings: %', v_in_progress;
  RAISE NOTICE 'Missing service_progress: %', v_missing_sp;
  RAISE NOTICE 'Average service time: % minutes', v_avg_duration;
END $$;

-- Step 6: Show sample data for verification
SELECT 
  'Sample Data' as info,
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
-- DONE! Now refresh your KPI and SLA dashboards
-- ============================================================================
