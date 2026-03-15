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
