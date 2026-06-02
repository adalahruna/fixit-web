-- Complete Test Bookings for KPI Testing
-- This script will mark some bookings as 'done' and create service_progress records

-- Step 1: Find bookings that are in_progress or confirmed
SELECT 
  id,
  status,
  schedule_start,
  schedule_end
FROM bookings
WHERE status IN ('in_progress', 'confirmed')
ORDER BY schedule_start DESC
LIMIT 5;

-- Step 2: Complete a few bookings (replace the IDs with actual booking IDs from step 1)
-- Example: Complete 3 bookings

-- Booking 1 - Replace with actual ID
DO $$
DECLARE
  v_booking_id UUID := '9a1832c4-95dc-4d6c-8601-175545899a30'; -- Replace with actual booking ID
  v_schedule_start TIMESTAMP;
  v_schedule_end TIMESTAMP;
  v_duration_minutes INTEGER;
BEGIN
  -- Get booking schedule
  SELECT schedule_start, schedule_end 
  INTO v_schedule_start, v_schedule_end
  FROM bookings 
  WHERE id = v_booking_id;
  
  -- Calculate duration
  v_duration_minutes := EXTRACT(EPOCH FROM (v_schedule_end - v_schedule_start)) / 60;
  
  -- Update booking status to done
  UPDATE bookings 
  SET status = 'done',
      updated_at = NOW()
  WHERE id = v_booking_id;
  
  -- Create or update service_progress
  INSERT INTO service_progress (booking_id, start_time, end_time, actual_duration, created_at, updated_at)
  VALUES (
    v_booking_id,
    v_schedule_start,
    v_schedule_end,
    v_duration_minutes,
    NOW(),
    NOW()
  )
  ON CONFLICT (booking_id) 
  DO UPDATE SET
    end_time = EXCLUDED.end_time,
    actual_duration = EXCLUDED.actual_duration,
    updated_at = NOW();
    
  RAISE NOTICE 'Completed booking: %', v_booking_id;
END $$;

-- Alternative: Batch complete multiple bookings at once
-- Update this query with actual booking IDs
UPDATE bookings
SET status = 'done',
    updated_at = NOW()
WHERE id IN (
  -- Replace these with actual booking IDs from step 1
  '9a1832c4-95dc-4d6c-8601-175545899a30',
  '160e98e7-1d38-463f-a2c9-f9ed5116587b',
  '6f14bc21-415b-4613-af23-05e41b3df2ba'
)
AND status IN ('in_progress', 'confirmed');

-- Create service_progress for completed bookings
INSERT INTO service_progress (booking_id, start_time, end_time, actual_duration, created_at, updated_at)
SELECT 
  b.id,
  b.schedule_start,
  b.schedule_end,
  EXTRACT(EPOCH FROM (b.schedule_end - b.schedule_start)) / 60,
  NOW(),
  NOW()
FROM bookings b
WHERE b.status = 'done'
  AND NOT EXISTS (
    SELECT 1 FROM service_progress sp WHERE sp.booking_id = b.id
  );

-- Verify the changes
SELECT 
  b.id,
  b.status,
  b.schedule_start,
  b.schedule_end,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.schedule_start DESC
LIMIT 10;
