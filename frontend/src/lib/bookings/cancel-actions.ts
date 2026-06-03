'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateBookingPaths } from '../utils/revalidation';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get booking to validate
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_id, schedule_start, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: 'Booking tidak ditemukan' };
  }

  // Validate ownership
  if (booking.customer_id !== user.id) {
    return { error: 'Anda tidak memiliki akses ke booking ini' };
  }

  // Validate status - only pending, confirmed, or queued can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'queued'];
  if (!cancellableStatuses.includes(booking.status)) {
    return { error: `Booking dengan status ${booking.status} tidak bisa dibatalkan` };
  }

  // Validate H-1 rule (24 hours before schedule)
  const scheduleDate = new Date(booking.schedule_start);
  const now = new Date();
  const hoursDiff = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 24) {
    return { error: 'Booking hanya bisa dibatalkan minimal 24 jam sebelum jadwal (H-1)' };
  }

  // Update booking status to cancelled using RPC to bypass trigger recursion
  const { data: result, error: updateError } = await supabase
    .rpc('cancel_booking_bypass_trigger', {
      p_booking_id: bookingId
    });

  if (updateError) {
    return { error: 'Gagal membatalkan booking: ' + updateError.message };
  }

  if (!result || !result.success) {
    return { error: 'Gagal membatalkan booking' };
  }

  // Revalidate paths
  revalidateBookingPaths(bookingId);

  // Log audit activity
  await logAuditActivity(
    user.id,
    AUDIT_ACTIONS.CANCEL_BOOKING,
    AUDIT_ENTITIES.BOOKING,
    bookingId,
    {
      original_schedule: booking.schedule_start,
      original_status: booking.status,
      cancellation_time: new Date().toISOString(),
      hours_before_schedule: Math.round(hoursDiff)
    }
  );

  return { success: true };
}
