-- CRITICAL FIX: Update complete_service_atomic to calculate actual_duration
-- Run this in Supabase SQL Editor NOW!

-- Drop old function first
DROP FUNCTION IF EXISTS complete_service_atomic(UUID, UUID);

-- Create new function with actual_duration calculation
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_service_atomic(UUID, UUID) TO authenticated;

-- Verify function was created
SELECT 'Function complete_service_atomic updated successfully!' as status;
