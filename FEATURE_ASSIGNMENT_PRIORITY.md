# Feature: Assignment Priority & Unassigned Booking Filter

## Overview
Fitur ini membantu admin memprioritaskan assignment mekanik dengan menampilkan visual indicator untuk booking yang belum di-assign, serta filter khusus untuk melihat booking yang perlu segera di-assign.

## Problem Statement
**Masalah:**
- Admin tidak tahu booking mana yang perlu segera di-assign
- Tidak ada indikator visual untuk booking yang sudah lama menunggu
- Keterlambatan assignment bisa menyebabkan SLA terlampaui

**Solusi:**
- Filter "Belum Di-assign" untuk fokus pada booking yang perlu action
- Priority badges dengan warna berbeda berdasarkan waktu tunggu
- Sorting otomatis: booking paling lama di atas (highest priority first)

## Features Implemented

### 1. Filter "Belum Di-assign"
**Location:** Admin Bookings Page → Filter dropdown

**Behavior:**
- Filter khusus untuk menampilkan hanya booking dengan status `pending` yang belum punya assignment
- Otomatis sort by `created_at` ascending (booking paling lama di atas)
- Label: "🔴 Belum Di-assign"

**Use Case:**
Admin bisa langsung lihat semua booking yang perlu di-assign tanpa distraksi dari booking lain.

### 2. Priority Badges
**Location:** Admin Bookings Page → Kolom "Prioritas"

**Priority Levels:**

| Wait Time | Badge Color | Icon | Label | Priority |
|-----------|-------------|------|-------|----------|
| >30 menit | Red | 🔴 | "🔴 X menit" | High |
| >15 menit | Yellow | ⚠️ | "⚠️ X menit" | Medium |
| 0-15 menit | Blue | - | "X menit" | Low |
| Assigned | - | - | "-" | None |

**Calculation:**
```typescript
waitMinutes = (NOW - booking.created_at) / 60
```

**Visual Examples:**
- `🔴 45 menit` - URGENT! Sudah 45 menit belum di-assign
- `⚠️ 20 menit` - Warning, sudah 20 menit
- `12 menit` - Baru 12 menit, masih aman

### 3. Priority Column
**Location:** Admin Bookings Page → Tabel kolom pertama

**Purpose:**
- Memberikan visibility langsung untuk booking yang perlu prioritas
- Admin bisa scan dengan cepat mana yang urgent

### 4. Auto-Sorting for Unassigned
**Behavior:**
Saat filter "Belum Di-assign" aktif:
- Booking di-sort berdasarkan `created_at` ascending
- Booking paling lama muncul di atas (highest priority)
- Memudahkan admin untuk assign booking paling urgent dulu

## User Flow

### Scenario 1: Admin Check Unassigned Bookings
1. Admin buka halaman "Kelola Booking"
2. Pilih filter "🔴 Belum Di-assign"
3. Sistem tampilkan hanya booking yang belum di-assign
4. Booking paling lama muncul di atas dengan badge merah
5. Admin assign mekanik ke booking tersebut

### Scenario 2: Admin Monitor All Bookings
1. Admin buka halaman "Kelola Booking" (tanpa filter)
2. Lihat kolom "Prioritas" untuk semua booking
3. Booking dengan badge merah/kuning perlu perhatian
4. Admin bisa langsung klik "Detail" untuk assign

## Technical Implementation

### Files Modified

#### 1. `frontend/src/components/bookings/BookingFilters.tsx`
**Changes:**
- Added "unassigned" option to status filter
- Label: "🔴 Belum Di-assign"

```typescript
{ value: 'unassigned', label: '🔴 Belum Di-assign' }
```

#### 2. `frontend/src/app/admin/bookings/page.tsx`
**Changes:**
- Added special handling for "unassigned" filter
- Added `getWaitTimeMinutes()` helper function
- Added `getPriorityBadge()` helper function
- Added "Prioritas" column to table
- Added auto-sorting for unassigned bookings

**Key Functions:**

```typescript
// Calculate wait time in minutes
const getWaitTimeMinutes = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
};

// Get priority badge based on wait time
const getPriorityBadge = (booking) => {
  if (hasAssignment || booking.status !== 'pending') return null;
  
  const waitMinutes = getWaitTimeMinutes(booking.created_at);
  
  if (waitMinutes > 30) {
    return { color: 'bg-red-100 text-red-800', label: `🔴 ${waitMinutes} menit`, priority: 'high' };
  } else if (waitMinutes > 15) {
    return { color: 'bg-yellow-100 text-yellow-800', label: `⚠️ ${waitMinutes} menit`, priority: 'medium' };
  }
  // ... etc
};
```

