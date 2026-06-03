# Bug Analysis: KPI Dashboard Filter Issue

## Problem Statement
**User Report:**
```
Hasil test qa
Admin memfilter visualisasi grafik data KPI pendapatan
Filter tanggal: 01/05/2026 - 31/05/2026
Grafik, charts pendapatan, dan total performa montir otomatis berubah 
menampilkan data yang akurat sesuai rentang tanggal.

Hasil:
- Grafik data membeku (freeze)
- Komponen chart admin hancur tidak proporsional
- Data pendapatan yang keluar selalu bernilai Rp 0 saat filter diubah
```

## Root Cause Analysis

### Issue 1: Revenue Always Rp 0
**Location:** `frontend/src/lib/kpi/calculations.ts` line 326-337

**Current Code:**
```typescript
bookings?.forEach(booking => {
  // Only count revenue from completed bookings (status = 'done')
  if (booking.status === 'done' && booking.booking_services && Array.isArray(booking.booking_services)) {
    const bookingRevenue = booking.booking_services.reduce((sum, bs) => {
      const serviceType = bs.service_type;
      // Treat NULL prices as 0
      return sum + (serviceType?.price || 0);
    }, 0);
    totalRevenue += bookingRevenue;
  }
  // ...
});
```

**Problem:**
1. Revenue hanya dihitung dari booking dengan status `done`
2. Jika filter tanggal tidak ada booking `done`, revenue = Rp 0
3. Booking dengan status `in_progress`, `queued`, `confirmed` tidak dihitung meskipun sudah terjadi transaksi

**Impact:**
- Real-time revenue tidak akurat
- Dashboard menampilkan Rp 0 padahal ada booking aktif
- Business insight tidak reliable

### Issue 2: Weekly Trend Calculation Mismatch
**Location:** `frontend/src/lib/kpi/calculations.ts` line 385-407

**Current Code:**
```typescript
const weekBookings = bookings?.filter(b => {
  const bookingDate = new Date(b.created_at);
  return bookingDate >= weekStart && bookingDate <= weekEnd;
}) || [];
```

**Problem:**
1. Menggunakan `created_at` untuk filter weekly trend
2. Tapi query utama menggunakan `schedule_start` untuk filter bookings
3. Inconsistency menyebabkan data tidak match dengan total bookings

**Impact:**
- Weekly trend tidak konsisten dengan metrics lainnya
- Data visualization menyesatkan

### Issue 3: Chart Component Freezing
**Possible Causes:**
1. **Large dataset without pagination**: Jika booking data sangat besar, render bisa freeze
2. **Nested loops tanpa optimization**: Multiple `forEach` dan `reduce` bisa slow
3. **Missing key props di React components**: Menyebabkan re-render issues
4. **Chart library memory leak**: Tidak dispose old chart instances

## Proposed Solutions

### Solution 1: Fix Revenue Calculation Logic

**Option A: Count ALL non-cancelled bookings**
```typescript
// Count revenue from all bookings except cancelled
if (booking.status !== 'cancelled' && booking.booking_services && Array.isArray(booking.booking_services)) {
  const bookingRevenue = booking.booking_services.reduce((sum, bs) => {
    const serviceType = bs.service_type;
    return sum + (serviceType?.price || 0);
  }, 0);
  totalRevenue += bookingRevenue;
}
```

**Pros:**
- ✅ Shows real business revenue (confirmed bookings = revenue commitment)
- ✅ Tidak akan Rp 0 kecuali memang tidak ada booking
- ✅ Lebih akurat untuk business forecasting

**Cons:**
- ❌ Include pending bookings yang belum bayar

**Option B: Separate "Confirmed Revenue" vs "Projected Revenue"**
```typescript
let confirmedRevenue = 0;  // only 'done'
let projectedRevenue = 0;  // 'confirmed', 'queued', 'in_progress'
```

**Pros:**
- ✅ Clear distinction between realized vs projected
- ✅ More detailed business insight
- ✅ Better for cash flow analysis

**Cons:**
- ❌ Requires UI changes to show both metrics

**Recommendation:** Use Option A for now (simpler), consider Option B for future enhancement

### Solution 2: Consistent Date Filtering

**Fix weekly trend to use `schedule_start`:**
```typescript
const weekBookings = bookings?.filter(b => {
  const bookingDate = new Date(b.schedule_start); // Changed from created_at
  return bookingDate >= weekStart && bookingDate <= weekEnd;
}) || [];
```

### Solution 3: Performance Optimization

**Add pagination/limiting:**
```typescript
.limit(1000) // Prevent loading too many bookings
```

**Use React.memo for chart components:**
```typescript
export const ChartCard = React.memo(({ title, children }) => {
  // ...
});
```

**Add loading states:**
```typescript
if (!kpiData) {
  return <LoadingSpinner />;
}
```

## Testing Strategy

### Test Case 1: Revenue with Different Statuses
**Steps:**
1. Create bookings with various statuses (pending, confirmed, queued, in_progress, done, cancelled)
2. Filter dashboard by date range that includes these bookings
3. Check totalRevenue and averageBookingValue

**Expected:**
- Revenue includes all non-cancelled bookings
- Cancelled bookings excluded from revenue
- No Rp 0 unless truly no bookings

### Test Case 2: Weekly Trend Consistency
**Steps:**
1. Create 10 bookings with schedule_start in Week 1
2. Check if weekly trend Week 1 shows 10 bookings
3. Verify total bookings also shows 10

**Expected:**
- Weekly trend matches total bookings
- No discrepancy between metrics

### Test Case 3: Large Dataset Performance
**Steps:**
1. Create 1000+ bookings
2. Apply filter and observe rendering time
3. Check browser console for errors

**Expected:**
- Page loads within 3 seconds
- No browser freeze
- No memory leaks

### Test Case 4: Empty State
**Steps:**
1. Filter by date range with no bookings
2. Check all KPI metrics

**Expected:**
- Shows 0 or empty state gracefully
- No errors
- No chart crashes

## Implementation Priority

1. **HIGH**: Fix revenue calculation (Solution 1 Option A)
2. **HIGH**: Fix weekly trend date filtering (Solution 2)
3. **MEDIUM**: Add performance optimization (Solution 3)
4. **LOW**: Add separate confirmed/projected revenue (Future enhancement)

## Related Files to Modify

1. `frontend/src/lib/kpi/calculations.ts` - Main KPI calculation logic
2. `frontend/src/app/admin/dashboard/page.tsx` - Dashboard UI (if needed)
3. `frontend/src/components/dashboard/ChartCard.tsx` - Chart components (if needed)

## Rollback Plan

If issues persist after fixes:
1. Revert to simple calculation without complex filtering
2. Use cached/static data for charts
3. Add manual refresh button
4. Fallback to basic table view instead of charts
