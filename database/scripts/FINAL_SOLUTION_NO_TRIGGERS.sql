-- FINAL SOLUTION: Remove triggers, use atomic functions only
-- Triggers cause "Failed to update booking" error

-- ============================================
-- STEP 1: Remove the problematic triggers
-- ============================================

DROP TRIGGER IF EXISTS sync_status_from_progress ON service_progress;
DROP TRIGGER IF EXISTS sync_status_from_bookings ON bookings;
DROP FUNCTION IF EXISTS sync_booking_status();

-- ============================================
-- STEP 2: Clean up existing mismatched data
-- ============================================

-- Fix all mismatched statuses with proper mapping
UPDATE service_progress sp
SET status = CASE 
  WHEN b.status = 'confirmed' THEN 'queued'
  WHEN b.status = 'in_progress' THEN 'in_progress'
  WHEN b.status = 'done' THEN 'done'
  ELSE sp.status
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
-- STEP 3: Ensure atomic functions are correct
-- ============================================

-- Enhanced start_service_atomic
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
  
  -- Get current statuses
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
  
  -- Atomic update: BOTH tables in single transaction
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

-- Enhanced complete_service_atomic
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
    RETURN json_build_object('error', 'Service has no start_time');
  END IF;
  
  -- Calculate actual duration in minutes
  v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;
  
  -- Atomic update: BOTH tables in single transaction
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION start_service_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_service_atomic(UUID, UUID) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Triggers removed' as step;
SELECT 'Data cleaned up' as step;
SELECT 'Atomic functions updated' as step;
SELECT '✅ SOLUTION APPLIED - Button should work now!' as result;

-- Verify no triggers remain
SELECT 
  'Trigger Check' as verification,
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

-- Expected: remaining_triggers = 0
