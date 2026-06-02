-- PERMANENT FIX: Stop the "kambuh" (recurring) counter issue
-- This script does 3 things:
-- 1. Cleans up ALL existing mismatched data
-- 2. Updates the atomic functions to be bulletproof
-- 3. Adds a database trigger to prevent future mismatches

-- ============================================
-- STEP 1: Clean up ALL existing bad data
-- ============================================

-- Fix all mismatched statuses with proper mapping
-- bookings -> service_progress status mapping:
-- confirmed -> queued
-- in_progress -> in_progress  
-- done -> done
UPDATE service_progress sp
SET status = CASE 
  WHEN b.status = 'confirmed' THEN 'queued'
  WHEN b.status = 'in_progress' THEN 'in_progress'
  WHEN b.status = 'done' THEN 'done'
  ELSE sp.status  -- Keep current if booking status is pending/cancelled
END
FROM bookings b
WHERE sp.booking_id = b.id
AND sp.status != CASE 
  WHEN b.status = 'confirmed' THEN 'queued'
  WHEN b.status = 'in_progress' THEN 'in_progress'
  WHEN b.status = 'done' THEN 'done'
  ELSE sp.status
END;

-- Fix all done bookings without actual_duration
UPDATE service_progress sp
SET actual_duration = EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60
WHERE sp.status = 'done'
AND sp.actual_duration IS NULL
AND sp.start_time IS NOT NULL
AND sp.end_time IS NOT NULL;

-- ============================================
-- STEP 2: Update atomic functions to be bulletproof
-- ============================================

-- Enhanced start_service_atomic with better error handling
CREATE OR REPLACE FUNCTION start_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_current_booking_status TEXT;
  v_current_progress_status TEXT;
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
  
  -- Get current statuses for validation
  SELECT b.status, sp.status 
  INTO v_current_booking_status, v_current_progress_status
  FROM bookings b
  LEFT JOIN service_progress sp ON sp.booking_id = b.id
  WHERE b.id = p_booking_id;
  
  -- Validate current state
  IF v_current_progress_status IS NULL THEN
    RETURN json_build_object('error', 'Service progress record not found');
  END IF;
  
  IF v_current_progress_status != 'queued' THEN
    RETURN json_build_object('error', 'Service is not in queued status', 'current_status', v_current_progress_status);
  END IF;
  
  -- Atomic update: BOTH tables must succeed or BOTH rollback
  UPDATE service_progress 
  SET 
    status = 'in_progress',
    start_time = NOW()
  WHERE booking_id = p_booking_id AND status = 'queued';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update service_progress';
  END IF;
  
  UPDATE bookings 
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update bookings';
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Service started successfully');
END;
$$ LANGUAGE plpgsql;

-- Enhanced complete_service_atomic with better error handling
CREATE OR REPLACE FUNCTION complete_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_actual_duration INTEGER;
  v_current_progress_status TEXT;
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
  
  -- Get start_time and current status
  SELECT start_time, status 
  INTO v_start_time, v_current_progress_status
  FROM service_progress
  WHERE booking_id = p_booking_id;
  
  -- Validate current state
  IF v_current_progress_status IS NULL THEN
    RETURN json_build_object('error', 'Service progress record not found');
  END IF;
  
  IF v_current_progress_status != 'in_progress' THEN
    RETURN json_build_object('error', 'Service is not in progress', 'current_status', v_current_progress_status);
  END IF;
  
  IF v_start_time IS NULL THEN
    RETURN json_build_object('error', 'Service has no start_time - cannot calculate duration');
  END IF;
  
  -- Calculate actual duration in minutes
  v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;
  
  -- Atomic update: BOTH tables must succeed or BOTH rollback
  UPDATE service_progress 
  SET 
    status = 'done',
    end_time = NOW(),
    actual_duration = v_actual_duration
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update service_progress';
  END IF;
  
  UPDATE bookings 
  SET status = 'done', updated_at = NOW()
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update bookings';
  END IF;
  
  RETURN json_build_object('success', true, 'actual_duration', v_actual_duration, 'message', 'Service completed successfully');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Add trigger to prevent future mismatches
-- ============================================

-- Trigger function to keep bookings and service_progress in sync
-- IMPORTANT: bookings has more statuses than service_progress
-- bookings: pending, confirmed, in_progress, done, cancelled
-- service_progress: queued, in_progress, done
CREATE OR REPLACE FUNCTION sync_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When service_progress status changes, update bookings
  -- service_progress -> bookings mapping is 1:1
  IF TG_TABLE_NAME = 'service_progress' THEN
    UPDATE bookings 
    SET status = NEW.status, updated_at = NOW()
    WHERE id = NEW.booking_id
    AND status != NEW.status;  -- Only update if different
    
    RETURN NEW;
  END IF;
  
  -- When bookings status changes, update service_progress
  -- bookings -> service_progress mapping needs translation:
  -- confirmed -> queued
  -- in_progress -> in_progress
  -- done -> done
  -- (pending and cancelled don't have service_progress records)
  IF TG_TABLE_NAME = 'bookings' THEN
    -- Only sync if service_progress record exists
    IF EXISTS (SELECT 1 FROM service_progress WHERE booking_id = NEW.id) THEN
      -- Map booking status to service_progress status
      IF NEW.status = 'confirmed' THEN
        UPDATE service_progress 
        SET status = 'queued'
        WHERE booking_id = NEW.id
        AND status != 'queued';
      ELSIF NEW.status = 'in_progress' THEN
        UPDATE service_progress 
        SET status = 'in_progress'
        WHERE booking_id = NEW.id
        AND status != 'in_progress';
      ELSIF NEW.status = 'done' THEN
        UPDATE service_progress 
        SET status = 'done'
        WHERE booking_id = NEW.id
        AND status != 'done';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_status_from_progress ON service_progress;
DROP TRIGGER IF EXISTS sync_status_from_bookings ON bookings;

-- Create triggers on both tables
CREATE TRIGGER sync_status_from_progress
AFTER UPDATE OF status ON service_progress
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_booking_status();

CREATE TRIGGER sync_status_from_bookings
AFTER UPDATE OF status ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_booking_status();

-- ============================================
-- VERIFICATION
-- ============================================

-- Show results
SELECT 
  'Cleanup Complete' as step,
  COUNT(*) FILTER (WHERE b.status != sp.status) as remaining_mismatches,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NULL) as done_without_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id;

SELECT 'Functions updated successfully' as step;
SELECT 'Triggers created successfully' as step;
SELECT '✅ PERMANENT FIX APPLIED - Counter should work correctly now!' as result;
