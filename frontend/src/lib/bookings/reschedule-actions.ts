'use server';

import { createClient } from '../supabase/server';
import { revalidateBookingPaths } from '../utils/revalidation';
import { localToUTC } from '../utils/datetime';
import { checkSlotAvailability } from '../utils/slot-availability';
import { logAuditActivity } from '../audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/constants';

export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newTime: string
) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get booking details
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, booking_services(service_type:service_types(default_duration_minutes))')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: 'Booking tidak ditemukan' };
  }

  // Check ownership (customer can only reschedule their own booking)
  if (booking.customer_id !== user.id) {
    return { error: 'Anda tidak memiliki akses untuk reschedule booking ini' };
  }

  // BR-04: Check status - cannot reschedule if in_progress or done
  if (['in_progress', 'done', 'cancelled'].includes(booking.status)) {
    return { 
      error: `Tidak dapat reschedule booking dengan status ${booking.status}` 
    };
  }

  // BR-04: Check H-1 rule (at least 1 day before scheduled time)
  const currentSchedule = new Date(booking.schedule_start);
  const now = new Date();
  const hoursDiff = (currentSchedule.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 24) {
    return { 
      error: 'Reschedule hanya dapat dilakukan minimal H-1 (24 jam sebelum jadwal)' 
    };
  }

  // Calculate new schedule times
  const newScheduleStart = localToUTC(newDate, newTime);
  const newScheduleStartDate = new Date(newScheduleStart);

  // Validate operational hours (08:00 - 17:00 WIB)
  const [hours, minutes] = newTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const startTime = 8 * 60; // 08:00
  const endTime = 17 * 60; // 17:00

  if (timeInMinutes < startTime || timeInMinutes > endTime) {
    return { error: 'Jam operasional: 08:00 - 17:00 WIB' };
  }

  // Calculate estimated duration
  const estimatedDuration = booking.booking_services && booking.booking_services.length > 0
    ? booking.booking_services.reduce(
        (sum: number, bs: { service_type?: { default_duration_minutes?: number } }) => 
          sum + (bs.service_type?.default_duration_minutes || 0), 
        0
      )
    : 60;

  const newScheduleEnd = new Date(
    newScheduleStartDate.getTime() + estimatedDuration * 60000
  ).toISOString();

  // Check slot availability for new schedule
  const slotCheck = await checkSlotAvailability(newScheduleStart, estimatedDuration);
  
  if (!slotCheck.available) {
    return { error: slotCheck.message || 'Slot tidak tersedia untuk jadwal baru' };
  }

  // Update booking schedule
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      schedule_start: newScheduleStart,
      schedule_end: newScheduleEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Log audit activity (non-blocking)
  try {
    await logAuditActivity(
      user.id,
      AUDIT_ACTIONS.RESCHEDULE_BOOKING,
      AUDIT_ENTITIES.BOOKING,
      bookingId,
      {
        original_schedule_start: booking.schedule_start,
        original_schedule_end: booking.schedule_end,
        new_schedule_start: newScheduleStart,
        new_schedule_end: newScheduleEnd
      }
    );
  } catch (auditError) {
    // Log audit error but don't block the operation
    console.error('Failed to log audit activity for reschedule:', auditError);
  }

  // Revalidate paths
  revalidateBookingPaths(bookingId);

  return { success: true, message: 'Booking berhasil di-reschedule' };
}
