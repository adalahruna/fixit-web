## 🔍 Diagnosis Checklist - Kenapa Counter Terus Kambuh?

Masalah "kambuh" biasanya disebabkan oleh salah satu dari ini:

### Kemungkinan 1: Function Tidak Ter-update dengan Benar ❌
**Gejala:** 
- Kamu sudah run script tapi function masih versi lama
- `actual_duration` masih `null`

**Test:**
```sql
-- Check function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'complete_service_atomic';
```

**Expected:** Harus ada baris `v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;`

**Jika tidak ada:** Function belum ter-update! Run ulang `FIX_ACTUAL_DURATION.sql`

---

### Kemungkinan 2: Ada 2 Mechanic dengan User ID yang Sama ❌
**Gejala:**
- Counter stuck di 1
- Booking yang di-start tidak masuk counter

**Test:**
```sql
-- Check duplicate mechanics
SELECT user_id, COUNT(*) as count
FROM mechanics
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Expected:** Tidak ada hasil (0 rows)

**Jika ada hasil:** Ada duplicate! Harus di-fix.

---

### Kemungkinan 3: RLS Policy Blocking Query ❌
**Gejala:**
- Function berhasil update database
- Tapi dashboard tidak baca data yang baru

**Test:**
```sql
-- Check if you can read the data
SELECT 
  b.id,
  b.status,
  sp.status as progress_status
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 hour';
```

**Expected:** Harus muncul semua booking terbaru

**Jika kosong:** RLS policy blocking! Perlu fix policy.

---

### Kemungkinan 4: Dashboard Query Salah ❌
**Gejala:**
- Database benar
- Tapi counter tidak update

**Test:** Cek query di `frontend/src/app/mechanic/page.tsx`

Apakah query ini:
```typescript
const { data: inProgressBookings } = await supabase
  .from('bookings')
  .select('id, status')
  .in('id', bookingIds)
  .eq('status', 'in_progress');
```

**Expected:** Harus ada query ini dan tidak ada error

---

### Kemungkinan 5: Booking Tidak Punya Assignment ❌
**Gejala:**
- Klik "Mulai Servis" tapi tidak ada efek
- Function return error "Assignment not found"

**Test:**
```sql
-- Check bookings without assignments
SELECT 
  b.id,
  b.status,
  a.mechanic_id
FROM bookings b
LEFT JOIN assignments a ON a.booking_id = b.id
WHERE b.status IN ('confirmed', 'in_progress')
  AND a.mechanic_id IS NULL
  AND b.created_at > NOW() - INTERVAL '1 day';
```

**Expected:** Tidak ada hasil (0 rows)

**Jika ada hasil:** Booking tidak punya assignment! Admin harus assign ulang.

---

### Kemungkinan 6: Browser Cache Terlalu Agresif ❌
**Gejala:**
- Database sudah benar
- Tapi UI tidak update

**Test:**
1. Buka DevTools (F12)
2. Tab "Network"
3. Refresh halaman
4. Cari request ke `/mechanic`
5. Lihat response - apakah data benar?

**Expected:** Response harus punya data terbaru

**Jika response benar tapi UI salah:** React state issue
**Jika response salah:** Server-side cache issue

---

## 🚨 JALANKAN INI SEKARANG

1. **Run Deep Analysis Script:**
   ```sql
   -- Copy paste dari database/scripts/DEEP_ANALYSIS.sql
   ```

2. **Screenshot SEMUA hasil** dan kirim ke saya

3. **Jawab pertanyaan ini:**
   - Apakah kamu sudah run `FIX_ACTUAL_DURATION.sql`? (Ya/Tidak)
   - Apakah ada error saat run script? (Ya/Tidak, screenshot error)
   - Apakah kamu test dengan booking BARU atau booking LAMA? (Baru/Lama)
   - Apakah counter pernah naik lalu stuck, atau stuck dari awal? (Naik lalu stuck / Stuck dari awal)
   - Apakah kamu login sebagai mechanic yang SAMA dengan yang di-assign? (Ya/Tidak)

4. **Test Scenario:**
   - Buat booking BARU
   - Admin assign ke mechanic
   - Login sebagai mechanic yang di-assign
   - Klik "Mulai Servis"
   - Screenshot dashboard SEBELUM dan SESUDAH klik
   - Screenshot database query result SEBELUM dan SESUDAH klik

---

## 📊 Data yang Saya Butuhkan

Kirim hasil dari query ini:

```sql
-- Query 1: Latest booking detail
SELECT 
  b.id,
  b.status as booking_status,
  b.updated_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  m.name as mechanic_name,
  m.user_id as mechanic_user_id
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE b.created_at > NOW() - INTERVAL '1 hour'
ORDER BY b.updated_at DESC
LIMIT 5;

-- Query 2: Your mechanic info
SELECT 
  id,
  name,
  user_id,
  is_active
FROM mechanics
WHERE user_id = 'YOUR_USER_ID'; -- Replace with your actual user_id

-- Query 3: Counter calculation
SELECT 
  COUNT(*) FILTER (WHERE b.status = 'in_progress') as should_be_in_progress_count,
  COUNT(*) FILTER (WHERE b.status = 'done') as should_be_done_count,
  COUNT(*) FILTER (WHERE b.status NOT IN ('done', 'cancelled')) as should_be_queue_count
FROM bookings b
INNER JOIN assignments a ON a.booking_id = b.id
WHERE a.mechanic_id = 'YOUR_MECHANIC_ID'; -- Replace with your mechanic_id
```

---

## 🎯 Prediksi Saya

Berdasarkan pola "kambuh", kemungkinan besar:

1. **70% chance:** Function tidak ter-update dengan benar di Supabase
   - Solusi: Run ulang `FIX_ACTUAL_DURATION.sql` dengan DROP FUNCTION dulu

2. **20% chance:** Ada race condition atau timing issue
   - Solusi: Tambah delay atau retry mechanism

3. **10% chance:** RLS policy atau query issue
   - Solusi: Fix policy atau query

Tapi saya butuh data dari `DEEP_ANALYSIS.sql` untuk confirm!
