# Daftar Kode Wilayah Plat Nomor Indonesia

## Format Plat Nomor

### Format Standar
```
[KODE WILAYAH] [NOMOR] [SERI]
```

**Contoh:**
- `L 1234 AB` - Surabaya
- `B 5678 XYZ` - Jakarta (format baru 3 huruf)
- `D 999 CD` - Bandung
- `AB 100 A` - Yogyakarta

### Format Khusus

**TNI/POLRI:**
- `RI 1` sampai `RI 9999`
- `POLRI 1` sampai `POLRI 9999`

**Diplomatik:**
- `CD 1234` - Corps Diplomatique
- `CC 1234` - Consular Corps

---

## Daftar Lengkap Kode Wilayah

### 🏝️ Sumatera

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **BL** | Banda Aceh | Aceh |
| **BB** | Medan | Sumatera Utara |
| **BK** | Wilayah lain | Sumatera Utara |
| **BA** | Padang | Sumatera Barat |
| **BM** | Pekanbaru | Riau |
| **BP** | Batam, Tanjung Pinang | Kepulauan Riau |
| **BN** | Pangkal Pinang | Bangka Belitung |
| **BE** | Bandar Lampung | Lampung |
| **BG** | Palembang | Sumatera Selatan |
| **BD** | Bengkulu | Bengkulu |
| **BT** | Jambi | Jambi |

---

### 🏙️ DKI Jakarta

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **B** | Jakarta | DKI Jakarta |

---

### 🏔️ Jawa Barat

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **D** | Bandung | Jawa Barat |
| **E** | Cirebon | Jawa Barat |
| **F** | Bogor | Jawa Barat |
| **T** | Purwakarta | Jawa Barat |
| **Z** | Garut | Jawa Barat |

---

### 🏛️ Jawa Tengah

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **G** | Pekalongan, Brebes, Tegal, Pemalang | Jawa Tengah |
| **H** | Semarang | Jawa Tengah |
| **K** | Pati | Jawa Tengah |
| **R** | Banyumas | Jawa Tengah |
| **AA** | Kedu (Magelang, Temanggung, Purworejo) | Jawa Tengah |
| **AD** | Surakarta (Solo) | Jawa Tengah |

---

### 🕌 DI Yogyakarta

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **AB** | Yogyakarta | DI Yogyakarta |

---

### 🌊 Jawa Timur

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **L** | Surabaya | Jawa Timur |
| **M** | Madura | Jawa Timur |
| **N** | Malang | Jawa Timur |
| **P** | Besuki | Jawa Timur |
| **S** | Bojonegoro, Tuban | Jawa Timur |
| **W** | Gresik, Sidoarjo | Jawa Timur |
| **AE** | Madiun | Jawa Timur |
| **AG** | Kediri | Jawa Timur |

---

### 🏖️ Banten

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **A** | Serang, Tangerang, Cilegon | Banten |

---

### 🏝️ Bali

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **DK** | Denpasar | Bali |

---

### 🌴 Nusa Tenggara

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **EA** | Lombok | Nusa Tenggara Barat |
| **EB** | Sumbawa | Nusa Tenggara Barat |
| **ED** | Flores | Nusa Tenggara Timur |
| **DH** | Timor | Nusa Tenggara Timur |

---

### 🌳 Kalimantan

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **KB** | Pontianak | Kalimantan Barat |
| **KH** | Palangkaraya | Kalimantan Tengah |
| **DA** | Banjarmasin | Kalimantan Selatan |
| **KT** | Samarinda, Balikpapan | Kalimantan Timur |
| **KU** | Tarakan | Kalimantan Utara |

---

### 🏝️ Sulawesi

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **DB** | Manado | Sulawesi Utara |
| **DL** | Gorontalo | Gorontalo (dulu Sulawesi Utara) |
| **DN** | Palu | Sulawesi Tengah |
| **DD** | Makassar | Sulawesi Selatan |
| **DC** | Mamuju | Sulawesi Barat |
| **DT** | Kendari | Sulawesi Tenggara |

