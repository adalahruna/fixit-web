// Timezone utilities for Indonesia (WIB = UTC+7)

/**
 * Convert local date/time string to UTC ISO string for database storage
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns ISO string in UTC
 */
export function localToUTC(dateStr: string, timeStr: string): string {
  // User inputs time in WIB (UTC+7)
  // We need to convert to UTC by subtracting 7 hours
  // Example: User inputs 08:00 WIB → should be stored as 01:00 UTC
  
  // Parse as if it's in WIB timezone
  // Create date object and manually adjust for WIB offset
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  // Create UTC date by subtracting WIB offset (7 hours)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
  
  return utcDate.toISOString();
}

/**
 * Format UTC date to Indonesia locale string
 * @param utcDate - UTC date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in WIB timezone
 */
export function formatToWIB(
  utcDate: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    ...options,
  });
}

/**
 * Format date only (no time)
 */
export function formatDateWIB(utcDate: string | Date): string {
  return formatToWIB(utcDate, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time only (no date)
 */
export function formatTimeWIB(utcDate: string | Date): string {
  return formatToWIB(utcDate, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time
 */
export function formatDateTimeWIB(utcDate: string | Date): string {
  return formatToWIB(utcDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
