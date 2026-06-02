-- Fix: Create missing service_progress records for confirmed bookings
-- This ensures all assigned bookings have service_progress with 'queued' status

-- Step 1: Create missing service_progress records
INSERT INTO service_progress (booking_id, status)
SELECT b.id, 'queued'
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
WHERE b.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM service_progress sp 
    WHERE sp.booking_id = b.id
  );

-- Step 2: Fix service_progress status to 'queued' for confirmed bookings
UPDATE service_progress sp
SET status = 'queued',
    start_time = NULL,
    end_time = NULL
FROM bookings b
WHERE sp.booking_id = b.id
  AND b.status = 'confirmed'
  AND sp.status != 'queued';

-- Step 3: Verify results
SELECT 
  COUNT(*) as total_confirmed_bookings,
  COUNT(sp.booking_id) as has_service_progress,
  COUNT(CASE WHEN sp.status = 'queued' THEN 1 END) as queued_status
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'confirmed';

-- Step 4: Show bookings ready to start
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  a.mechanic_id,
  m.name as mechanic_name
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
JOIN mechanics m ON m.id = a.mechanic_id
JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'confirmed'
  AND sp.status = 'queued'
ORDER BY a.queue_position
LIMIT 20;
