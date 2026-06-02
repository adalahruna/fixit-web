-- Migration 007: Add atomic status update functions
-- This ensures status consistency between bookings and service_progress tables

-- Function to start service (queued -> in_progress)
CREATE OR REPLACE FUNCTION start_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_result JSON;
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
  
  -- Atomic update: both tables in single transaction
  UPDATE service_progress 
  SET 
    status = 'in_progress',
    start_time = NOW()
  WHERE booking_id = p_booking_id AND status = 'queued';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Service progress not found or not in queued status');
  END IF;
  
  UPDATE bookings 
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Function to complete service (in_progress -> done)
CREATE OR REPLACE FUNCTION complete_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_actual_duration INTEGER;
  v_result JSON;
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
  
  -- Get start_time to calculate duration
  SELECT start_time INTO v_start_time
  FROM service_progress
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF v_start_time IS NULL THEN
    RETURN json_build_object('error', 'Service progress not found or not in progress');
  END IF;
  
  -- Calculate actual duration in minutes
  v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;
  
  -- Atomic update: both tables in single transaction
  UPDATE service_progress 
  SET 
    status = 'done',
    end_time = NOW(),
    actual_duration = v_actual_duration
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Service progress not found or not in progress');
  END IF;
  
  UPDATE bookings 
  SET status = 'done', updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object('success', true, 'actual_duration', v_actual_duration);
END;
$$ LANGUAGE plpgsql;

-- Function to assign mechanic with atomic operations
CREATE OR REPLACE FUNCTION assign_mechanic_atomic(
  p_booking_id UUID,
  p_mechanic_id UUID
) RETURNS JSON AS $$
DECLARE
  v_next_position INTEGER;
  v_result JSON;
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

-- Function to unassign mechanic with atomic operations
CREATE OR REPLACE FUNCTION unassign_mechanic_atomic(
  p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
  v_progress_status TEXT;
BEGIN
  -- Check if service is in progress
  SELECT status INTO v_progress_status
  FROM service_progress
  WHERE booking_id = p_booking_id;
  
  -- Prevent unassign if service is in progress
  IF v_progress_status = 'in_progress' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tidak dapat unassign mekanik saat servis sedang dikerjakan'
    );
  END IF;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_service_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_service_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_mechanic_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_mechanic_atomic(UUID) TO authenticated;