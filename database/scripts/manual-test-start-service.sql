-- Manual test: Start service untuk salah satu booking
-- Gunakan booking_id dan user_id yang sebenarnya

-- Step 1: Cek status SEBELUM start service
SELECT 
  'BEFORE' as timing,
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time,
  sp.end_time
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.id = '1625cb3e-7778-428c-afd9-f777d4149fb4';

-- Step 2: Call atomic function
SELECT start_service_atomic(
  '1625cb3e-7778-428c-afd9-f777d4149fb4'::uuid,
  '09c45ae1-5113-4964-8900-952f94113872'::uuid
) as result;

-- Step 3: Cek status SETELAH start service
SELECT 
  'AFTER' as timing,
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time,
  sp.end_time
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.id = '1625cb3e-7778-428c-afd9-f777d4149fb4';

-- Step 4: Verify - harus ada row dengan status in_progress
SELECT 
  CASE 
    WHEN b.status = 'in_progress' AND sp.status = 'in_progress' AND sp.start_time IS NOT NULL 
    THEN '✅ SUCCESS - Status berubah ke in_progress'
    WHEN b.status = 'confirmed' AND sp.status = 'queued' 
    THEN '❌ FAILED - Status masih confirmed/queued'
    ELSE '⚠️ UNKNOWN - Status tidak sesuai ekspektasi'
  END as test_result,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.id = '1625cb3e-7778-428c-afd9-f777d4149fb4';
