-- Check service_progress status untuk bookings yang di-assign ke mechanic
-- GANTI mechanic_id dengan: 650e8400-e29b-41d4-a716-446655440001

SELECT 
  b.id as booking_id,
  b.status as booking_status,
  b.schedule_start,
  sp.status as service_progress_status,
  sp.start_time,
  sp.end_time,
  CASE 
    WHEN sp.booking_id IS NULL THEN '❌ SERVICE_PROGRESS TIDAK ADA'
    WHEN sp.status != 'queued' AND sp.start_time IS NULL THEN '⚠️ STATUS BUKAN QUEUED'
    WHEN b.status != sp.status THEN '❌ STATUS TIDAK KONSISTEN'
    ELSE '✅ OK'
  END as status_check
FROM assignments a
JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE a.mechanic_id = '650e8400-e29b-41d4-a716-446655440001'
ORDER BY a.queue_position;
