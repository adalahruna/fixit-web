# Setup Supabase - Disable Email Confirmation

## ⚠️ PENTING: Nonaktifkan Email Confirmation

Saat membuat akun mekanik, secara default Supabase akan mengirim email konfirmasi. Untuk sistem internal ini, kita perlu menonaktifkan fitur tersebut.

## Langkah-langkah:

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project Anda

### 2. Masuk ke Authentication Settings
- Klik menu **Authentication** di sidebar kiri
- Klik tab **Providers**
- Scroll ke bagian **Email**

### 3. Nonaktifkan Email Confirmation
- Cari setting **"Confirm email"**
- **MATIKAN/DISABLE** toggle ini
- Klik **Save**

### 4. (Opsional) Atur Email Templates
Jika Anda tetap ingin menggunakan email confirmation:
- Klik tab **Email Templates**
- Customize template "Confirm signup"
- Atur redirect URL sesuai kebutuhan

## Kenapa Perlu Dinonaktifkan?

1. **Sistem Internal**: Mekanik dibuat oleh admin, bukan self-registration
2. **Akses Langsung**: Mekanik perlu bisa login langsung setelah akun dibuat
3. **No Email Server**: Mungkin belum setup SMTP untuk kirim email
4. **Simplicity**: Admin yang bertanggung jawab memberikan kredensial ke mekanik

## Alternatif: Gunakan Service Role Key

Jika Anda ingin tetap menggunakan email confirmation tapi auto-confirm saat admin buat akun:

1. Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`
2. Buat Supabase client khusus dengan service role key
3. Gunakan `supabase.auth.admin.createUser()` dengan `email_confirm: true`

**Contoh:**
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
```

## Status Saat Ini

Kode sudah diupdate untuk menggunakan `signUp()` biasa yang akan:
- ✅ Membuat akun di Supabase Auth
- ✅ Membuat record di tabel `users`
- ✅ Membuat record di tabel `mechanics` dengan link ke user
- ⚠️ Memerlukan email confirmation dinonaktifkan (atau user confirm email manual)

## Testing

Setelah disable email confirmation:
1. Buat mekanik baru dari admin panel
2. Coba login dengan email dan password yang dibuat
3. Seharusnya bisa login langsung tanpa konfirmasi email
