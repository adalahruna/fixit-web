# Simple KPI Fix - Summary

## ✅ Perubahan yang Sudah Dilakukan

Saya sudah mengupdate file `frontend/src/lib/kpi/calculations.ts` untuk mengganti 3 placeholder values dengan perhitungan real dari database:

### 1. ✅ Revenue yang Real (Total Revenue & Average Booking Value)

**Sebelum:**
```typescript
// Menghitung revenue dari SEMUA bookings (termasuk pending, cancelled)
bookings?.forEach(booking => {
  if (booking.booking_services && Array.isArray(booking.booking_services)) {
    const bookingRevenue = booking.booking_services.reduce((sum, bs) => {
      return sum + (serviceType?.price || 0);
    }, 0);
    totalRevenue += bookingRevenue;
    totalBookingValue += bookingRevenue;
  }
});
```

**Sesudah:**
```typescript
// HANYA menghitung revenue dari bookings yang status = 'done'
bookings?.forEach(booking => {
  if (booking.status === 'done' && booking.booking_services && Array.isArray(booking.booking_services)) {
    const bookingRevenue = booking.booking_services.reduce((sum, bs) => {
      const serviceType = bs.service_type;
      // Treat NULL prices as 0
      return sum + (serviceType?.price || 0);
    }, 0);
    totalRevenue += bookingRevenue;
  }
  
  // Average booking value: exclude cancelled bookings
  if (booking.status !== 'cancelled' && booking.booking_services && Array.isArray(booking.booking_services)) {
    const bookingValue = booking.booking_services.reduce((sum, bs) => {
      const serviceType = bs.service_type;
      return sum + (serviceType?.price || 0);
    }, 0);
    totalBookingValue += bookingValue;
  }
});

const nonCancelledBookings = totalBookings - cancelledBookings;
const averageBookingValue = nonCancelledBookings > 0 
  ? Math.round(totalBookingValue / nonCancelledBookings)
  : 0;
```

**Hasil:**
- `totalRevenue` sekarang hanya menghitung dari bookings dengan status 'done'
- `averageBookingValue` sekarang exclude bookings yang cancelled
- NULL prices di-treat sebagai 0

---

### 2. ✅ Reschedule Rate yang Real

**Sebelum:**
```typescript
const rescheduleRate = 5; // Placeholder - would need reschedule tracking
```

**Sesudah:**
```typescript
// Query audit_logs untuk action = 'reschedule_booking'
const { data: rescheduleEvents } = await supabase
  .from('audit_logs')
  .select('id')
  .eq('action', 'reschedule_booking')
  .gte('timestamp_log', start.toISOString())
  .lte('timestamp_log', endOfDay.toISOString());

const rescheduledCount = rescheduleEvents?.length || 0;
const rescheduleRate = totalBookings > 0 
  ? Math.round((rescheduledCount / totalBookings) * 100 * 10) / 10  // Round to 1 decimal
  : 0;
```

**Hasil:**
- Reschedule rate sekarang dihitung dari audit_logs table
- Formula: (jumlah reschedule events / total bookings) * 100
- Rounded ke 1 decimal place (contoh: 5.3%)
- Return 0% jika tidak ada bookings

---

### 3. ✅ Average Wait Time yang Real

**Sebelum:**
```typescript
const averageWaitTime = 30; // Placeholder - would calculate from booking to service start
```

**Sesudah:**
```typescript
// Filter bookings yang punya wait time valid
const bookingsWithWaitTime = bookings?.filter(b => {
  if (b.status !== 'done') return false;
  
  const progress = Array.isArray(b.service_progress) 
    ? b.service_progress[0] 
    : b.service_progress;
  
  // Must have start_time and it must be after created_at
  if (!progress?.start_time) return false;
  
  const createdAt = new Date(b.created_at);
  const startTime = new Date(progress.start_time);
  
  return startTime > createdAt;
}) || [];

// Calculate total wait time in minutes
const totalWaitMinutes = bookingsWithWaitTime.reduce((sum, booking) => {
  const progress = Array.isArray(booking.service_progress) 
    ? booking.service_progress[0] 
    : booking.service_progress;
  
  const createdAt = new Date(booking.created_at);
  const startTime = new Date(progress!.start_time!);
  
  // Calculate wait time in minutes
  const waitMinutes = (startTime.getTime() - createdAt.getTime()) / (1000 * 60);
  return sum + waitMinutes;
}, 0);

const averageWaitTime = bookingsWithWaitTime.length > 0
  ? Math.round(totalWaitMinutes / bookingsWithWaitTime.length * 10) / 10  // Round to 1 decimal
  : 0;
```

