-- ============================================
-- FIX: Cancel & Reschedule Bypass Trigger
-- ============================================
-- Alternative solution: Create RPC functions that bypass triggers
-- This is a temporary workaround if dropping triggers is not possible
-- ============================================

-- Function to cancel booking without triggering sync
CREATE OR REPLACE FUNCTION cancel_booking_bypass_trigger(
  p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Disable triggers temporarily for this session
  SET session_replication_role = replica;
  
  -- Update booking status
  UPDATE bookings 
  SET status = 'cancelled', 
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Update service_progress if exists
  UPDATE service_progress
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE booking_id = p_booking_id;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'message', 'Booking cancelled successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable triggers on error
    SET session_replication_role = DEFAULT;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update booking schedule without triggering sync
CREATE OR REPLACE FUNCTION reschedule_booking_bypass_trigger(
  p_booking_id UUID,
  p_schedule_start TIMESTAMP WITH TIME ZONE,
  p_schedule_end TIMESTAMP WITH TIME ZONE
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Disable triggers temporarily for this session
  SET session_replication_role = replica;
  
  -- Update booking schedule
  UPDATE bookings 
  SET schedule_start = p_schedule_start,
      schedule_end = p_schedule_end,
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'message', 'Booking rescheduled successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable triggers on error
    SET session_replication_role = DEFAULT;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cancel_booking_bypass_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking_bypass_trigger TO authenticated;

SELECT '✅ Bypass functions created successfully!' as result;
