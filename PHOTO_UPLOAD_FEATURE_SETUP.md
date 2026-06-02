# Fitur Upload Foto Keluhan - Setup Guide

## ✅ Yang Sudah Dilakukan

Saya sudah menambahkan fitur upload foto keluhan di booking form. Customer sekarang bisa upload foto kerusakan motor mereka, bukan cuma deskripsi teks aja.

### File yang Dibuat/Diubah:

1. **Database Migration**: `database/migrations/011_add_complaint_photo.sql`
   - Menambah kolom `complaint_photo_url` di table `bookings`

2. **Storage Helper** (TIDAK DIPAKAI): `frontend/src/lib/storage/complaint-photos.ts`
   - Helper functions untuk upload/delete foto (optional, bisa dihapus)

3. **Booking Form**: `frontend/src/components/bookings/BookingForm.tsx`
   - Tambah UI upload foto dengan preview
   - Validasi file type (JPG, PNG, WebP) dan size (max 5MB)
   - Convert foto ke base64 untuk dikirim ke server

4. **Booking Actions**: `frontend/src/lib/bookings/actions.ts`
   - Handle upload foto ke Supabase Storage
   - Simpan URL foto di database

---

## 🚀 Cara Setup

### 1. Jalankan Migration Database

```bash
# Masuk ke folder database scripts
cd database/scripts

# Jalankan migration
psql -h <your-supabase-host> -U postgres -d postgres -f ../migrations/011_add_complaint_photo.sql
```

Atau copy-paste SQL dari `database/migrations/011_add_complaint_photo.sql` ke Supabase SQL Editor.

---

### 2. Buat Storage Bucket di Supabase

**Via Supabase Dashboard:**

1. Buka Supabase Dashboard → **Storage**
2. Klik **New bucket**
3. Isi form:
   - **Name**: `complaint-photos`
   - **Public bucket**: ✅ **CENTANG** (biar foto bisa dilihat)
   - **File size limit**: `5242880` (5MB dalam bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
4. Klik **Create bucket**

**Via SQL (Alternative):**

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'complaint-photos', 
  'complaint-photos', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

---

### 3. Setup RLS Policies untuk Storage

Jalankan SQL ini di Supabase SQL Editor:

```sql
-- Policy: Authenticated users can upload complaint photos
CREATE POLICY "Authenticated users can upload complaint photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complaint-photos');

-- Policy: Anyone can view complaint photos (public bucket)
CREATE POLICY "Anyone can view complaint photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'complaint-photos');

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own complaint photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 4. Test Feature

1. **Jalankan dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login sebagai customer**

3. **Buat booking baru:**
   - Buka: `http://localhost:3000/customer/bookings/new`
   - Isi form booking
   - **Upload foto keluhan** (klik area upload atau drag & drop)
   - Submit booking

4. **Verifikasi:**
   - Cek di Supabase Storage → `complaint-photos` bucket → ada foto yang diupload
   - Cek di database table `bookings` → kolom `complaint_photo_url` terisi dengan URL foto

---

## 📸 Cara Pakai (User Flow)

### Customer Upload Foto:

1. Customer buka form booking
2. Isi data kendaraan, pilih servis, jadwal
3. Di bagian "Keluhan / Konsultasi":
   - Tulis deskripsi keluhan (text)
   - **Klik area upload foto** atau drag & drop foto
4. Preview foto muncul
5. Bisa hapus foto dengan klik tombol ❌ di pojok kanan atas preview
6. Submit booking

### Admin/Mechanic Lihat Foto:

✅ **Sudah diimplementasikan!** Foto keluhan otomatis muncul di:

1. **Admin Booking Detail** (`/admin/bookings/[id]`)
   - Section "📸 Foto Keluhan"
   - Tampilan full-width dengan border

2. **Mechanic Queue Detail** (`/mechanic/queue/[id]`)
   - Section "📸 Foto Keluhan"
   - Tampilan full-width dengan border

3. **Customer Booking Detail** (`/customer/bookings/[id]`)
   - Section "📸 Foto Keluhan"
   - Tampilan full-width dengan border rounded

---

## 🎨 UI Features

- ✅ Drag & drop atau klik untuk upload
- ✅ Preview foto sebelum submit
- ✅ Validasi file type (JPG, PNG, WebP only)
- ✅ Validasi file size (max 5MB)
- ✅ Error messages yang jelas
- ✅ Tombol hapus foto (❌)
- ✅ Icon upload yang menarik
- ✅ Responsive design

---

## 🔒 Security

- ✅ File type validation (hanya image)
- ✅ File size limit (max 5MB)
- ✅ RLS policies (authenticated users only can upload)
- ✅ Organized by user ID (folder per customer)
- ✅ Public bucket (foto bisa dilihat tanpa auth - untuk admin/mechanic)

---

## 📝 Database Schema

```sql
-- Kolom baru di table bookings:
ALTER TABLE bookings 
ADD COLUMN complaint_photo_url TEXT;

-- Contoh data:
-- complaint_photo_url: 'https://xxx.supabase.co/storage/v1/object/public/complaint-photos/user-id/1234567890.jpg'
```

---

## 🐛 Troubleshooting

### Error: "Bucket not found"
**Solusi**: Pastikan bucket `complaint-photos` sudah dibuat di Supabase Storage.

### Error: "new row violates row-level security policy"
**Solusi**: Pastikan RLS policies sudah dibuat dengan SQL di atas.

### Foto tidak muncul
**Solusi**: 
1. Cek bucket `complaint-photos` di Supabase Storage
2. Pastikan bucket di-set sebagai **public**
3. Cek URL di database table `bookings` kolom `complaint_photo_url`

### File size terlalu besar
**Solusi**: Compress foto dulu sebelum upload, atau naikkan limit di bucket settings.

---

## ✅ Done!

Sekarang customer bisa upload foto keluhan motor mereka saat booking! 📸🏍️

Fitur ini akan sangat membantu mechanic untuk:
- Lihat kondisi motor sebelum customer datang
- Persiapkan spare parts yang dibutuhkan
- Estimasi waktu servis lebih akurat
- Komunikasi lebih jelas dengan customer

---

## 🔄 Next Steps (Optional)

Kalau mau lebih advanced, bisa tambahkan:

1. **Multiple photos** (upload lebih dari 1 foto)
2. **Image compression** di client-side sebelum upload
3. **Photo gallery** di booking detail page
4. **Delete photo** functionality (kalau customer mau ganti foto)
5. **Photo annotations** (markup foto dengan arrow/text)

Tapi untuk sekarang, fitur basic upload 1 foto sudah cukup! 🎉
