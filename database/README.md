# Database Setup

## Cara Setup Database di Supabase

### Opsi 1: Manual via Supabase Dashboard (Paling Mudah)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: `tcnkjdzdkzrqjgjrleup`
3. Klik **SQL Editor** di sidebar
4. Buat New Query
5. Copy-paste isi file `migrations/001_initial_schema.sql`
6. Klik **Run** untuk execute
7. Ulangi untuk file `seeds/001_initial_data.sql`

### Opsi 2: Via Supabase CLI (Recommended untuk Tim)

#### Install Supabase CLI

**Windows (via npm):**
```bash
npm install -g supabase
```

**Windows (via Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Setup Project

1. **Login ke Supabase:**
```bash
supabase login
```

2. **Link ke project cloud:**
```bash
supabase link --project-ref tcnkjdzdkzrqjgjrleup
```

3. **Push migration ke cloud:**
```bash
supabase db push
```

4. **Generate TypeScript types (opsional tapi recommended):**
```bash
supabase gen types typescript --linked > frontend/src/types/database.types.ts
```

## Struktur Database

### Core Tables
- `users` - Semua user (Customer, Admin, Mekanik, Owner)
- `service_types` - Master jenis servis
- `mechanics` - Data mekanik bengkel
- `bookings` - Data booking servis
- `booking_services` - Relasi booking dengan jenis servis (many-to-many)

### Consultation Tables
- `booking_consultations` - Keluhan/konsultasi customer
- `consultation_attachments` - Lampiran foto/video (optional)
- `internal_notes` - Catatan diagnosis dari Admin/Mekanik

### Operational Tables
- `assignments` - Assignment booking ke mekanik
- `service_progress` - Tracking progres servis (start/end time)
- `sla_records` - Record SLA keterlambatan

### Supporting Tables
- `payments` - Data pembayaran (optional)
- `audit_logs` - Log semua aktivitas penting

## Notes

- Semua tabel sudah enable RLS (Row Level Security)
- RLS policies akan dibuat setelah Auth setup
- Indexes sudah dibuat untuk query yang sering dipakai
- UUID dipakai untuk semua primary key
