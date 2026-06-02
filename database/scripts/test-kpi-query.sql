-- Test KPI Query - Simplified version without date filter

-- Query 1: Get ALL bookings (no date filter) to see if data exists
SELECT 
  id,
  status,
  schedule_start,
  schedule_end,
  created_at
FROM bookings
ORDER BY schedule_start DESC
LIMIT 20;

-- Query 2: Test the exact query that KPI uses (with date filter)
-- Replace the dates with your actual date range
SELECT 
  id,
  status,
  schedule_start,
  schedule_end,
  created_at
FROM bookings
WHERE schedule_start >= (NOW() - INTERVAL '30 days')
  AND schedule_start <= NOW()
ORDER BY schedule_start DESC;

-- Query 3: Check if RLS is blocking the query
-- Run this as admin user
SET ROLE authenticated;
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed
FROM bookings;

-- Query 4: Check booking_services join
SELECT 
  b.id,
  b.status,
  json_agg(
    json_build_object(
      'service_type', json_build_object(
        'price', st.price,
        'name', st.name,
        'default_duration_minutes', st.default_duration_minutes
      )
    )
  ) as booking_services
FROM bookings b
LEFT JOIN booking_services bs ON bs.booking_id = b.id
LEFT JOIN service_types st ON st.id = bs.service_type_id
GROUP BY b.id, b.status
LIMIT 5;
