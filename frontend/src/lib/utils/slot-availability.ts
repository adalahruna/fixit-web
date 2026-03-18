import { createClient } from '../supabase/server';

/**
 * Check if a time slot is available for booking
 * @param scheduleStart - ISO string of booking start time
 * @param estimatedDurationMinutes - Estimated duration in minutes
 * @returns Object with available status and message
 */
export async function checkSlotAvailability(
  scheduleStart: string,
  estimatedDurationMinutes: number
): Promise<{ available: boolean; message?: string; availableSlots?: number }> {
  const supabase = await createClient();

  // Get active mechanics count
  const { data: mechanics, error: mechanicsError } = await supabase
    .from('mechanics')
    .select('id')
    .eq('is_active', true);

  if (mechanicsError || !mechanics || mechanics.length === 0) {
    return {
      available: false,
      message: 'Tidak ada mekanik yang tersedia saat ini',
    };
  }

  const totalMechanics = mechanics.length;

  // Calculate slot end time
  const slotStart = new Date(scheduleStart);
  const slotEnd = new Date(slotStart.getTime() + estimatedDurationMinutes * 60000);

  // Get bookings that overlap with this time slot
  // A booking overlaps if:
  // - Its start time is before our end time AND
  // - Its end time is after our start time
  const { data: overlappingBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, schedule_start, schedule_end')
    .in('status', ['pending', 'confirmed', 'queued', 'in_progress'])
    .lt('schedule_start', slotEnd.toISOString())
    .gt('schedule_end', slotStart.toISOString());

  if (bookingsError) {
    return {
      available: false,
      message: 'Gagal memeriksa ketersediaan slot',
    };
  }

  const bookedSlots = overlappingBookings?.length || 0;
  const availableSlots = totalMechanics - bookedSlots;

  if (availableSlots <= 0) {
    return {
      available: false,
      message: `Slot penuh. Semua ${totalMechanics} mekanik sudah terbooking di waktu ini. Silakan pilih jam lain.`,
      availableSlots: 0,
    };
  }

  return {
    available: true,
    message: `${availableSlots} dari ${totalMechanics} mekanik tersedia`,
    availableSlots,
  };
}
