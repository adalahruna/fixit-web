# Analysis: Mechanic CRUD Bug - Akun Masuk ke Users Tapi Tidak ke Mechanics

## 🐛 Problem
Saat admin membuat akun mekanik baru:
- ✅ Akun berhasil masuk ke tabel `users`
- ❌ Akun TIDAK masuk ke tabel `mechanics`
- ❌ Admin dapat error "Forbidden" setelah submit

## 🔍 Deep Analysis

### Flow Eksekusi (BEFORE FIX)
```typescript
1. supabase = createClient() // Client dengan admin session
2. signUp() // Auto-login sebagai mekanik → session berubah
3. setSession(adminSession) // Restore admin session di auth state
4. insert ke users // ✅ Berhasil (Migration 008 sudah fix RLS)
5. insert ke mechanics // ❌ GAGAL!
```

### Root Cause: Stale Supabase Client

**Masalah utama**: Setelah `setSession()` dipanggil, **Supabase client yang sudah dibuat masih menggunakan session mekanik yang lama**!

```typescript
const supabase = await createClient(); // Client A dengan admin session

await supabase.auth.signUp({ ... }); // Session berubah ke mekanik

await supabase.auth.setSession(adminSession); // Auth state restored

// TAPI: supabase (Client A) masih pakai session mekanik!
await supabase.from('mechanics').insert({ ... }); // RLS cek auth.uid() = mekanik UID
```

### Why Insert to `users` Succeeded?
Migration 008 menambahkan policy baru:
```sql
CREATE POLICY "Admin can insert user data"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()  -- Cek apakah auth.uid() adalah admin
    AND users.role IN ('admin', 'owner')
  )
);
```

Tapi ini **TIDAK MEMBANTU** karena `auth.uid()` masih mekanik UID, bukan admin UID!

Insert ke `users` berhasil karena ada policy lain:
```sql
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

Kebetulan `auth.uid()` (mekanik) = `id` (mekanik yang baru dibuat), jadi lolos!

### Why Insert to `mechanics` Failed?
RLS policy untuk `mechanics`:
```sql
CREATE POLICY "Admin can insert mechanics"
ON mechanics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()  -- auth.uid() = mekanik UID
    AND users.role IN ('admin', 'owner')  -- Tapi mekanik role = 'mechanic'
  )
);
```

Check gagal karena:
- `auth.uid()` = mekanik UID (bukan admin)
- Query ke `users` WHERE `id = mekanik UID` AND `role IN ('admin', 'owner')` → **NO ROWS**
- RLS memblokir insert

## ✅ Solution

### Fix: Create New Supabase Client After Session Restore

```typescript
// 1. Save admin session
const { data: { session: adminSession } } = await supabase.auth.getSession();

// 2. signUp (auto-login as mechanic)
await supabase.auth.signUp({ ... });

// 3. Restore admin session
await supabase.auth.setSession(adminSession);

// 4. CREATE NEW CLIENT with restored session
const adminSupabase = await createClient();

// 5. Use NEW CLIENT for database operations
await adminSupabase.from('users').insert({ ... }); // ✅ auth.uid() = admin
await adminSupabase.from('mechanics').insert({ ... }); // ✅ auth.uid() = admin
```

### Why This Works
- `createClient()` membaca session dari cookies/storage
- Setelah `setSession()`, session di storage sudah admin
- Client baru akan menggunakan admin session
- `auth.uid()` sekarang = admin UID
- RLS policy untuk `mechanics` lolos karena admin role

## 📋 What Changed

### Code Changes
**File**: `frontend/src/lib/mechanics/actions.ts`

**Before**:
```typescript
await supabase.auth.setSession(adminSession);
await supabase.from('users').insert({ ... }); // Stale client
await supabase.from('mechanics').insert({ ... }); // Stale client
```

**After**:
```typescript
await supabase.auth.setSession(adminSession);
const adminSupabase = await createClient(); // NEW CLIENT
await adminSupabase.from('users').insert({ ... }); // Fresh client
await adminSupabase.from('mechanics').insert({ ... }); // Fresh client
```

## 🧪 Testing

### Test Case 1: Create Mechanic
1. Login sebagai admin
2. Buka `/admin/mechanics/new`
3. Isi form dengan:
   - Nama: Test Mekanik
   - Email: test@example.com
   - Password: test123
   - Status: Aktif
4. Submit form

**Expected**:
- ✅ Success message muncul
- ✅ Akun masuk ke tabel `users`
- ✅ Akun masuk ke tabel `mechanics` dengan `user_id` terhubung
- ✅ Admin tetap login (tidak ada error "Forbidden")

### Test Case 2: Verify in Database
Run di Supabase SQL Editor:
```sql
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  m.user_id,
  u.id as user_id,
  u.email,
  u.role
FROM mechanics m
INNER JOIN users u ON m.user_id = u.id
WHERE u.email = 'test@example.com';
```

**Expected**: 1 row dengan data lengkap

### Test Case 3: Mechanic Can Login
1. Logout dari admin
2. Login dengan email: test@example.com, password: test123
3. Akses `/mechanic` dashboard

**Expected**: Berhasil login dan bisa akses dashboard

## 🚨 Important Notes

1. **Migration 008 TETAP DIPERLUKAN** meskipun tidak langsung membantu
   - Policy ini akan berguna untuk future use cases
   - Lebih baik punya policy yang lengkap

2. **Session restore + new client** adalah kunci solusi
   - `setSession()` saja tidak cukup
   - Harus create client baru untuk refresh session

3. **Email confirmation HARUS disabled**
   - Jika aktif, mekanik tidak bisa login langsung
   - Setup di Supabase Dashboard → Authentication → Providers → Email

## 📁 Related Files

- `frontend/src/lib/mechanics/actions.ts` - Fixed code
- `database/migrations/008_fix_users_insert_rls.sql` - RLS policy (still needed)
- `database/scripts/check-mechanic-accounts.sql` - Verification script
- `FIX_MECHANIC_ACCOUNT_CREATION.md` - User documentation

## 🎯 Conclusion

Masalah bukan di RLS policy saja, tapi di **stale Supabase client** yang masih menggunakan session lama setelah `setSession()`. Solusinya adalah membuat client baru setelah restore session, sehingga client menggunakan admin session yang benar untuk semua database operations.
