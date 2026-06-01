# Fix: Pesan Error Reassign Mechanic & Bug updated_at Column

## Masalah

### Bug 1: Pesan Error Kurang Formal
Saat admin mencoba mengganti mekanik yang sudah di-assign ke booking lain, pesan error yang muncul masih menggunakan istilah teknis "reassign" yang kurang formal.

**Pesan Lama:**
- ❌ "Tidak dapat reassign mekanik saat servis sedang dikerjakan"
- ❌ "Tidak dapat reassign mekanik karena tiket sudah selesai"

**Pesan Baru:**
- ✅ "Tidak dapat mengganti mekanik saat servis sedang dikerjakan"
- ✅ "Tidak dapat mengganti mekanik karena servis sudah selesai"

### Bug 2: Column updated_at Tidak Ada
Saat paksa ganti mekanik tanpa unassign, muncul error:
```
column "updated_at" of relation "assignments" does not exist
```

**Root Cause:** Table `assignments` tidak memiliki kolom `updated_at`, hanya `assigned_at`.

## Solusi

### File yang Diubah
1. `database/migrations/010_fix_reassign_mechanic.sql` - Fixed error messages & removed updated_at
2. `database/scripts/fix-reassign-message.sql` - Script untuk apply fix (updated)

## Cara Menjalankan Fix

### Opsi 1: Via psql (Lokal)
```bash
cd database/scripts
psql -h localhost -U postgres -d fixit_db -f fix-reassign-message.sql
```

### Opsi 2: Via Supabase SQL Editor
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy-paste isi file `database/scripts/fix-reassign-message.sql`
4. Klik "Run"

### Opsi 3: Via Node.js Script
```bash
cd database/scripts
npx tsx seed-admin.ts
# Atau gunakan script khusus jika ada
```

## Verifikasi

Setelah menjalankan fix, coba:

1. **Test Case 1: Reassign saat servis in_progress**
   - Assign booking ke Mekanik A
   - Start service
   - Coba reassign ke Mekanik B
   - **Expected:** Muncul pesan "Tidak dapat mengganti mekanik saat servis sedang dikerjakan"

2. **Test Case 2: Reassign setelah servis selesai**
   - Assign booking ke Mekanik A
   - Complete service
   - Coba reassign ke Mekanik B
   - **Expected:** Muncul pesan "Tidak dapat mengganti mekanik karena servis sudah selesai"

3. **Test Case 3: Reassign normal (queued status)**
   - Assign booking ke Mekanik A
   - Coba reassign ke Mekanik B (sebelum start service)
   - **Expected:** Berhasil reassign tanpa error

## Technical Details

### Database Function Updated
- **Function:** `assign_mechanic_atomic(p_booking_id UUID, p_mechanic_id UUID)`
- **Changes:** 
  1. Error message strings (reassign → mengganti)
  2. Removed `updated_at = NOW()` from UPDATE statement (column doesn't exist)
- **Impact:** No breaking changes, fixes runtime error

### Bugs Fixed
1. **Informal error messages** - Changed to formal Indonesian
2. **Column not found error** - Removed reference to non-existent `updated_at` column

### Table Schema Note
```sql
-- assignments table does NOT have updated_at column
CREATE TABLE assignments (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    mechanic_id UUID NOT NULL,
    queue_position INTEGER NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- Only this timestamp exists
    UNIQUE(booking_id)
);
```

### Error Conditions
1. **in_progress status:** Prevents reassignment during active service
2. **done status:** Prevents reassignment after service completion
3. **queued status:** Allows reassignment (normal case)

## Commit Message
```
fix(assignments): improve reassign error messages and remove invalid column reference

Bug 1: Informal error messages
- Change "reassign" to "mengganti" for better formality
- Update error messages in assign_mechanic_atomic function

Bug 2: Column not found error
- Remove reference to non-existent "updated_at" column in assignments table
- Table only has "assigned_at" timestamp column

Error messages updated:
- "Tidak dapat reassign mekanik saat servis sedang dikerjakan"
  → "Tidak dapat mengganti mekanik saat servis sedang dikerjakan"
- "Tidak dapat reassign mekanik karena tiket sudah selesai"
  → "Tidak dapat mengganti mekanik karena servis sudah selesai"

Fixes runtime error: column "updated_at" of relation "assignments" does not exist
```

## Related Files
- `database/migrations/010_fix_reassign_mechanic.sql`
- `database/scripts/fix-reassign-message.sql`
- `frontend/src/lib/assignments/actions.ts` (uses the function)
- `frontend/src/app/admin/bookings/[id]/page.tsx` (displays errors)

## Notes
- Pesan error ini berasal dari database function, bukan dari frontend
- Perubahan hanya pada string message, tidak ada perubahan logic
- Backward compatible - tidak perlu update frontend code
