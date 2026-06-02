-- Quick check current booking status
-- Run this to see real-time status of all bookings

SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  b.created_at,
  b.updated_at
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.created_at DESC
LIMIT 20;
