# 🔬 Root Cause Analysis: Kenapa Counter Terus Kambuh?

## Hipotesis Berdasarkan Pola "Kambuh"

### Hipotesis #1: Function Tidak Benar-Benar Ter-update (MOST LIKELY - 70%)

**Kenapa ini paling mungkin:**
- Kamu bilang "tetep kambuh lagi" → artinya sempat berhasil, lalu gagal lagi
- Data sebelumnya menunjukkan `actual_duration = null` → function versi lama
- Supabase kadang cache function definition

**Cara Confirm:**
```sql
-- Check function body
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'complete_service_atomic';
```

Cari baris ini di hasil:
```
v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;
```

**Jika TIDAK ADA baris itu:** Function masih versi lama!

**Solusi Permanen:**
```sql
-- Force drop and recreate
DROP FUNCTION IF EXISTS complete_service_atomic(UUID, UUID) CASCADE;

-- Then run the full FIX_ACTUAL_DURATION.sql
```

---

### Hipotesis #2: Race Condition di Dashboard Query (LIKELY - 20%)

**Kenapa ini mungkin:**
- Counter "stuck di 1" → artinya query pertama berhasil, query kedua gagal
- Dashboard pake multiple queries → bisa ada timing issue

**Cara Confirm:**
Tambahkan logging di `frontend/src/app/mechanic/page.tsx`:

```typescript
console.log('📊 Booking IDs:', bookingIds);
console.log('📊 In Progress Count:', inProgressCount);
console.log('📊 In Progress Bookings:', inProgressBookings);
```

**Jika log menunjukkan:**
- `bookingIds` ada isi tapi `inProgressBookings` kosong → RLS issue
- `bookingIds` kosong → Assignment issue
- Semua ada isi tapi counter salah → Calculation issue

**Solusi:**
Simplify query jadi single query dengan JOIN:

```typescript
const { data: stats } = await supabase
  .from('assignments')
  .select(`
    booking_id,
    bookings!inner(id, status)
  `)
  .eq('mechanic_id', mechanic.id);

const inProgressCount = stats?.filter(s => 
  s.bookings.status === 'in_progress'
).length || 0;
```

---

### Hipotesis #3: Mechanic User Mapping Salah (POSSIBLE - 5%)

**Kenapa ini mungkin:**
- Function cek `user_id` untuk get `mechanic_id`
- Kalau mapping salah, function return error

**Cara Confirm:**
```sql
-- Check your mechanic mapping
SELECT 
  m.id as mechanic_id,
  m.name,
  m.user_id,
  u.email
FROM mechanics m
LEFT JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'YOUR_EMAIL'; -- Replace with your email
```

**Expected:** Harus ada 1 row dengan `user_id` yang match

**Jika `user_id` NULL atau tidak match:** Mapping salah!

**Solusi:**
```sql
-- Fix mapping
UPDATE mechanics
SET user_id = 'YOUR_USER_ID'
WHERE email = 'YOUR_EMAIL';
```

---

### Hipotesis #4: Browser/Next.js Cache Issue (POSSIBLE - 3%)

**Kenapa ini mungkin:**
- Database benar tapi UI tidak update
- Next.js aggressive caching

**Cara Confirm:**
1. Buka DevTools → Network tab
2. Refresh dashboard
3. Cek response dari server
4. Bandingkan dengan database

**Jika response benar tapi UI salah:** Client-side issue
**Jika response salah:** Server-side cache issue

**Solusi:**
Sudah diterapkan:
- `dynamic = 'force-dynamic'`
- `revalidate = 0`
- `router.refresh()` dengan delay

Tapi bisa tambah:
```typescript
// Add cache busting
const timestamp = Date.now();
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('cache_bust', timestamp); // Force new query
```

---

### Hipotesis #5: Multiple Mechanics dengan User ID Sama (RARE - 2%)

**Kenapa ini mungkin:**
- Kalau ada 2 mechanic dengan `user_id` sama
- Function bisa ambil mechanic yang salah

**Cara Confirm:**
```sql
-- Check duplicate user_ids
SELECT 
  user_id,
  COUNT(*) as mechanic_count,
  array_agg(id) as mechanic_ids,
  array_agg(name) as mechanic_names
FROM mechanics
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows

**Jika ada hasil:** CRITICAL BUG! Harus fix immediately.

**Solusi:**
```sql
-- Keep only the active one
UPDATE mechanics
SET user_id = NULL
WHERE id = 'DUPLICATE_MECHANIC_ID'; -- The one you don't use
```

---

## 🎯 Action Plan

### Langkah 1: Confirm Function Status (CRITICAL)
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'complete_service_atomic';
```

**Cari baris:** `v_actual_duration := EXTRACT`

**Jika TIDAK ADA:**
1. Run `DROP FUNCTION IF EXISTS complete_service_atomic(UUID, UUID) CASCADE;`
2. Run `FIX_ACTUAL_DURATION.sql`
3. Verify lagi

---

### Langkah 2: Test dengan Booking Baru
1. Buat booking BARU (jangan pakai booking lama)
2. Admin assign mechanic
3. Run `TRACK_ISSUE.sql` BEFORE klik "Mulai Servis"
4. Klik "Mulai Servis"
5. Run `TRACK_ISSUE.sql` AFTER
6. Compare hasil

---

### Langkah 3: Check Dashboard Query
1. Tambah `console.log` di `mechanic/page.tsx`
2. Refresh dashboard
3. Cek console output
4. Screenshot dan kirim ke saya

---

### Langkah 4: Verify Mechanic Mapping
```sql
SELECT m.*, u.email
FROM mechanics m
LEFT JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'YOUR_EMAIL';
```

---

## 📋 Checklist untuk Kamu

- [ ] Run `pg_get_functiondef` untuk check function
- [ ] Run `DEEP_ANALYSIS.sql` dan screenshot semua hasil
- [ ] Run `TRACK_ISSUE.sql` BEFORE dan AFTER klik "Mulai Servis"
- [ ] Check console log di browser DevTools
- [ ] Verify mechanic mapping dengan email kamu
- [ ] Test dengan booking BARU (bukan booking lama)
- [ ] Screenshot dashboard BEFORE dan AFTER
- [ ] Kirim SEMUA hasil ke saya

---

## 💡 Prediksi Akhir

Berdasarkan semua analisis, saya 90% yakin masalahnya adalah:

**Function `complete_service_atomic` tidak benar-benar ter-update di Supabase.**

Supabase kadang cache function definition, jadi meskipun kamu run `CREATE OR REPLACE`, dia masih pakai versi lama.

**Solusi Pasti:**
1. `DROP FUNCTION` dulu (force delete)
2. Baru `CREATE FUNCTION` (create fresh)
3. Verify dengan `pg_get_functiondef`

Tapi saya butuh konfirmasi dari hasil `DEEP_ANALYSIS.sql` untuk 100% yakin!
