-- SIMPLE CHECK: Cek kondisi booking sebenarnya

-- 1. Berapa total booking?
SELECT 'Total Bookings' as check_name, COUNT(*) as count FROM bookings;

-- 2. Berapa booking per status?
SELECT 'Bookings by Status' as check_name, status, COUNT(*) as count 
FROM bookings 
GROUP BY status;

-- 3. Apakah ada service_progress?
SELECT 'Total Service Progress' as check_name, COUNT(*) as count FROM service_progress;

-- 4. Service progress per status?
SELECT 'Service Progress by Status' as check_name, status, COUNT(*) as count 
FROM service_progress 
GROUP BY status;

-- 5. Booking dengan service_progress?
SELECT 
  'Bookings with Progress' as check_name,
  b.id,
  b.status as booking_status,
  b.schedule_start,
  sp.status as progress_status,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
ORDER BY b.created_at DESC
LIMIT 10;
