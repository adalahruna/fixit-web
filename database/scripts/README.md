# Database Scripts

## Seed Admin Users

Script untuk create admin users dengan Supabase Auth.

### Setup

1. **Copy environment variables dari frontend:**
```bash
cp ../../frontend/.env.local .env
```

2. **Tambahkan SUPABASE_SERVICE_ROLE_KEY:**
   - Buka Supabase Dashboard → Settings → API
   - Copy **service_role key** (secret!)
   - Tambahkan ke `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Install dependencies:**
```bash
npm install
```

### Run Seed

```bash
npm run seed:admin
```

### Default Users

Script akan create 3 users:

| Email | Password | Role |
|-------|----------|------|
| admin@bengkel.com | admin123 | admin |
| owner@bengkel.com | owner123 | owner |
| mechanic@bengkel.com | mechanic123 | mechanic |

### Notes

- Service role key harus dijaga kerahasiaannya (jangan commit!)
- Script ini pakai `admin.createUser()` untuk bypass email confirmation
- User langsung aktif dan bisa login

## Migration Scripts

### Migration 005: Audit Logs (Required for Week 14 features)

To enable audit logging functionality, you need to run the audit logs migration:

1. **Option 1: Using Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the content from `run-migration-005.sql`
   - Click "Run" to execute the migration

2. **Option 2: Using Supabase CLI**
   ```bash
   supabase db reset  # If you want to reset and apply all migrations
   ```

### What the migration adds:
- `audit_logs` table for tracking user activities
- Proper indexes for performance
- RLS policies for security
- Support for audit logging in the application

**Note:** This migration is required for the audit logging and KPI dashboard features to work properly.

## Backfill Scripts

### backfill-service-progress.sql
Backfills service progress data for existing bookings.