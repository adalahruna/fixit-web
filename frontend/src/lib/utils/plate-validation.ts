/**
 * Validasi plat nomor kendaraan sesuai standar Indonesia
 * 
 * Format yang valid:
 * - Format lama: L 1234 AB (1-2 huruf kode wilayah, 1-4 angka, 1-3 huruf seri)
 * - Format baru: B 1234 ABC (sama tapi bisa 3 huruf seri)
 * - TNI/POLRI: RI 1, POLRI 1234
 * - Diplomatik: CD 1234, CC 1234
 */

export interface PlateValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Kode wilayah plat nomor Indonesia
 * Sumber: https://id.wikipedia.org/wiki/Tanda_nomor_kendaraan_bermotor_Indonesia
 */
const VALID_REGION_CODES = [
  // Sumatera
  'BL', 'BB', 'BN', 'BA', 'BE', 'BG', 'BD', 'BK', 'BM', 'BP', 'BT',
  // Jawa
  'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'Z',
  'AA', 'AB', 'AD', 'AE', 'AG',
  // Bali & Nusa Tenggara
  'DK', 'EA', 'EB', 'ED',
  // Kalimantan
  'DA', 'KB', 'KH', 'KT', 'KU',
  // Sulawesi
  'DB', 'DC', 'DD', 'DE', 'DL', 'DM', 'DN', 'DT', 'DW',
  // Maluku & Papua
  'DE', 'DG', 'PA', 'PB',
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
