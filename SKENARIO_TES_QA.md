# Skenario Tes QA - KPI, SLA, dan Audit

## Daftar Isi
1. [KPI Dashboard Testing](#1-kpi-dashboard-testing)
2. [SLA & Overload Monitoring Testing](#2-sla--overload-monitoring-testing)
3. [Audit Logs Testing](#3-audit-logs-testing)
4. [Integration Testing](#4-integration-testing)
5. [Performance Testing](#5-performance-testing)

---

## 1. KPI Dashboard Testing

### 1.1 Akses dan Tampilan Dashboard

**Tujuan**: Memastikan dashboard KPI dapat diakses dan menampilkan data dengan benar

**Prasyarat**:
- Login sebagai admin/owner
- Minimal ada 5 booking dengan status berbeda
- Minimal ada 2 mekanik aktif

**Langkah Tes**:
1. Login sebagai admin
2. Navigasi ke `/admin/dashboard`
3. Verifikasi semua komponen KPI tampil:
   - Total Bookings
   - Completed Bookings
   - Cancelled Bookings
   - Average Service Time
   - Total Revenue
   - Average Booking Value

**Expected Result**:
- Dashboard loading dalam < 3 detik
- Semua KPI card menampilkan angka yang benar
- Chart/grafik tampil dengan data yang sesuai
- Tidak ada error di console browser

**Test Data**:
```
Booking 1: Status completed, Revenue 150k
Booking 2: Status cancelled, Revenue 0
Booking 3: Status in_progress, Revenue 200k
Booking 4: Status done, Revenue 100k
Booking 5: Status pending, Revenue 0
```

### 1.2 Perhitungan KPI Accuracy

**Tujuan**: Memastikan perhitungan KPI akurat

**Langkah Tes**:
1. Catat jumlah booking manual dari database
2. Hitung manual:
   - Completion rate = (completed bookings / total bookings) × 100
   - Average service time = total service time / completed bookings
   - Total revenue = sum of completed booking prices
3. Bandingkan dengan tampilan dashboard

**Expected Result**:
- Semua perhitungan sesuai dengan kalkulasi manual
- Persentase completion rate benar
- Revenue calculation akurat

### 1.3 Filter dan Date Range

**Tujuan**: Memastikan filter tanggal berfungsi dengan benar

**Langkah Tes**:
1. Pilih date range "Last 7 days"
2. Verifikasi data yang tampil hanya dari 7 hari terakhir
3. Pilih date range "Last 30 days"
4. Verifikasi data yang tampil dari 30 hari terakhir
5. Pilih custom date range

**Expected Result**:
- Data berubah sesuai filter yang dipilih
- Perhitungan KPI update otomatis
- Tidak ada data di luar range yang dipilih

### 1.4 Real-time Update

**Tujuan**: Memastikan dashboard update ketika ada perubahan data

**Langkah Tes**:
1. Buka dashboard di browser tab 1
2. Di tab 2, buat booking baru sebagai customer
3. Kembali ke tab 1, refresh halaman
4. Verifikasi angka KPI berubah

**Expected Result**:
- Total bookings bertambah 1
- KPI lain update sesuai perubahan
- Data konsisten di semua tampilan

---

## 2. SLA & Overload Monitoring Testing

### 2.1 SLA Warning Display

**Tujuan**: Memastikan warning SLA muncul pada kondisi yang tepat

**Prasyarat**:
- Booking dengan jadwal yang sudah lewat tapi belum selesai
- Booking yang mendekati deadline

**Langkah Tes**:
1. Buat booking dengan jadwal kemarin, status masih "confirmed"
2. Navigasi ke `/admin/sla`
3. Verifikasi booking muncul di "Late Bookings"
4. Buat booking dengan jadwal 1 jam lagi
5. Verifikasi muncul di "At Risk Bookings"

**Expected Result**:
- Late bookings tampil dengan indikator merah
- At risk bookings tampil dengan indikator kuning
- Delay time dihitung dengan benar
- Warning message jelas dan informatif

### 2.2 SLA Calculation Accuracy

**Tujuan**: Memastikan perhitungan SLA akurat

**Test Cases**:

**Case 1: On Time Booking**
```
Scheduled: 2024-01-15 10:00
Started: 2024-01-15 10:00
Completed: 2024-01-15 11:30
Expected: On Time (0 minutes delay)
```

**Case 2: Late Start**
```
Scheduled: 2024-01-15 10:00
Started: 2024-01-15 10:30
Completed: 2024-01-15 12:00
Expected: Late (30 minutes delay)
```

**Case 3: Very Late**
```
Scheduled: 2024-01-15 10:00
Started: 2024-01-15 14:00
Completed: 2024-01-15 15:30
Expected: Late (240 minutes delay)
```

**Langkah Tes**:
1. Buat booking sesuai test case
2. Proses booking sesuai timeline
3. Cek perhitungan di SLA dashboard
4. Verifikasi kategori (On Time/At Risk/Late)

### 2.3 Mechanic Overload Detection

**Tujuan**: Memastikan sistem mendeteksi overload mekanik

**Langkah Tes**:
1. Assign 5+ booking ke satu mekanik dalam satu hari
2. Navigasi ke halaman admin booking
3. Verifikasi warning overload muncul
4. Cek detail overload di `/admin/sla`

**Expected Result**:
- Warning overload tampil dengan jelas
- Jumlah booking dan workload dihitung benar
- Rekomendasi redistribusi muncul
- Alert visual (warna merah/orange)

### 2.4 SLA Performance Metrics

**Tujuan**: Memastikan metrik performa SLA akurat

**Langkah Tes**:
1. Buat 10 booking dengan mix status:
   - 6 on time
   - 2 at risk
   - 2 late
2. Cek SLA dashboard
3. Verifikasi perhitungan:
   - On Time Rate = 60%
   - At Risk Rate = 20%
   - Late Rate = 20%

**Expected Result**:
- Persentase dihitung dengan benar
- Chart/grafik menampilkan proporsi yang tepat
- Total booking sesuai

---

## 3. Audit Logs Testing

### 3.1 Audit Log Creation

**Tujuan**: Memastikan semua aktivitas penting tercatat di audit log

**Activities to Test**:

**User Management**:
- User registration
- User login/logout
- Role changes

**Booking Management**:
- Create booking
- Update booking
- Cancel booking
- Reschedule booking

**Mechanic Management**:
- Create mechanic
- Update mechanic
- Assign mechanic
- Unassign mechanic

**Service Management**:
- Start service
- Complete service
- Pause service

**Langkah Tes**:
1. Lakukan setiap aktivitas di atas
2. Navigasi ke `/admin/audit`
3. Verifikasi setiap aktivitas tercatat dengan:
   - Timestamp yang benar
   - User yang melakukan aksi
   - Detail aktivitas
   - Entity yang terkena dampak

**Expected Result**:
- Semua aktivitas tercatat
- Informasi lengkap dan akurat
- Timestamp dalam format yang benar
- Tidak ada aktivitas yang terlewat

### 3.2 Audit Log Filtering

**Tujuan**: Memastikan filter audit log berfungsi dengan benar

**Langkah Tes**:
1. Filter by date range (last 7 days)
2. Filter by user (pilih user tertentu)
3. Filter by action (CREATE, UPDATE, DELETE)
4. Filter by entity (BOOKING, USER, MECHANIC)
5. Kombinasi multiple filters

**Expected Result**:
- Hasil filter sesuai dengan kriteria
- Tidak ada data di luar filter yang tampil
- Filter dapat dikombinasikan
- Performance tetap baik dengan filter

### 3.3 Audit Log Search

**Tujuan**: Memastikan pencarian audit log berfungsi

**Langkah Tes**:
1. Search by booking ID
2. Search by user email
3. Search by mechanic name
4. Search by partial text
5. Search dengan keyword yang tidak ada

**Expected Result**:
- Hasil search relevan dengan keyword
- Search case-insensitive
- Partial match berfungsi
- No results message jelas

### 3.4 Audit Log Export

**Tujuan**: Memastikan export audit log berfungsi (jika ada fitur ini)

**Langkah Tes**:
1. Pilih date range tertentu
2. Apply filter tertentu
3. Klik export/download
4. Verifikasi file yang didownload

**Expected Result**:
- File berhasil didownload
- Format file sesuai (CSV/Excel)
- Data dalam file sesuai dengan filter
- Semua kolom penting ada

---

## 4. Integration Testing

### 4.1 KPI-SLA Integration

**Tujuan**: Memastikan data KPI dan SLA konsisten

**Langkah Tes**:
1. Cek total completed bookings di KPI dashboard
2. Cek total on-time bookings di SLA dashboard
3. Verifikasi angka konsisten
4. Lakukan perubahan status booking
5. Cek update di kedua dashboard

**Expected Result**:
- Data konsisten antara KPI dan SLA
- Update real-time di kedua dashboard
- Tidak ada discrepancy

### 4.2 Audit-Activity Integration

**Tujuan**: Memastikan semua aktivitas yang mempengaruhi KPI/SLA tercatat di audit

**Langkah Tes**:
1. Lakukan aktivitas yang mempengaruhi KPI (complete booking)
2. Cek perubahan di KPI dashboard
3. Cek audit log untuk aktivitas tersebut
4. Verifikasi timestamp dan detail sesuai

**Expected Result**:
- Aktivitas tercatat di audit
- Timestamp sesuai dengan perubahan KPI
- Detail audit lengkap

### 4.3 Cross-Role Data Consistency

**Tujuan**: Memastikan data konsisten di semua role

**Langkah Tes**:
1. Login sebagai admin, cek KPI dashboard
2. Login sebagai owner, cek data yang sama
3. Verifikasi angka sama
4. Lakukan perubahan sebagai admin
5. Cek update di owner dashboard

**Expected Result**:
- Data sama di semua role yang memiliki akses
- Update real-time untuk semua user
- Permission sesuai role

---

## 5. Performance Testing

### 5.1 Dashboard Load Time

**Tujuan**: Memastikan dashboard loading dengan performa baik

**Test Scenarios**:
- Small dataset (< 100 bookings)
- Medium dataset (100-1000 bookings)
- Large dataset (> 1000 bookings)

**Langkah Tes**:
1. Measure page load time
2. Measure time to interactive
3. Check memory usage
4. Monitor network requests

**Expected Result**:
- Load time < 3 seconds untuk small dataset
- Load time < 5 seconds untuk medium dataset
- Load time < 10 seconds untuk large dataset
- Memory usage reasonable

### 5.2 Concurrent User Testing

**Tujuan**: Memastikan sistem stabil dengan multiple user

**Langkah Tes**:
1. Simulasi 5 admin user akses dashboard bersamaan
2. Simulasi aktivitas bersamaan (create booking, update status)
3. Monitor system performance
4. Check data consistency

**Expected Result**:
- Sistem tetap responsive
- Tidak ada data corruption
- Semua user mendapat data yang benar
- Tidak ada error atau crash

### 5.3 Data Volume Testing

**Tujuan**: Memastikan sistem handle data volume besar

**Test Data**:
- 10,000 bookings
- 100 mechanics
- 50 service types
- 6 months audit logs

**Langkah Tes**:
1. Load dashboard dengan data volume besar
2. Test filtering dan searching
3. Test export functionality
4. Monitor database performance

**Expected Result**:
- Dashboard tetap responsive
- Filter dan search tetap cepat
- Export berhasil tanpa timeout
- Database query optimized

---

## 6. Error Handling Testing

### 6.1 Network Error Handling

**Tujuan**: Memastikan sistem handle network error dengan baik

**Langkah Tes**:
1. Disconnect internet saat loading dashboard
2. Reconnect dan refresh
3. Simulate slow network
4. Test dengan network intermittent

**Expected Result**:
- Error message yang jelas
- Retry mechanism berfungsi
- Graceful degradation
- Data tidak corrupt

### 6.2 Database Error Handling

**Tujuan**: Memastikan sistem handle database error

**Langkah Tes**:
1. Simulate database connection error
2. Simulate query timeout
3. Test dengan database overload

**Expected Result**:
- User-friendly error message
- System tidak crash
- Fallback mechanism berfungsi
- Error logging berfungsi

---

## 7. Security Testing

### 7.1 Access Control Testing

**Tujuan**: Memastikan hanya user yang berwenang dapat akses fitur

**Langkah Tes**:
1. Login sebagai customer, coba akses `/admin/dashboard`
2. Login sebagai mechanic, coba akses audit logs
3. Test direct URL access tanpa login
4. Test dengan expired session

**Expected Result**:
- Unauthorized access ditolak
- Redirect ke login page
- Proper error message
- Session handling benar

### 7.2 Data Privacy Testing

**Tujuan**: Memastikan data sensitif terlindungi

**Langkah Tes**:
1. Cek audit logs tidak expose password
2. Verifikasi PII data di-mask dengan benar
3. Test export tidak include sensitive data
4. Check browser developer tools

**Expected Result**:
- Sensitive data tidak terexpose
- Proper data masking
- Audit logs aman
- No sensitive data di client-side

---

## Checklist Testing

### Pre-Testing Setup
- [ ] Database seeded dengan test data
- [ ] All user roles created (admin, owner, mechanic, customer)
- [ ] Test environment setup
- [ ] Browser developer tools ready

### KPI Dashboard
- [ ] Dashboard accessibility
- [ ] KPI calculation accuracy
- [ ] Date range filtering
- [ ] Real-time updates
- [ ] Chart/graph display
- [ ] Performance testing

### SLA & Overload
- [ ] SLA warning display
- [ ] SLA calculation accuracy
- [ ] Overload detection
- [ ] Performance metrics
- [ ] Alert notifications

### Audit Logs
- [ ] Log creation for all activities
- [ ] Filtering functionality
- [ ] Search functionality
- [ ] Export functionality (if available)
- [ ] Data retention

### Integration
- [ ] KPI-SLA data consistency
- [ ] Audit-activity integration
- [ ] Cross-role consistency
- [ ] Real-time synchronization

### Performance
- [ ] Load time testing
- [ ] Concurrent user testing
- [ ] Data volume testing
- [ ] Memory usage monitoring

### Security
- [ ] Access control
- [ ] Data privacy
- [ ] Session management
- [ ] Input validation

---

## Bug Report Template

Ketika menemukan bug, gunakan template berikut:

```
**Bug ID**: BUG-YYYY-MM-DD-XXX
**Severity**: Critical/High/Medium/Low
**Priority**: P1/P2/P3/P4

**Summary**: [Brief description]

**Environment**:
- Browser: [Chrome/Firefox/Safari version]
- OS: [Windows/Mac/Linux]
- User Role: [admin/owner/mechanic/customer]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Videos**:
[Attach if applicable]

**Additional Notes**:
[Any other relevant information]
```

---

## Test Data Requirements

### Minimum Test Data:
- 20 bookings dengan berbagai status
- 5 mechanics (3 aktif, 2 nonaktif)
- 10 service types
- 50 audit log entries
- 3 user untuk setiap role

### Recommended Test Data:
- 100+ bookings spanning 3 months
- 10+ mechanics
- 20+ service types
- 500+ audit log entries
- Multiple users per role

Dokumen ini harus diupdate seiring dengan penambahan fitur baru atau perubahan pada sistem.