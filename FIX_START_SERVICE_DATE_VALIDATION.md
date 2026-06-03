# Fix: Validasi Tanggal Mulai Servis

## Masalah
Mekanik bisa memulai pengerjaan booking **sebelum** tanggal jadwal booking. Contoh:
- Booking dijadwalkan untuk hari Minggu
- Mekanik bisa klik "Mulai Servis" di hari Kamis/Jumat/Sabtu
- **SEHARUSNYA**: Mekanik hanya bisa mulai servis pada hari yang sama dengan `scheduled_date`

## Root Cause
Fungsi `start_service_atomic` di database tidak memiliki validasi untuk memeriksa apakah tanggal saat ini sama dengan tanggal jadwal booking.

## Solusi
Menambahkan validasi tanggal pada fungsi `start_service_atomic`:

1. **Ambil tanggal jadwal** dari booking (`schedule_start`)
2. **Ambil tanggal saat ini** (dalam timezone WIB)
3. **Bandingkan kedua tanggal**
4. **Tolak request** jika tanggal tidak sama, dengan pesan error yang informatif

### Perubahan Kode

#### Database Function (`start_service_atomic`)
```sql
-- Get scheduled date from booking
SELECT DATE(schedule_start AT TIME ZONE 'Asia/Jakarta') INTO v_scheduled_date
FROM bookings
WHERE id = p_booking_id;

-- Get current date in WIB timezone
v_current_date := DATE(NOW() AT TIME ZONE 'Asia/Jakarta');

-- Validate that service can only be started on the scheduled date
IF v_scheduled_date != v_current_date THEN
  RETURN json_build_object(
    'error', 
    'Servis hanya bisa dimulai pada tanggal jadwal booking (' || 
    TO_CHAR(v_scheduled_date, 'DD/MM/YYYY') || '). Hari ini: ' || 
    TO_CHAR(v_current_date, 'DD/MM/YYYY')
  );
END IF;
```

## File yang Diubah
1. ✅ `database/migrations/007_atomic_status_functions.sql` - Updated function definition
2. ✅ `database/migrations/013_validate_service_start_date.sql` - New migration file
3. ✅ `database/scripts/run-migration-013.sql` - Script runner

## Cara Apply Fix

### Option 1: Via Supabase SQL Editor (Recommended)
1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `database/migrations/013_validate_service_start_date.sql`
3. Paste dan Run

### Option 2: Via psql CLI
```bash
cd database/scripts
psql "your-connection-string" -f run-migration-013.sql
```

## Testing

### Test Case 1: Booking Hari Ini
```sql
-- Setup: Buat booking untuk hari ini
INSERT INTO bookings (schedule_start, ...) VALUES (NOW(), ...);

-- Test: Harus BERHASIL
SELECT start_service_atomic('booking-id'::uuid, 'user-id'::uuid);
-- Expected: {"success": true}
```

### Test Case 2: Booking Hari Minggu (test di hari Kamis)
```sql
-- Setup: Buat booking untuk hari Minggu
INSERT INTO bookings (schedule_start, ...) VALUES ('2024-01-14 09:00:00+07'::timestamptz, ...);

-- Test: Harus GAGAL (jika test di hari sebelum Minggu)
SELECT start_service_atomic('booking-id'::uuid, 'user-id'::uuid);
-- Expected: {"error": "Servis hanya bisa dimulai pada tanggal jadwal booking (14/01/2024). Hari ini: 11/01/2024"}
```

### Test Case 3: Manual Test via UI
1. Login sebagai mekanik
2. Buka booking yang dijadwalkan untuk besok/lusa
3. Klik tombol "Mulai Servis"
4. **Expected**: Muncul toast error dengan pesan:
   ```
   Servis hanya bisa dimulai pada tanggal jadwal booking (DD/MM/YYYY). Hari ini: DD/MM/YYYY
   ```

## Behavior Setelah Fix

### ✅ Yang Diperbolehkan
- Mekanik bisa klik "Mulai Servis" **HANYA** pada tanggal yang sama dengan `schedule_start`
- Contoh: Booking dijadwalkan Kamis 11 Jan → bisa dimulai Kamis 11 Jan (jam berapa saja)

### ❌ Yang Dilarang
- Mekanik **TIDAK BISA** memulai servis sebelum tanggal jadwal
- Mekanik **TIDAK BISA** memulai servis setelah tanggal jadwal (lewat hari)

## Edge Cases yang Ditangani

1. **Timezone**: Menggunakan `Asia/Jakarta` untuk konsistensi
2. **Jam**: Validasi hanya cek **TANGGAL**, tidak cek jam
   - Booking jam 14:00 bisa dimulai jam 08:00 (selama tanggalnya sama)
3. **Error Message**: Informatif dengan format DD/MM/YYYY

## Rollback (jika diperlukan)
Jika ada masalah, rollback dengan menjalankan versi lama:
```sql
-- Restore old function without date validation
CREATE OR REPLACE FUNCTION start_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
-- ... (versi lama tanpa validasi tanggal)
$$;
```

## Notes
- Fix ini **tidak mempengaruhi** booking yang sudah dimulai
- Frontend akan menampilkan error message dari backend
- Audit log tetap berfungsi normal
