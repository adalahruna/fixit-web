# Fix: Mechanic Account Creation Issue

## 🐛 Problem
Saat admin membuat akun mekanik baru:
1. Akun tidak muncul di tabel mekanik (RLS issue - FIXED)
2. Setelah submit form, admin diarahkan ke `/admin/mechanics/new` dan dapat error "Forbidden"

## 🔍 Root Cause

### Issue 1: RLS Blocking Insert (FIXED)
RLS policy untuk tabel `users` hanya mengizinkan user untuk insert data mereka sendiri:
```sql
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

Saat admin membuat mekanik baru:
1. Admin login dengan UID admin (contoh: `abc-123`)
2. `signUp()` membuat user baru dengan UID baru (contoh: `xyz-789`)
3. Kode mencoba insert ke tabel `users` dengan `id = xyz-789`
4. RLS memblokir karena `auth.uid()` (abc-123) ≠ `id` (xyz-789)

### Issue 2: Session Hijacking (FIXED)
Saat `signUp()` dipanggil, Supabase **otomatis login sebagai user yang baru dibuat**:
1. Admin submit form untuk buat mekanik
2. `signUp()` membuat akun mekanik dan auto-login sebagai mekanik
3. Session berubah dari admin → mekanik
4. Page reload, tapi sekarang user adalah mekanik
5. Mekanik tidak punya akses ke `/admin/mechanics/new`
6. Error "Forbidden" muncul

## ✅ Solution

### Fix 1: Run Migration 008 (RLS Policy)
Jalankan migration untuk menambahkan RLS policy yang mengizinkan admin membuat user:

**Di Supabase SQL Editor**, jalankan:
```sql
-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Allow users to insert their own data (for self-registration)
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow admin/owner to insert user data for mechanics
CREATE POLICY "Admin can insert user data"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);
```

Atau copy-paste isi file: `database/scripts/run-migration-008.sql`

### Fix 2: Restore Admin Session (Code Fix - DONE)
Kode sudah diupdate untuk restore admin session setelah `signUp()`:

```typescript
// Get current admin session
const { data: { session: adminSession } } = await supabase.auth.getSession();

// Create user account (this will auto-login as new user)
const { data: authData } = await supabase.auth.signUp({ ... });

// Restore admin session
if (adminSession) {
  await supabase.auth.setSession({
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token
  });
}
```

Ini memastikan admin tetap login sebagai admin setelah membuat mekanik.

### Fix 3: Disable Email Confirmation (Jika Belum)
Pastikan email confirmation sudah dinonaktifkan di Supabase Dashboard:

1. Buka https://supabase.com
2. Pilih project Anda
3. Klik **Authentication** → **Providers**
4. Scroll ke bagian **Email**
5. **MATIKAN** toggle "Confirm email"
6. Klik **Save**

Lihat detail di: `SETUP_SUPABASE_EMAIL_CONFIRMATION.md`

### Fix 4: Test Create Mechanic
Setelah migration dijalankan:

1. Login sebagai admin
2. Buka `/admin/mechanics`
3. Klik "Tambah Mekanik"
4. Isi form:
   - Nama: Test Mekanik
   - Email: test@example.com
   - Password: test123
   - Status: Aktif
5. Klik "Simpan"
6. Seharusnya berhasil dan muncul success message dengan email & password
7. **Admin tetap di halaman form** - TIDAK ada redirect atau error "Forbidden"
8. Klik "Batal" atau navigate ke `/admin/mechanics` - mekanik baru harus muncul di tabel

### Fix 5: Verify in Database
Jalankan script untuk cek status akun mekanik:

**Di Supabase SQL Editor**, jalankan:
```sql
-- Check if mechanic account was created properly
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  u.id as user_id,
  u.email,
  u.role,
  m.is_active,
  m.created_at
