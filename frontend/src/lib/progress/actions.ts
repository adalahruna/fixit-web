'use server';

import { createClient } from '../supabase/server';
import { revalidateBookingPaths } from '../utils/revalidation';

export async function startService(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Use atomic database function for status update
  const { data: result, error } = await supabase
    .rpc('start_service_atomic', {
      p_booking_id: bookingId,
      p_mechanic_user_id: user.id
    });

  if (error) {
    return { error: error.message };
  }

  if (result?.error) {
    return { error: result.error };
  }

  // Revalidate all related paths
  revalidateBookingPaths(bookingId);
  return { success: true };
}

export async function completeService(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Use atomic database function for status update
  const { data: result, error } = await supabase
    .rpc('complete_service_atomic', {
      p_booking_id: bookingId,
      p_mechanic_user_id: user.id
    });

  if (error) {
    return { error: error.message };
  }

  if (result?.error) {
    return { error: result.error };
  }

  // Revalidate all related paths
  revalidateBookingPaths(bookingId);
  return { success: true };
}
