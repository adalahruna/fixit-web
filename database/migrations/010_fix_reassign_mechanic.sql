  -- Migration 010: Fix reassign mechanic to handle UPDATE instead of INSERT
  -- This fixes the duplicate key error when reassigning mechanic

  -- Drop and recreate the assign_mechanic_atomic function with reassignment support
  CREATE OR REPLACE FUNCTION assign_mechanic_atomic(
    p_booking_id UUID,
    p_mechanic_id UUID
  ) RETURNS JSON AS $$
  DECLARE
    v_next_position INTEGER;
    v_existing_assignment_id UUID;
    v_old_mechanic_id UUID;
    v_old_queue_position INTEGER;
    v_progress_status TEXT;
  BEGIN
    -- Check if assignment already exists for this booking
    SELECT id, mechanic_id, queue_position 
    INTO v_existing_assignment_id, v_old_mechanic_id, v_old_queue_position
    FROM assignments
    WHERE booking_id = p_booking_id;
    
    IF v_existing_assignment_id IS NOT NULL THEN
      -- REASSIGNMENT: Update existing assignment
      
      -- Check service status - prevent reassignment during active service or after completion
      SELECT status INTO v_progress_status
      FROM service_progress
      WHERE booking_id = p_booking_id;
      
      IF v_progress_status = 'in_progress' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Tidak dapat reassign mekanik saat servis sedang dikerjakan'
        );
      END IF;
      
      IF v_progress_status = 'done' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Tidak dapat reassign mekanik karena tiket sudah selesai'
        );
      END IF;
      
      -- Get next queue position for the NEW mechanic
      SELECT COALESCE(MAX(queue_position), 0) + 1 
      INTO v_next_position
      FROM assignments 
      WHERE mechanic_id = p_mechanic_id;
      
      -- Update the assignment to new mechanic
      UPDATE assignments
      SET 
        mechanic_id = p_mechanic_id,
        queue_position = v_next_position,
        updated_at = NOW()
      WHERE id = v_existing_assignment_id;
      
      -- Reorder queue positions for old mechanic (close the gap)
      UPDATE assignments
      SET queue_position = queue_position - 1
      WHERE mechanic_id = v_old_mechanic_id
        AND queue_position > v_old_queue_position;
      
      RETURN json_build_object(
        'success', true, 
        'queue_position', v_next_position,
        'action', 'reassigned'
      );
    ELSE
      -- NEW ASSIGNMENT: Insert new assignment
      
      -- Get next queue position for the mechanic
      SELECT COALESCE(MAX(queue_position), 0) + 1 
      INTO v_next_position
      FROM assignments 
      WHERE mechanic_id = p_mechanic_id;
      
      -- Insert assignment
      INSERT INTO assignments (booking_id, mechanic_id, queue_position)
      VALUES (p_booking_id, p_mechanic_id, v_next_position);
      
      -- Update booking status to confirmed
      UPDATE bookings 
      SET status = 'confirmed', updated_at = NOW()
      WHERE id = p_booking_id;
      
      -- Create service progress record if not exists
      INSERT INTO service_progress (booking_id, status)
      VALUES (p_booking_id, 'queued')
      ON CONFLICT (booking_id) DO NOTHING;
      
      RETURN json_build_object(
        'success', true, 
        'queue_position', v_next_position,
        'action', 'assigned'
      );
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Grant execute permissions
  GRANT EXECUTE ON FUNCTION assign_mechanic_atomic(UUID, UUID) TO authenticated;