**Hasil:**
- Wait time sekarang dihitung dari `booking.created_at` sampai `service_progress.start_time`
- Hanya menghitung bookings dengan status 'done'
- Exclude bookings yang tidak punya service_progress atau start_time
- Exclude bookings dimana start_time lebih awal dari created_at (data invalid)
- Rounded ke 1 decimal place (contoh: 32.5 minutes)
- Return 0 jika tidak ada data valid

---

## 📊 Cara Test

1. **Buka Owner Dashboard atau Admin Dashboard**
   ```
   http://localhost:3000/owner
   http://localhost:3000/admin/dashboard
   ```

2. **Lihat KPI Cards:**
   - **Total Revenue**: Sekarang menampilkan jumlah real dari completed bookings
   - **Reschedule Rate**: Sekarang menampilkan persentase real dari audit logs
   - **Average Wait Time**: Sekarang menampilkan rata-rata waktu tunggu real dalam menit

3. **Verifikasi dengan Database:**
   
   **Check Total Revenue:**
   ```sql
   SELECT 
     SUM(st.price) as total_revenue
   FROM bookings b
   JOIN booking_services bs ON b.id = bs.booking_id
   JOIN service_types st ON bs.service_type_id = st.id
   WHERE b.status = 'done'
     AND b.schedule_start >= NOW() - INTERVAL '30 days';
   ```
   
   **Check Reschedule Rate:**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE action = 'reschedule_booking') as reschedules,
     (SELECT COUNT(*) FROM bookings WHERE schedule_start >= NOW() - INTERVAL '30 days') as total_bookings,
     ROUND(
       (COUNT(*) FILTER (WHERE action = 'reschedule_booking')::numeric / 
        (SELECT COUNT(*) FROM bookings WHERE schedule_start >= NOW() - INTERVAL '30 days')::numeric) * 100, 
       1
     ) as reschedule_rate_percent
   FROM audit_logs
   WHERE timestamp_log >= NOW() - INTERVAL '30 days';
   ```
   
   **Check Average Wait Time:**
   ```sql
   SELECT 
     AVG(
       EXTRACT(EPOCH FROM (sp.start_time - b.created_at)) / 60
     ) as avg_wait_minutes
   FROM bookings b
   JOIN service_progress sp ON b.id = sp.booking_id
   WHERE b.status = 'done'
     AND sp.start_time IS NOT NULL
     AND sp.start_time > b.created_at
     AND b.schedule_start >= NOW() - INTERVAL '30 days';
   ```

---

## 🎯 Apa yang Berubah di UI?

### Owner Dashboard (`/owner`)
- **Total Revenue Card**: Sekarang menampilkan angka real dari completed bookings
- **Average Booking Value**: Sekarang exclude cancelled bookings

### Admin Dashboard (`/admin/dashboard`)
- **Reschedule Rate**: Tidak lagi hardcoded 5%, tapi dihitung dari audit logs
- **Average Wait Time**: Tidak lagi hardcoded 30 min, tapi dihitung dari booking creation sampai service start

---

## 🔧 Technical Details

**File yang Diubah:**
- `frontend/src/lib/kpi/calculations.ts`

**Dependencies:**
- Tidak ada dependency baru
- Menggunakan Supabase client yang sudah ada
- Menggunakan audit_logs table yang sudah ada

**Performance:**
- Menambah 1 query ke audit_logs table untuk reschedule rate
- Query sudah di-filter by date range untuk performance
- Tidak ada N+1 query problem

**Edge Cases yang Di-handle:**
1. NULL prices → treated as 0
2. Bookings tanpa service_progress → excluded dari wait time calculation
3. Invalid data (start_time < created_at) → excluded
4. Zero bookings → return 0 untuk semua metrics
5. Division by zero → handled dengan conditional checks

---

## ✅ Done!

Sekarang KPI Dashboard Anda menampilkan data yang real dari database, bukan placeholder values lagi. 

Tidak perlu install dependency baru, tidak perlu migration database, tidak perlu setup testing framework yang kompleks. Simple dan langsung jalan! 🚀
