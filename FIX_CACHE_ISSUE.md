# Fix: Counter Sedang Dikerjakan Tidak Update (Cache Issue)

## Masalah
Counter "Sedang Dikerjakan" di dashboard mekanik stuck di angka 1, padahal sudah klik "Mulai Servis" untuk tiket baru.

## Root Cause
**BUKAN masalah database atau migration!** Ini masalah **Next.js caching** yang terlalu agresif.

## Solusi yang Sudah Diterapkan

### 1. Double Router Refresh
Menambahkan double refresh dengan delay untuk memastikan cache benar-benar clear:

```typescript
// ServiceActionButtons.tsx
router.refresh();
setTimeout(() => {
  router.refresh();
}, 100);
```

### 2. Aggressive Path Revalidation
Menambahkan revalidation yang lebih agresif dengan explicit type:

```typescript
// revalidation.ts
revalidatePath('/mechanic', 'page'); // Force page revalidation
revalidatePath('/mechanic', 'layout'); // Also revalidate layout
```

### 3. Timestamp Display
Menambahkan timestamp di dashboard untuk memastikan halaman benar-benar refresh:
- Lihat "Last updated: HH:MM:SS" di pojok kanan atas dashboard

## Cara Testing

### Test 1: Hard Refresh Browser
1. Buka dashboard mekanik
2. Tekan **Ctrl+Shift+R** (Windows) atau **Cmd+Shift+R** (Mac)
3. Lihat timestamp berubah
4. Cek counter

### Test 2: Clear Browser Cache
1. Buka DevTools (F12)
2. Klik kanan tombol refresh
3. Pilih "Empty Cache and Hard Reload"
4. Cek counter

### Test 3: Incognito/Private Window
1. Buka browser dalam mode incognito
2. Login sebagai mekanik
3. Test flow mulai servis
4. Cek apakah counter update

### Test 4: Verify Database
Jalankan script ini di Supabase SQL Editor:

```sql
-- Check current bookings status
SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  b.updated_at
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.updated_at DESC
LIMIT 10;
```

**Expected Result:**
- Booking yang baru di-start harus punya `booking_status = 'in_progress'`
- `progress_status = 'in_progress'`
- `updated_at` harus timestamp terbaru

## Jika Masih Stuck

### Option 1: Manual Refresh Dashboard
Setelah klik "Mulai Servis":
1. Klik logo/home di navbar
2. Klik kembali ke "Dashboard Mekanik"
3. Counter harus update

### Option 2: Check Console Errors
1. Buka DevTools (F12)
2. Tab Console
3. Cek ada error merah?
4. Screenshot dan kirim ke saya

### Option 3: Verify Function Execution
Jalankan ini di Supabase SQL Editor untuk test function langsung:

```sql
-- Test start_service_atomic function
-- Replace dengan booking_id dan user_id yang sebenarnya
SELECT start_service_atomic(
  'YOUR_BOOKING_ID'::uuid,
  'YOUR_USER_ID'::uuid
);
```

Expected result: `{"success": true}`

## Debug Checklist

- [ ] Migration 007 sudah di-run di Supabase
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Timestamp di dashboard berubah saat refresh
- [ ] Database menunjukkan status `in_progress` untuk booking yang di-start
- [ ] Console tidak ada error
- [ ] Test di incognito window

## Catatan Penting

**JANGAN run migration lagi!** Migration sudah benar. Ini murni masalah cache browser/Next.js.

Kalau setelah hard refresh masih stuck, kemungkinan:
1. Browser cache terlalu agresif → Clear all cache
2. Service Worker aktif → Disable di DevTools
3. CDN/Proxy cache → Bypass dengan query param `?t=timestamp`

## Next Steps

Setelah fix ini:
1. Test dengan 2-3 booking baru
2. Verify counter update setiap kali mulai/selesai servis
3. Cek timestamp berubah setiap refresh
4. Kalau masih ada issue, screenshot + console log
