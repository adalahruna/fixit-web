'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

  // Update booking status to cancelled
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (updateError) {
    return { error: 'Gagal membatalkan booking: ' + updateError.message };
  }

  // Update service_progress status to cancelled (if exists)
  const { error: progressError } = await supabase
    .from('service_progress')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  // Ignore error if service_progress doesn't exist (booking not assigned yet)
  // progressError is expected if booking hasn't been assigned

  // Revalidate paths
  revalidatePath('/customer/bookings');
  revalidatePath(`/customer/bookings/${bookingId}`);

  return { success: true };
}
