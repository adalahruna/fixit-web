# Sistem Booking Bengkel Motor

Sistem booking, antrian, dan konsultasi bengkel motor berbasis web menggunakan Next.js 16 dan Supabase.

## Tech Stack

- **Frontend & Backend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis)
- Git

## Setup Local Development

### 1. Clone Repository

```bash
git clone https://github.com/adalahruna/fixit-web.git
cd fixit-web
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Jalankan migration SQL di Supabase SQL Editor:
   - Jalankan `database/migrations/001_initial_schema.sql`
   - Jalankan `database/migrations/002_rls_policies.sql`
   - (Opsional) Jalankan `database/seeds/001_initial_data.sql` untuk data sample

3. Disable email confirmation untuk development:
   - Buka Supabase Dashboard → Authentication → Providers → Email
   - Matikan "Confirm email"

### 4. Environment Variables

Buat file `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Dapatkan credentials dari Supabase Dashboard → Project Settings → API

### 5. Run Development Server

```bash
cd frontend
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Setup User Roles

### Customer
1. Register via UI di `/register`
2. Role otomatis menjadi `customer`

### Admin/Owner
1. Register user baru via UI
2. Buka Supabase Dashboard → Table Editor → Tabel `users`
3. Ubah kolom `role` menjadi `admin` atau `owner`

### Mechanic
1. Admin buat data mekanik di `/admin/mechanics`
2. Register user baru via UI dengan nama yang **sama persis** dengan nama mekanik
3. Buka Supabase Dashboard → Table Editor → Tabel `users`
4. Ubah kolom `role` menjadi `mechanic`
5. Pastikan kolom `name` di tabel `users` sama dengan `name` di tabel `mechanics`

## Fitur yang Sudah Tersedia

### Week 1-6: Foundation
- ✅ Authentication & RBAC (4 roles: customer, admin, mechanic, owner)
- ✅ Protected routes dengan middleware
- ✅ CRUD Service Types (Admin)
- ✅ CRUD Mechanics (Admin)

### Week 7: Booking Flow
- ✅ Customer buat booking baru
- ✅ Pilih jenis servis atau konsultasi
- ✅ Validasi BR-11: keluhan wajib jika tidak pilih servis
- ✅ List & detail booking customer

### Week 9: Assignment & Queue
- ✅ Admin list semua booking
- ✅ Admin assign/unassign booking ke mekanik
- ✅ Mekanik lihat queue/antrian
- ✅ Mekanik lihat detail booking yang di-assign

## User Flow

### Customer Flow
1. Register/Login → Dashboard Customer
2. Klik "Buat Booking Baru"
3. Isi form booking (jadwal, data motor, pilih servis/keluhan)
4. Submit → Lihat di "Booking Saya"

### Admin Flow
1. Login sebagai admin → Dashboard Admin
2. Klik "Kelola Booking" → Lihat semua booking
3. Klik "Detail" pada booking → Pilih mekanik → Assign
4. Booking status berubah menjadi "Dikonfirmasi"

### Mechanic Flow
1. Login sebagai mekanik → Dashboard Mekanik
2. Klik "Antrian Saya" → Lihat booking yang di-assign
3. Klik "Detail" untuk lihat info lengkap booking

## Project Structure

```
fixit-web/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── customer/    # Customer pages
│   │   │   ├── mechanic/    # Mechanic pages
│   │   │   └── owner/       # Owner pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities & actions
│   └── public/              # Static assets
├── database/                # Database files
│   ├── migrations/          # SQL migrations
│   └── seeds/               # Seed data
└── docs/                    # Documentation
```

## Database Schema

Lihat detail di `database/migrations/001_initial_schema.sql`

**Tabel Utama:**
- `users` - Data user (customer, admin, mechanic, owner)
- `service_types` - Master jenis servis
- `mechanics` - Data mekanik
- `bookings` - Data booking customer
- `booking_services` - Relasi booking & servis
- `booking_consultations` - Keluhan/konsultasi customer
- `assignments` - Assignment booking ke mekanik
- `service_progress` - Tracking progres servis

## Troubleshooting

### "Data mekanik tidak ditemukan"
- Pastikan nama user di tabel `users` sama persis dengan nama di tabel `mechanics` (case-sensitive)

### "Could not find column"
- Pastikan sudah menjalankan semua migration SQL di Supabase

### "Row Level Security policy violation"
- Pastikan sudah menjalankan `002_rls_policies.sql`

### Email rate limit
- Disable email confirmation di Supabase untuk development

## Development Progress

Lihat progress detail di `PROGRESS.md`

**Current Status:** Week 9 (Assignment & Queue Management) ✅

**Next:** Week 11 (Service Progress - Start/Done)

## Contributing

1. Buat branch baru dari `dev`
2. Commit changes
3. Push ke branch
4. Buat Pull Request ke `dev`

## License

Private project untuk tugas kuliah RPL.
