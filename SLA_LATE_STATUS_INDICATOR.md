# SLA Late Status Indicator - Implementation Summary

## Overview
Implementasi indikator visual untuk menampilkan status keterlambatan pengerjaan servis motor berdasarkan SLA (Service Level Agreement) di halaman Admin Kelola Booking.

## Features Implemented

### 1. **SLA Status Calculation**
- Menghitung estimasi durasi dari booking services
- Membandingkan waktu aktual dengan estimasi waktu
- SLA tolerance: **30 menit** dari estimasi
- Real-time tracking untuk booking yang sedang dikerjakan

### 2. **Visual Indicators**

#### Status Colors & Badges
| Status | Warna | Icon | Kondisi | Deskripsi |
|--------|-------|------|---------|-----------|
| **Late** | 🔴 Merah | ⚠️ | Terlambat > 30 menit | Melebihi batas toleransi SLA |
| **At Risk** | 🟡 Kuning | ⏰ | Sisa waktu ≤ 15 menit | Hampir melewati estimasi |
| **On Time** | - | - | Normal | Tidak ditampilkan badge |

#### New Table Column: "SLA Status"
Menampilkan status keterlambatan untuk setiap booking dengan:
- Badge dengan warna sesuai kondisi
- Jumlah menit keterlambatan (untuk status late)
- Warning icon untuk prioritas tinggi

#### Row Highlighting
- Background merah muda (red-50/30) untuk booking yang terlambat
- Memudahkan identifikasi visual cepat

### 3. **Warning Banner**
Alert banner di atas tabel ketika ada booking yang late:
- ⚠️ Peringatan dengan background merah/orange gradient
- Menampilkan jumlah booking yang terlambat
- Rekomendasi untuk koordinasi dengan mekanik
- Tujuan: Mengantisipasi komplain customer

### 4. **Calculation Logic**

#### For "in_progress" Bookings:
```typescript
elapsedMinutes = now - start_time
remainingMinutes = estimatedDuration - elapsedMinutes

isAtRisk = remainingMinutes <= 15 && remainingMinutes > 0
if (elapsedMinutes > estimatedDuration) {
  delayMinutes = elapsedMinutes - estimatedDuration
  isLate = delayMinutes > 30
}
```

#### For "done" Bookings:
```typescript
delayMinutes = actualEnd - estimatedEnd
isLate = delayMinutes > 30 // 30 minutes tolerance
```

## Technical Details

### Files Modified
- `frontend/src/app/admin/bookings/page.tsx`
  - Added `calculateSLAStatusFromBooking()` helper function
  - Added service_progress to query selection
  - Added default_duration_minutes to booking_services query
  - Added `getSLAStatusBadge()` function
  - Added SLA Status column to table
  - Added late booking count calculation
  - Added warning banner for late bookings
  - Added row highlighting for late bookings

### Data Structure
```typescript
interface SLAStatus {
  isLate: boolean;        // true if delay > 30 minutes
  isAtRisk: boolean;      // true if remaining <= 15 minutes
  delayMinutes: number;   // actual delay in minutes
}
```

### Query Enhancement
Added fields to booking query:
```typescript
booking_services (
  service_type:service_types (
    name,
    default_duration_minutes  // NEW!
  )
),
service_progress (           // NEW!
  start_time,
  end_time,
  status
)
```

### Logic Flow
1. Fetch bookings with service_progress data
2. For each booking in table:
   - Skip if status is not 'in_progress' or 'done'
   - Calculate estimated duration from booking_services
   - Compare with actual elapsed/end time
   - Determine if late (> 30 min tolerance) or at risk (<= 15 min remaining)
   - Render appropriate badge
3. Count late bookings for warning banner
4. Show warning banner if `lateBookings > 0`

## Visual Design

### Color Scheme
- **Red (Late)**: `bg-red-100`, `text-red-800`, border `border-red-300`
- **Yellow (At Risk)**: `bg-yellow-100`, `text-yellow-800`, border `border-yellow-300`
- **Row Highlight**: `bg-red-50/30` untuk booking yang terlambat

### Components
- Rounded badges (`rounded-full`)
- Border styling for emphasis
- Warning icons (⚠️, ⏰, 🔴)
- Gradient warning banner
- Responsive layout

## User Experience

### Admin/CS Workflow
1. Login sebagai Admin atau Owner
2. Buka halaman "Kelola Booking" (`/admin/bookings`)
3. Lihat warning banner di atas jika ada booking terlambat
4. Scan kolom "SLA Status" untuk identifikasi cepat
5. Booking dengan status late akan memiliki:
   - Background row merah muda
   - Badge merah dengan menit keterlambatan
   - Icon warning ⚠️
