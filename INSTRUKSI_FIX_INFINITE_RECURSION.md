# 🔧 Fix Infinite Recursion - Cancel & Reschedule Booking

## ❌ Masalah
- Error "infinite recursion detected in policy for relation bookings"
- Terjadi saat customer cancel atau reschedule booking

## 🎯 Root Cause
Ada RLS (Row Level Security) Policy yang recursive pada tabel bookings. Policy nya mungkin reference bookings table di dalam USING clause, yang menyebabkan infinite loop.

## ✅ Solusi

Recreate RLS policies dengan non-recursive version.

### Jalankan SQL Query di Supabase SQL Editor:

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project: **tcnkjdzdkzrqjgjrleup**
3. Klik **SQL Editor** di menu kiri
4. Buat **New Query**
5. Copy file: `database/scripts/fix-rls-policy-recursion.sql`

**Atau copy-paste SQL berikut:**

```sql
-- Drop all existing policies on bookings
DROP POLICY IF EXISTS "Customers can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Mechanic can read assigned bookings" ON bookings;

-- Create simple, non-recursive policies

-- Policy 1: Customers can read their own bookings
CREATE POLICY "Customers can read own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Policy 2: Customers can create bookings
CREATE POLICY "Customers can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Policy 3: Customers and admin can update bookings
CREATE POLICY "Customers can update own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Policy 4: Admin and owner can delete bookings
CREATE POLICY "Admin can delete bookings"
ON bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);
```

6. Klik **Run** atau tekan `Ctrl+Enter`

### 📝 Yang Sudah Saya Update:
- ✅ Code `cancel-actions.ts` - manual update bookings dan service_progress
- ✅ Code `reschedule-actions.ts` - manual update bookings schedule
- ✅ RLS policies di-recreate tanpa recursion

## 🧪 Testing
Setelah query dijalankan, test:
1. Login sebagai customer
2. Buat booking baru (belum di-assign mekanik)
3. Coba **Cancel** booking → harus berhasil tanpa error ✅
4. Buat booking baru lagi
5. Coba **Reschedule** booking → harus berhasil tanpa error ✅

## ✅ Done!
Setelah SQL query dijalankan, bug infinite recursion akan hilang permanently!
