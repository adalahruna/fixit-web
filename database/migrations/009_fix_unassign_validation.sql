-- Migration 009: Fix Unassign Validation
-- Prevent unassigning mechanic when service is in progress

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
GRANT EXECUTE ON FUNCTION unassign_mechanic_atomic(UUID) TO authenticated;