FROM mechanics m
INNER JOIN users u ON m.user_id = u.id
WHERE u.role = 'mechanic'
ORDER BY m.created_at DESC
LIMIT 5;
```

Atau jalankan: `database/scripts/check-mechanic-accounts.sql`

## 📋 What Changed

### Before (Broken)
- **Issue 1**: RLS hanya mengizinkan user insert data mereka sendiri
- **Issue 2**: `signUp()` auto-login sebagai mekanik baru, session admin hilang
- Admin tidak bisa membuat user untuk mekanik
- Insert ke tabel `users` gagal dengan RLS error
- Setelah submit form, admin jadi logout dan dapat error "Forbidden"

### After (Fixed)
- **Fix 1**: RLS mengizinkan admin/owner insert user data untuk mekanik (Migration 008)
- **Fix 2**: Admin session di-restore setelah `signUp()` (Code fix)
- **Fix 3**: Email confirmation disabled (Setup)
- Admin bisa membuat akun mekanik lengkap dengan user account
- Admin tetap login sebagai admin setelah membuat mekanik
- Tidak ada error "Forbidden" atau session hijacking

## 🧪 Testing Checklist

- [ ] Migration 008 berhasil dijalankan tanpa error
- [ ] Email confirmation sudah dinonaktifkan di Supabase
- [ ] Admin bisa membuat mekanik baru tanpa error
- [ ] Success message muncul dengan email & password
- [ ] **Admin TIDAK dapat error "Forbidden"**
- [ ] **Admin tetap login sebagai admin** (cek nama di navbar)
- [ ] Mekanik baru muncul di halaman `/admin/mechanics`
- [ ] Mekanik baru memiliki user_id yang terhubung (tidak NULL)
- [ ] Mekanik bisa login dengan email & password yang dibuat
- [ ] Setelah login, mekanik bisa akses `/mechanic` dashboard

## 📁 Related Files

- `database/migrations/008_fix_users_insert_rls.sql` - Migration file
- `database/scripts/run-migration-008.sql` - Script untuk run migration
- `database/scripts/check-mechanic-accounts.sql` - Script untuk cek status
- `frontend/src/lib/mechanics/actions.ts` - Kode create mechanic
- `SETUP_SUPABASE_EMAIL_CONFIRMATION.md` - Setup email confirmation
- `CARA_BUAT_AKUN_MEKANIK.md` - Cara buat akun mekanik

## 🚨 Important Notes

1. **Migration HARUS dijalankan** sebelum mencoba buat mekanik lagi
2. **Email confirmation HARUS dinonaktifkan** agar mekanik bisa langsung login
3. **Session restore** sudah dihandle di kode - admin tidak akan logout lagi
4. Jika ada mekanik yang gagal dibuat sebelumnya, mereka mungkin ada di tabel `auth.users` tapi tidak di tabel `users` atau `mechanics` - perlu cleanup manual
5. Password yang ditampilkan di success message hanya muncul sekali - admin harus save dan berikan ke mekanik

## 🔧 Troubleshooting

### Issue: "Email sudah terdaftar"
- Email sudah digunakan di Supabase Auth
- Cek di Supabase Dashboard → Authentication → Users
- Hapus user lama atau gunakan email berbeda

### Issue: "Gagal menyimpan data user"
- RLS masih memblokir insert
- Pastikan migration 008 sudah dijalankan
- Cek RLS policies di Supabase Dashboard → Database → Policies

### Issue: Mekanik tidak muncul di tabel
- Refresh halaman
- Jalankan `check-mechanic-accounts.sql` untuk cek database
- Cek console browser untuk error

### Issue: Admin dapat error "Forbidden" setelah submit
- **FIXED**: Kode sudah diupdate untuk restore admin session
- Jika masih terjadi, cek apakah kode terbaru sudah di-deploy
- Restart dev server jika perlu

### Issue: Mekanik tidak bisa login
- Email confirmation mungkin masih aktif
- Cek Supabase Dashboard → Authentication → Providers → Email
- Pastikan "Confirm email" sudah dimatikan
