-- DEBUG AVG TIME ISSUE: Deep diagnostic untuk cari tahu kenapa masih 0

-- ============================================
-- TEST 1: Cek semua booking yang done
-- ============================================
SELECT 
  '1️⃣ All Done Bookings' as test,
  b.id,
  b.status as booking_status,
  b.schedule_start,
  b.created_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.created_at DESC;

-- ============================================
-- TEST 2: Cek apakah service_progress adalah array atau object
-- ============================================
SELECT 
  '2️⃣ Service Progress Structure' as test,
  b.id as booking_id,
  COUNT(sp.id) as progress_count,
  json_agg(json_build_object(
    'status', sp.status,
    'actual_duration', sp.actual_duration,
    'start_time', sp.start_time,
    'end_time', sp.end_time
  )) as progress_data
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
GROUP BY b.id;

-- ============================================
-- TEST 3: Simulasi filter yang dipakai KPI calculation
-- ============================================
-- Filter: b.status === 'done' && b.service_progress && Array.isArray(b.service_progress) && b.service_progress[0]?.actual_duration

SELECT 
  '3️⃣ KPI Filter Simulation' as test,
  COUNT(*) as total_done,
  COUNT(CASE WHEN sp.actual_duration IS NOT NULL THEN 1 END) as with_duration,
  COUNT(CASE WHEN sp.actual_duration IS NULL THEN 1 END) as without_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done';

-- ============================================
-- TEST 4: Cek date range filter (schedule_start)
-- ============================================
-- KPI default: last 30 days dari schedule_start
SELECT 
  '4️⃣ Date Range Check (Last 30 Days)' as test,
  b.id,
  b.schedule_start,
  b.created_at,
  sp.actual_duration,
  CASE 
    WHEN b.schedule_start >= (NOW() - INTERVAL '30 days') THEN '✅ In Range'
    ELSE '❌ Out of Range'
  END as in_date_range
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.schedule_start DESC;

-- ============================================
-- TEST 5: Calculate avg manually
-- ============================================
SELECT 
  '5️⃣ Manual AVG Calculation' as test,
  COUNT(*) as total_bookings,
  SUM(sp.actual_duration) as total_duration,
  ROUND(AVG(sp.actual_duration), 2) as avg_duration,
  MIN(sp.actual_duration) as min_duration,
  MAX(sp.actual_duration) as max_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
AND sp.actual_duration IS NOT NULL;

-- ============================================
-- TEST 6: Cek dengan date filter (last 30 days)
-- ============================================
SELECT 
  '6️⃣ AVG with Date Filter (Last 30 Days)' as test,
  COUNT(*) as total_bookings,
  ROUND(AVG(sp.actual_duration), 2) as avg_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
AND sp.actual_duration IS NOT NULL
AND b.schedule_start >= (NOW() - INTERVAL '30 days');

-- ============================================
-- TEST 7: Cek apakah ada multiple service_progress per booking
-- ============================================
SELECT 
  '7️⃣ Multiple Progress Records Check' as test,
  b.id as booking_id,
  COUNT(sp.id) as progress_count
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
GROUP BY b.id
HAVING COUNT(sp.id) > 1;

-- ============================================
-- TEST 8: Raw data untuk debugging
-- ============================================
SELECT 
  '8️⃣ Raw Data for Frontend' as test,
  json_agg(json_build_object(
    'id', b.id,
    'status', b.status,
    'schedule_start', b.schedule_start,
    'schedule_end', b.schedule_end,
    'created_at', b.created_at,
    'service_progress', (
      SELECT json_agg(json_build_object(
        'start_time', sp2.start_time,
        'end_time', sp2.end_time,
        'actual_duration', sp2.actual_duration
      ))
      FROM service_progress sp2
      WHERE sp2.booking_id = b.id
    )
  )) as bookings_data
FROM bookings b
WHERE b.status = 'done'
AND b.schedule_start >= (NOW() - INTERVAL '30 days');

-- ============================================
-- SUMMARY
-- ============================================
SELECT '📊 SUMMARY' as result;
SELECT 'Copy output dari TEST 1-8 dan kirim ke saya untuk analisis lebih lanjut' as instruction;
