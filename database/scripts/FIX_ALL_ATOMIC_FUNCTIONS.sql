-- FIX ALL ATOMIC FUNCTIONS: Add SECURITY DEFINER to bypass RLS
-- This prevents "infinite recursion" errors on ALL operations

-- Drop all existing atomic functions
DROP FUNCTION IF EXISTS start_service_atomic(UUID, UUID);
DROP FUNCTION IF EXISTS complete_service_atomic(UUID, UUID);
DROP FUNCTION IF EXISTS assign_mechanic_atomic(UUID, UUID);
DROP FUNCTION IF EXISTS unassign_mechanic_atomic(UUID);

-- ============================================
-- 1. ASSIGN MECHANIC ATOMIC
-- ============================================
CREATE OR REPLACE FUNCTION assign_mechanic_atomic(
  p_booking_id UUID,
  p_mechanic_id UUID
) RETURNS JSON
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
DECLARE
  v_next_position INTEGER;
BEGIN
  -- Get next queue position atomically
  SELECT COALESCE(MAX(queue_position), 0) + 1 
  INTO v_next_position
  FROM assignments 
  WHERE mechanic_id = p_mechanic_id;
  
  -- Insert assignment
  INSERT INTO assignments (booking_id, mechanic_id, queue_position)
  VALUES (p_booking_id, p_mechanic_id, v_next_position);
  
  -- Update booking status
  UPDATE bookings 
  SET status = 'confirmed'
  WHERE id = p_booking_id;
  
  -- Create service progress record
  INSERT INTO service_progress (booking_id, status)
  VALUES (p_booking_id, 'queued');
  
  RETURN json_build_object('success', true, 'queue_position', v_next_position);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. UNASSIGN MECHANIC ATOMIC
-- ============================================
CREATE OR REPLACE FUNCTION unassign_mechanic_atomic(
  p_booking_id UUID
) RETURNS JSON
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
BEGIN
  -- Delete assignment
  DELETE FROM assignments WHERE booking_id = p_booking_id;
  
  -- Update booking status back to pending
  UPDATE bookings 
  SET status = 'pending'
  WHERE id = p_booking_id;
  
  -- Delete service progress record
  DELETE FROM service_progress WHERE booking_id = p_booking_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. START SERVICE ATOMIC
-- ============================================
CREATE OR REPLACE FUNCTION start_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON 
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
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
  
  -- Get current status
  SELECT status INTO v_current_progress_status
  FROM service_progress
  WHERE booking_id = p_booking_id;
  
  IF v_current_progress_status IS NULL THEN
    RETURN json_build_object('error', 'Service progress record not found');
  END IF;
  
  IF v_current_progress_status != 'queued' THEN
    RETURN json_build_object('error', 'Service is not in queued status', 'current_status', v_current_progress_status);
  END IF;
  
  -- Atomic update: BOTH tables
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

-- ============================================
-- 4. COMPLETE SERVICE ATOMIC
-- ============================================
CREATE OR REPLACE FUNCTION complete_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON 
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
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
  
  -- Atomic update: BOTH tables
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
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION assign_mechanic_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_mechanic_atomic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_service_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_service_atomic(UUID, UUID) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  'All atomic functions updated with SECURITY DEFINER' as status,
  COUNT(*) as function_count
FROM pg_proc 
WHERE proname LIKE '%_atomic' 
AND prosecdef = true;  -- prosecdef = SECURITY DEFINER

-- Expected: function_count = 4