6. Ambil tindakan:
   - Koordinasi dengan mekanik
   - Hubungi customer untuk update
   - Antisipasi komplain

### Visual Feedback Priority
1. **Warning Banner** (paling atas) - Alert sistem
2. **Row Background** - Highlight visual
3. **SLA Status Badge** - Detail status
4. **Icon** - Quick recognition

## Testing Scenarios

### Test Case 1: Booking In Progress - On Time
- **Given**: Booking sedang dikerjakan, waktu < estimasi - 15 menit
- **Expected**: Tidak ada badge SLA status (-)

### Test Case 2: Booking In Progress - At Risk
- **Given**: Booking sedang dikerjakan, sisa waktu ≤ 15 menit
- **Expected**: 
  - Badge kuning "⏰ Risiko keterlambatan"
  - Tidak ada warning banner
  - Tidak ada row highlight

### Test Case 3: Booking In Progress - Late
- **Given**: Booking sedang dikerjakan, elapsed > estimasi + 30 menit
- **Expected**: 
  - Badge merah "⚠️ Terlambat X menit"
  - Warning banner muncul
  - Row background merah muda

### Test Case 4: Booking Done - On Time
- **Given**: Booking selesai, actualEnd ≤ estimatedEnd + 30 menit
- **Expected**: Tidak ada badge SLA status (-)

### Test Case 5: Booking Done - Late
- **Given**: Booking selesai, actualEnd > estimatedEnd + 30 menit
- **Expected**: 
  - Badge merah "⚠️ Terlambat X menit"
  - Warning banner muncul
  - Row background merah muda

### Test Case 6: Other Status (pending, confirmed, queued)
- **Given**: Booking dengan status selain in_progress atau done
- **Expected**: Tidak ada badge SLA status (-)

### Test Case 7: No service_progress Data
- **Given**: Booking in_progress tanpa service_progress record
- **Expected**: Tidak ada badge, tidak crash

## SLA Tolerance Configuration

### Current Settings
- **Default estimated duration**: 60 minutes (jika tidak ada service type)
- **SLA tolerance**: 30 minutes
- **At-risk threshold**: 15 minutes remaining
- **Time calculation**: 24/7 basis (includes all hours)

### Customization Points
```typescript
// In calculateSLAStatusFromBooking()
const SLA_TOLERANCE_MINUTES = 30;  // Can be made configurable
const AT_RISK_THRESHOLD_MINUTES = 15;  // Can be made configurable
```

## Business Impact

### Benefits
1. **Proactive Customer Service**: Identifikasi masalah sebelum customer complain
2. **Quality Control**: Monitor performa mekanik real-time
3. **SLA Compliance**: Track dan improve service delivery time
4. **Operational Efficiency**: Quick visual cues untuk prioritas tindakan

### Metrics to Monitor
- Jumlah booking terlambat per hari
- Average delay minutes
- Percentage of bookings meeting SLA
- At-risk booking conversion rate (do they become late?)

## Future Enhancements

### Possible Improvements
1. **Configurable SLA tolerance** via admin settings
2. **SMS/Email alerts** ketika booking at-risk atau late
3. **SLA dashboard** dengan historical trends
4. **Mechanic performance** berdasarkan SLA compliance
5. **Customer notification** otomatis untuk keterlambatan
6. **Estimated completion time** display untuk customer
7. **Root cause tracking** untuk keterlambatan
8. **Predictive alerts** menggunakan machine learning

## Related Files
- `frontend/src/lib/utils/sla-calculation.ts` - Core SLA logic (async version)
- `frontend/src/app/admin/sla/page.tsx` - Full SLA report page
- `database/migrations/007_atomic_status_functions.sql` - Database functions

## Integration Points
- Works with existing `service_progress` table
- Uses `booking_services` for duration estimation
- Compatible with realtime updates (`RealtimeBookingList`)
- Filters work correctly with SLA status

## Documentation
- Tolerance: 30 minutes from estimated completion
- At-risk: 15 minutes or less remaining
- Calculation: Actual time vs estimated time (24-hour basis)
- Default duration: 60 minutes if no service types specified

## Commit Message Template
```
feat: Add SLA late status indicator to admin booking monitor

- Add SLA status column in bookings table
- Show color-coded status badges (red/yellow)
- Display delay minutes for late bookings
- Add warning banner for late bookings
- Highlight late booking rows with red background
- Calculate SLA status from service progress
- Track at-risk bookings (≤15 min remaining)

Implements visual warning system for SLA compliance monitoring
with 30-minute tolerance threshold to anticipate customer complaints
and enable proactive coordination with mechanics.
```
