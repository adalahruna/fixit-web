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

  // Get booking to validate - use single query with minimal fields
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_id, schedule_start, status')
    .eq('id', bookingId)
    .eq('customer_id', user.id) // Add this to filter immediately
    .single();

  if (fetchError || !booking) {
    return { error: 'Booking tidak ditemukan atau Anda tidak memiliki akses' };
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

  // Update booking status to cancelled
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('customer_id', user.id); // Add this to ensure ownership

  if (updateError) {
    return { error: 'Gagal membatalkan booking: ' + updateError.message };
  }

  // Manually update service_progress if exists (since we removed the trigger)
  // Only update if service_progress exists (booking assigned to mechanic)
  await supabase
    .from('service_progress')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);
  
  // Ignore error - service_progress might not exist if booking not assigned yet

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
