# 🔍 Instruksi Debug: Dashboard Mekanik Masih Menunjukkan 0

## Langkah 1: Cek Console Log di Terminal

Setelah Anda klik "Mulai Servis", lihat terminal tempat Next.js berjalan. Anda harus melihat log seperti ini:

```
🔍 DEBUG - Mechanic Dashboard: {
  mechanicId: '...',
  mechanicName: '...',
  assignmentCount: X,
  bookingIds: [...]
}
📊 Active bookings: [...]
🔧 In progress bookings: [...]
✅ Completed today: [...]
📈 Final counts: { queueCount: X, inProgressCount: X, completedToday: X }
```

**Tolong screenshot atau copy-paste log ini dan kirim ke saya.**

## Langkah 2: Cek Debug Panel di Browser

1. Buka dashboard mekanik di browser
2. Scroll ke bawah
3. Klik pada "🔍 Debug Info (Development Only)" untuk expand
4. **Screenshot atau copy JSON yang muncul**

## Langkah 3: Jalankan Query di Supabase

Buka Supabase SQL Editor dan jalankan query ini:

```sql
-- Query 1: Cek mechanic dan user_id
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  m.user_id,
  u.email as user_email,
  u.role as user_role
FROM mechanics m
LEFT JOIN users u ON u.id = m.user_id
WHERE u.role = 'mechanic';
```

**Screenshot hasil query ini.**

```sql
-- Query 2: Cek bookings dengan status in_progress
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  b.customer_id,
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
```

**Screenshot hasil query ini.**

```sql
-- Query 3: Cek assignments untuk mechanic Anda
-- GANTI 'MECHANIC_ID_HERE' dengan mechanic_id dari Query 1
SELECT 
  a.id as assignment_id,
  a.booking_id,
  a.mechanic_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time
FROM assignments a
JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = a.booking_id
WHERE a.mechanic_id = 'MECHANIC_ID_HERE'
ORDER BY a.queue_position;
```

**Screenshot hasil query ini.**

## Langkah 4: Test Atomic Function

Jalankan query ini di Supabase (ganti dengan ID yang sebenarnya):

```sql
-- Ambil booking_id dari hasil Query 3 di atas
-- Ambil user_id dari hasil Query 1 di atas
SELECT start_service_atomic(
  'BOOKING_ID_HERE'::uuid,
  'USER_ID_HERE'::uuid
);
```

**Screenshot hasil query ini.**

## Langkah 5: Cek Inkonsistensi Data

```sql
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  CASE 
    WHEN b.status != sp.status THEN '❌ TIDAK KONSISTEN'
    ELSE '✅ KONSISTEN'
  END as status_check,
  a.mechanic_id,
  m.name as mechanic_name
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE sp.status IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 20;
```

**Screenshot hasil query ini.**

## Yang Perlu Anda Kirim ke Saya:

1. ✅ Screenshot/copy log dari terminal (Langkah 1)
2. ✅ Screenshot/copy JSON dari debug panel browser (Langkah 2)
3. ✅ Screenshot hasil Query 1 (mechanic dan user)
4. ✅ Screenshot hasil Query 2 (bookings in_progress)
5. ✅ Screenshot hasil Query 3 (assignments untuk mechanic Anda)
6. ✅ Screenshot hasil test atomic function (Langkah 4)
7. ✅ Screenshot hasil cek inkonsistensi (Langkah 5)

Dengan informasi ini, saya bisa tahu persis di mana masalahnya dan memberikan solusi yang tepat.

## Kemungkinan Masalah Berdasarkan Hasil:

### Jika assignmentCount = 0
**Masalah:** Mechanic tidak punya assignment
**Solusi:** Admin harus assign booking ke mechanic ini dulu

### Jika bookingIds ada tapi inProgressBookings kosong
**Masalah:** Query tidak bisa baca bookings (RLS policy issue)
**Solusi:** Perlu fix RLS policy

### Jika Query 3 menunjukkan data tapi dashboard 0
**Masalah:** Cache Next.js atau revalidation tidak jalan
**Solusi:** Clear cache atau fix revalidation

### Jika status tidak konsisten (Query 5)
**Masalah:** Atomic function tidak jalan dengan benar
**Solusi:** Run fix script untuk sync data
