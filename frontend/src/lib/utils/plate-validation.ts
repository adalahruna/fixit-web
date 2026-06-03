/**
 * Validasi plat nomor kendaraan sesuai standar Indonesia
 * 
 * Format yang valid:
 * - Format standar: L 1234 AB (1-2 huruf kode wilayah, 1-4 angka, 1-3 huruf seri)
 * - Format baru: B 1234 ABC (sama tapi bisa 3 huruf seri)
 * - TNI/POLRI: RI 1, POLRI 1234
 * - Diplomatik: CD 1234, CC 1234
 * 
 * Contoh kode wilayah yang valid:
 * - Jakarta: B
 * - Surabaya: L
 * - Bandung: D
 * - Semarang: H
 * - Yogyakarta: AB
 * - Bali: DK
 * - Dan semua kode wilayah Indonesia lainnya
 * 
 * @see https://id.wikipedia.org/wiki/Tanda_nomor_kendaraan_bermotor_Indonesia
 */

export interface PlateValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Kode wilayah plat nomor Indonesia (Lengkap - 2024)
 * Sumber: https://id.wikipedia.org/wiki/Tanda_nomor_kendaraan_bermotor_Indonesia
 */
const VALID_REGION_CODES = [
  // Sumatera
  'BL', // Aceh
  'BB', // Sumatera Utara (Medan)
  'BK', // Sumatera Utara (bagian lain)
  'BA', // Sumatera Barat
  'BM', // Riau
  'BP', // Kepulauan Riau
  'BN', // Bangka Belitung
  'BE', // Lampung
  'BG', // Sumatera Selatan (Palembang)
  'BD', // Bengkulu
  'BT', // Jambi
  
  // DKI Jakarta
  'B',  // Jakarta
  
  // Jawa Barat
  'D',  // Bandung
  'E',  // Cirebon
  'F',  // Bogor
  'T',  // Purwakarta
  'Z',  // Garut
  
  // Jawa Tengah
  'G',  // Pekalongan, Brebes, Tegal, Pemalang
  'H',  // Semarang
  'K',  // Pati
  'R',  // Banyumas
  'AA', // Kedu (Magelang, Temanggung, Purworejo)
  'AD', // Surakarta (Solo)
  
  // DI Yogyakarta
  'AB', // Yogyakarta
  
  // Jawa Timur
  'L',  // Surabaya
  'M',  // Madura
  'N',  // Malang
  'P',  // Besuki
  'S',  // Bojonegoro, Tuban
  'W',  // Gresik, Sidoarjo
  'AE', // Madiun
  'AG', // Kediri
  
  // Banten
  'A',  // Banten
  
  // Bali
  'DK', // Bali
  
  // Nusa Tenggara
  'EA', // NTB (Lombok)
  'EB', // NTB (Sumbawa)
  'ED', // NTT (Flores)
  'DH', // NTT (Timor)
  
  // Kalimantan Barat
  'KB', // Kalimantan Barat
  
  // Kalimantan Tengah
  'KH', // Kalimantan Tengah
  
  // Kalimantan Selatan
  'DA', // Kalimantan Selatan
  
  // Kalimantan Timur
  'KT', // Kalimantan Timur
  
  // Kalimantan Utara
  'KU', // Kalimantan Utara
  
  // Sulawesi Utara
  'DB', // Sulawesi Utara (Manado)
  'DL', // Sulawesi Utara (Gorontalo)
  
  // Sulawesi Tengah
  'DN', // Sulawesi Tengah
  
  // Sulawesi Selatan
  'DD', // Sulawesi Selatan (Makassar)
  'DC', // Sulawesi Barat
  
  // Sulawesi Tenggara
  'DT', // Sulawesi Tenggara
  
  // Maluku
  'DE', // Maluku
  'DG', // Maluku Utara
  
  // Papua
  'PA', // Papua
  'PB', // Papua Barat
];

/**
 * Validasi format plat nomor Indonesia
 */
export function validateIndonesianPlate(plate: string): PlateValidationResult {
  if (!plate || typeof plate !== 'string') {
    return {
      isValid: false,
      error: 'Plat nomor wajib diisi',
    };
  }

  // Normalize: uppercase dan trim
  const normalized = plate.trim().toUpperCase();

  // Check panjang minimum
  if (normalized.length < 5) {
    return {
      isValid: false,
      error: 'Plat nomor terlalu pendek',
    };
  }

  // Format khusus: TNI/POLRI
  if (normalized.startsWith('RI ') || normalized.startsWith('POLRI ')) {
    const match = normalized.match(/^(RI|POLRI)\s+(\d{1,4})$/);
    if (match) {
      return {
        isValid: true,
        formatted: `${match[1]} ${match[2]}`,
      };
    }
    return {
      isValid: false,
      error: 'Format plat TNI/POLRI tidak valid (contoh: RI 1, POLRI 1234)',
    };
  }

  // Format khusus: Diplomatik
  if (normalized.startsWith('CD ') || normalized.startsWith('CC ')) {
    const match = normalized.match(/^(CD|CC)\s+(\d{1,4})$/);
    if (match) {
      return {
        isValid: true,
        formatted: `${match[1]} ${match[2]}`,
      };
    }
    return {
      isValid: false,
      error: 'Format plat diplomatik tidak valid (contoh: CD 1234)',
    };
  }

  // Format standar: [KODE WILAYAH] [ANGKA] [SERI]
  // Contoh: L 1234 AB, B 1234 ABC, AA 1234 AB
  const standardMatch = normalized.match(/^([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})$/);
  
  if (!standardMatch) {
    return {
      isValid: false,
      error: 'Format plat nomor tidak valid. Contoh yang benar: L 1234 AB, B 1234 ABC',
    };
  }

  const [, regionCode, numbers, series] = standardMatch;

  // Validasi kode wilayah
  if (!VALID_REGION_CODES.includes(regionCode)) {
    return {
      isValid: false,
      error: `Kode wilayah "${regionCode}" tidak valid. Contoh kode valid: L, B, D, AA, BB, dll.`,
    };
  }

  // Validasi angka (1-4 digit)
  const num = parseInt(numbers, 10);
  if (num < 1 || num > 9999) {
    return {
      isValid: false,
      error: 'Nomor plat harus antara 1-9999',
    };
  }

  // Validasi seri (1-3 huruf)
  if (series.length < 1 || series.length > 3) {
    return {
      isValid: false,
      error: 'Seri plat harus 1-3 huruf',
    };
  }

  // Format dengan spasi yang benar
  const formatted = `${regionCode} ${numbers} ${series}`;

  return {
    isValid: true,
    formatted,
  };
}

/**
 * Format plat nomor dengan spasi yang benar
 */
export function formatPlateNumber(plate: string): string {
  const result = validateIndonesianPlate(plate);
  return result.formatted || plate;
}
