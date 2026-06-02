-- Debug script untuk mechanic dashboard
-- Jalankan script ini di Supabase SQL Editor untuk melihat data aktual

-- 1. Cek semua mechanics dan user_id mereka
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  m.user_id,
  u.email as user_email,
  u.role as user_role
FROM mechanics m
LEFT JOIN users u ON u.id = m.user_id
ORDER BY m.name;

-- 2. Cek assignments untuk mechanic tertentu
-- GANTI 'MECHANIC_ID_HERE' dengan ID mechanic yang sedang login
SELECT 
  a.id as assignment_id,
  a.booking_id,
  a.mechanic_id,
  a.queue_position,
  b.status as booking_status,
  b.schedule_start,
  sp.status as service_progress_status,
  sp.start_time,
  sp.end_time
FROM assignments a
JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = a.booking_id
WHERE a.mechanic_id = 'MECHANIC_ID_HERE'
ORDER BY a.queue_position;

-- 3. Cek bookings dengan status in_progress
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  b.customer_id,
  b.schedule_start,
  a.mechanic_id,
  m.name as mechanic_name,
  sp.status as service_progress_status,
  sp.start_time
FROM bookings b
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'in_progress'
ORDER BY b.schedule_start;

-- 4. Cek service_progress dengan status in_progress
SELECT 
  sp.booking_id,
  sp.status as service_progress_status,
  sp.start_time,
  sp.end_time,
  b.status as booking_status,
  a.mechanic_id,
  m.name as mechanic_name
FROM service_progress sp
JOIN bookings b ON b.id = sp.booking_id
LEFT JOIN assignments a ON a.booking_id = sp.booking_id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE sp.status = 'in_progress'
ORDER BY sp.start_time DESC;

-- 5. Cek inkonsistensi antara bookings.status dan service_progress.status
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  CASE 
    WHEN b.status != sp.status THEN '❌ INCONSISTENT'
    ELSE '✅ CONSISTENT'
  END as consistency_check,
  a.mechanic_id,
  m.name as mechanic_name
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE sp.status IS NOT NULL
  AND b.status != sp.status
ORDER BY b.created_at DESC;

-- 6. Test RLS policy - cek apakah mechanic bisa read bookings
-- Jalankan ini setelah SET ROLE (lihat di bawah)
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "USER_ID_HERE", "role": "mechanic"}';

-- SELECT 
--   b.id,
--   b.status,
--   a.mechanic_id
-- FROM bookings b
-- JOIN assignments a ON a.booking_id = b.id
-- WHERE a.mechanic_id = 'MECHANIC_ID_HERE';

-- RESET ROLE;
