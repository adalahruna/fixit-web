# Cara Membuat Akun Mekanik

## ⚠️ SETUP AWAL (Wajib Dilakukan Sekali)

**Sebelum membuat mekanik pertama kali, Anda HARUS:**

### 1. Jalankan Migration 008 (Fix RLS)
Migration ini mengizinkan admin untuk membuat user account untuk mekanik.

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

📖 **Detail lengkap**: Lihat file `FIX_MECHANIC_ACCOUNT_CREATION.md`

### 2. Nonaktifkan Email Confirmation di Supabase

1. Buka Supabase Dashboard → Authentication → Providers
2. Scroll ke **Email**
3. **MATIKAN** toggle "Confirm email"
4. Klik **Save**

📖 **Detail lengkap**: Lihat file `SETUP_SUPABASE_EMAIL_CONFIRMATION.md`

---

## Fitur: Buat Mekanik + Akun Login Sekaligus

Sekarang saat membuat mekanik baru, sistem akan otomatis membuat akun login untuk mekanik tersebut.

### Langkah-langkah:

1. **Login sebagai Admin/Owner**
2. **Buka menu "Kelola Mekanik"**
3. **Klik "Tambah Mekanik"**
4. **Isi form dengan data berikut:**
   - **Nama Mekanik** (wajib)
   - **Email** (wajib) - Email untuk login mekanik
   - **Password** (wajib, minimal 6 karakter) - Password untuk login
   - **Status** - Aktif/Nonaktif
   - **Kapasitas Harian** (opsional)
   - **Catatan Skill** (opsional)

5. **Klik "Simpan"**

### Hasil:

Setelah berhasil, sistem akan menampilkan:
- ✅ Pesan sukses
- 📧 **Informasi akun login** (email dan password)
- ⚠️ **Penting**: Simpan informasi ini dan berikan ke mekanik

### Yang Terjadi di Backend:

1. Sistem membuat akun di Supabase Auth menggunakan `signUp()`
2. Sistem membuat record di tabel `users` dengan role `mechanic`
3. Sistem membuat record di tabel `mechanics` yang ter-link ke user
4. Mekanik langsung bisa login (jika email confirmation sudah dinonaktifkan)

### Keuntungan:

- ✅ Semua mekanik punya akun sendiri
- ✅ Mekanik bisa login dan lihat tiket yang di-assign ke mereka
- ✅ Tidak perlu link manual lagi
- ✅ Data konsisten antara user dan mechanic
- ✅ Tidak perlu Service Role Key

### Untuk Mekanik yang Sudah Ada (Belum Punya Akun):

Jika ada mekanik lama yang belum punya akun:
1. Buka menu "Kelola Mekanik"
2. Akan ada notifikasi kuning: "Ada X mekanik yang belum terhubung dengan user"
3. Klik tombol "🔗 Link User" atau link di notifikasi
4. Pilih mekanik dan user yang akan dihubungkan
5. Klik "Hubungkan"

### Catatan Penting:

- ⚠️ **Email confirmation HARUS dinonaktifkan** di Supabase Dashboard
- Email harus unik (tidak boleh duplikat)
- Password minimal 6 karakter
- Setelah dibuat, password tidak bisa dilihat lagi (hanya ditampilkan sekali)
- Mekanik bisa ganti password sendiri setelah login pertama kali

### Troubleshooting:

**Error: "User not allowed" atau "not_admin"**
- **Root cause**: RLS policy memblokir admin untuk insert ke tabel `users`
- **Solusi**: Jalankan Migration 008 (lihat `FIX_MECHANIC_ACCOUNT_CREATION.md`)

**Akun tidak muncul di tabel mekanik**
- **Root cause**: RLS policy memblokir insert ke tabel `users`
- **Solusi**: Jalankan Migration 008 (lihat `FIX_MECHANIC_ACCOUNT_CREATION.md`)
- **Verify**: Jalankan `database/scripts/check-mechanic-accounts.sql` untuk cek status

**Mekanik tidak bisa login setelah dibuat**
- Cek apakah email confirmation sudah dinonaktifkan
- Atau cek email mekanik untuk link konfirmasi (jika masih aktif)

**Email sudah terdaftar**
- Email harus unik, gunakan email lain
- Atau hapus user lama dari Supabase Auth terlebih dahulu