---

### 🏝️ Maluku

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **DE** | Ambon | Maluku |
| **DG** | Ternate | Maluku Utara |

---

### 🏔️ Papua

| Kode | Wilayah | Provinsi |
|------|---------|----------|
| **PA** | Jayapura | Papua |
| **PB** | Manokwari | Papua Barat |

---

## Validasi di Sistem

File: `src/lib/utils/plate-validation.ts`

Sistem akan otomatis:
1. ✅ Validasi format plat nomor
2. ✅ Cek kode wilayah valid atau tidak
3. ✅ Format otomatis dengan spasi yang benar
4. ✅ Support format TNI/POLRI dan Diplomatik

### Contoh Penggunaan

```typescript
import { validateIndonesianPlate } from '@/lib/utils/plate-validation';

// Valid
validateIndonesianPlate('L1234AB')    // ✅ "L 1234 AB"
validateIndonesianPlate('B 5678 XYZ') // ✅ "B 5678 XYZ"
validateIndonesianPlate('AB100A')     // ✅ "AB 100 A"
validateIndonesianPlate('RI 1')       // ✅ "RI 1"
validateIndonesianPlate('CD 1234')    // ✅ "CD 1234"

// Invalid
validateIndonesianPlate('XX 1234 AB') // ❌ Kode wilayah tidak valid
validateIndonesianPlate('L AB')       // ❌ Format tidak valid
validateIndonesianPlate('L 12345 AB') // ❌ Nomor terlalu panjang (max 4 digit)
```

---

## Format Rules

### Kode Wilayah
- **1 huruf:** A, B, D, E, F, G, H, K, L, M, N, P, R, S, T, W, Z
- **2 huruf:** AA, AB, AD, AE, AG, BA, BB, BD, BE, BG, BK, BL, BM, BN, BP, BT, DA, DB, DC, DD, DE, DG, DH, DK, DL, DN, DT, EA, EB, ED, KB, KH, KT, KU, PA, PB

### Nomor
- **Range:** 1 - 9999
- **Digit:** 1-4 digit

### Seri
- **Huruf:** A-Z
- **Panjang:** 1-3 huruf
- **Contoh:** A, AB, ABC, XYZ

---

## Testing

### Test Cases di Form Booking

**Valid Plates:**
```
✅ L 1234 AB     - Surabaya (standard)
✅ B 5678 XYZ    - Jakarta (3 letters)
✅ D999CD        - Bandung (no spaces, akan di-format)
✅ AB 100 A      - Yogyakarta (single letter)
✅ RI 1          - TNI
✅ POLRI 1234    - POLRI
✅ CD 1234       - Diplomatic
```

**Invalid Plates:**
```
❌ XX 1234 AB    - Invalid region code
❌ L 12345 AB    - Number too long
❌ L 1234 ABCD   - Series too long
❌ 1234 AB       - Missing region code
❌ L AB          - Missing number
```

---

## Sources

- Wikipedia: [Tanda Nomor Kendaraan Bermotor Indonesia](https://id.wikipedia.org/wiki/Tanda_nomor_kendaraan_bermotor_Indonesia)
- Peraturan Kapolri tentang Registrasi dan Identifikasi Kendaraan Bermotor

---

## Notes

### Format Auto-Correction
Sistem akan otomatis menambahkan spasi yang benar:
- Input: `L1234AB`
- Output: `L 1234 AB`

### Case Insensitive
Sistem menerima huruf kecil dan akan otomatis convert ke huruf besar:
- Input: `l 1234 ab`
- Output: `L 1234 AB`

### Whitespace Handling
Sistem akan normalize semua whitespace:
- Input: `L    1234    AB`
- Output: `L 1234 AB`

---

## Updates

**2024-06-03:**
- ✅ Add complete list of Indonesian region codes
- ✅ Update validation logic
- ✅ Add detailed documentation
- ✅ Include all provinces including new ones (Kalimantan Utara, Papua Barat, etc.)
