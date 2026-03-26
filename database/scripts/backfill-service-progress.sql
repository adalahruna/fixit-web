-- Backfill service_progress for existing bookings that have assignments but no service_progress
-- This script creates service_progress records for bookings that were assigned before the feature was implemented

INSERT INTO service_progress (booking_id, status, created_at, updated_at)
SELECT 
  a.booking_id,
  CASE 
    WHEN b.status = 'in_progress' THEN 'in_progress'
    WHEN b.status = 'done' THEN 'done'
    ELSE 'queued'
  END as status,
  NOW() as created_at,
  NOW() as updated_at
FROM assignments a
JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = a.booking_id
WHERE sp.id IS NULL;

-- Show results
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.created_at
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
JOIN service_progress sp ON sp.booking_id = b.id
ORDER BY sp.created_at DESC;
