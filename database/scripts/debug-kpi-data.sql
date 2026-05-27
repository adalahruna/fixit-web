-- Debug KPI Data - Check why KPI shows 0/0

-- 1. Check total bookings in database
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
  COUNT(CASE WHEN status IN ('pending', 'confirmed', 'queued', 'in_progress') THEN 1 END) as active
FROM bookings;

-- 2. Check booking date ranges
SELECT 
  MIN(schedule_start) as earliest_schedule,
  MAX(schedule_start) as latest_schedule,
  MIN(created_at) as earliest_created,
  MAX(created_at) as latest_created
FROM bookings;

-- 3. Check bookings in last 30 days by schedule_start
SELECT 
  COUNT(*) as bookings_last_30_days,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM bookings
WHERE schedule_start >= NOW() - INTERVAL '30 days'
  AND schedule_start <= NOW();

-- 4. Check bookings by status with dates
SELECT 
  status,
  COUNT(*) as count,
  MIN(schedule_start) as earliest,
  MAX(schedule_start) as latest
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- 5. Check if bookings have service_progress
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

-- 6. Check booking_services relationship
SELECT 
  b.id,
  b.status,
  COUNT(bs.id) as service_count,
  SUM(st.price) as total_price
FROM bookings b
LEFT JOIN booking_services bs ON bs.booking_id = b.id
LEFT JOIN service_types st ON st.id = bs.service_type_id
GROUP BY b.id, b.status
LIMIT 10;

-- 7. Check date range that would match default KPI query (last 30 days)
SELECT 
  DATE(schedule_start) as booking_date,
  COUNT(*) as bookings_count,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_count
FROM bookings
WHERE schedule_start >= (CURRENT_DATE - INTERVAL '30 days')
  AND schedule_start <= CURRENT_DATE + INTERVAL '1 day'
GROUP BY DATE(schedule_start)
ORDER BY booking_date DESC;