**Filter Logic:**
```typescript
// Filter unassigned bookings
if (params.status === 'unassigned') {
  filteredBookings = filteredBookings.filter((booking) => {
    const hasAssignment = /* check if has assignment */;
    return !hasAssignment && booking.status === 'pending';
  });
  
  // Sort by created_at (oldest first)
  filteredBookings.sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
```

## Priority Thresholds

### Current Settings
- **High Priority (Red):** >30 minutes
- **Medium Priority (Yellow):** >15 minutes
- **Low Priority (Blue):** 0-15 minutes

### Rationale
- **30 minutes:** Cukup waktu untuk admin review booking dan assign mekanik
- **15 minutes:** Warning awal agar admin aware
- **0-15 minutes:** Masih dalam batas wajar

### Customization
Threshold bisa disesuaikan di `getPriorityBadge()` function:

```typescript
if (waitMinutes > 30) {  // Change this value
  return { /* high priority */ };
} else if (waitMinutes > 15) {  // Change this value
  return { /* medium priority */ };
}
```

## Impact on SLA

### Assignment Delay Impact
**Scenario:**
- Customer booking jam 10:00
- Admin assign jam 10:45 (delay 45 menit)
- Mekanik mulai kerja jam 11:00
- Servis selesai jam 12:00

**Total Time:** 2 jam (dari booking sampai selesai)

**SLA Calculation:**
SLA dihitung dari `booking.created_at` sampai `service_progress.end_time`, jadi **assignment delay masuk dalam SLA**.

### Best Practice
- Assign mekanik dalam **15 menit** setelah booking dibuat
- Prioritaskan booking dengan badge merah (>30 menit)
- Monitor kolom "Prioritas" secara berkala

## Future Enhancements

### Phase 2 (Optional)
1. **Assignment SLA Tracking**
   - Tambah kolom `assigned_at` di tabel `assignments`
   - Track waktu dari `booking.created_at` sampai `assigned_at`
   - Masukkan ke KPI dashboard

2. **Auto-Assignment Suggestions**
   - Sistem suggest mekanik yang paling available
   - Berdasarkan workload dan skill

3. **Push Notifications**
   - Notifikasi ke admin jika booking >30 menit belum di-assign
   - Email/SMS alert untuk urgent bookings

4. **Assignment Performance Report**
   - Average assignment time per admin
   - Peak hours untuk unassigned bookings
   - Trend analysis

## Testing Checklist

- [x] Filter "Belum Di-assign" menampilkan hanya booking pending tanpa assignment
- [x] Priority badges muncul dengan warna yang benar
- [x] Sorting otomatis untuk unassigned bookings (oldest first)
- [x] Kolom "Prioritas" tampil di tabel
- [x] Badge merah untuk >30 menit
- [x] Badge kuning untuk >15 menit
- [x] Badge biru untuk 0-15 menit
- [x] No badge untuk booking yang sudah assigned
- [x] Filter bisa di-reset
- [x] Kombinasi dengan filter lain (date, search, mechanic)

## Usage Examples

### Example 1: Morning Shift Start
```
Admin login jam 08:00
→ Pilih filter "🔴 Belum Di-assign"
→ Lihat 3 booking dengan badge merah (created jam 07:00-07:30)
→ Assign semua booking urgent dulu
→ Lanjut ke booking dengan badge kuning
```

### Example 2: Monitoring Throughout Day
```
Admin check setiap 30 menit
→ Scan kolom "Prioritas" untuk badge merah
→ Jika ada badge merah, langsung assign
→ Jika tidak ada, lanjut kerja lain
```

## Notes
- Priority badges hanya muncul untuk booking dengan status `pending` yang belum di-assign
- Waktu tunggu dihitung real-time (bukan cached)
- Sorting hanya aktif saat filter "Belum Di-assign" dipilih
- Filter ini tidak mengubah database, hanya filtering di client-side

## Related Files
- `frontend/src/components/bookings/BookingFilters.tsx` - Filter component
- `frontend/src/app/admin/bookings/page.tsx` - Admin bookings list page
- `frontend/src/lib/utils/datetime.ts` - Date/time utilities (existing)
