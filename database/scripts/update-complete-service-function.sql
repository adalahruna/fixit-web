-- Update complete_service_atomic function to calculate actual_duration

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
