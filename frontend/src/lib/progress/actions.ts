'use server';

import { createClient } from '../supabase/server';
import { revalidateBookingPaths } from '../utils/revalidation';
import { logAuditActivity } from '../audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/constants';

export async function startService(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get mechanic_id for audit logging
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id')
    .eq('user_id', user.id)
    .single();

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

  // Log audit activity after successful service start
  await logAuditActivity(
    user?.id || null,
    AUDIT_ACTIONS.START_SERVICE,
    AUDIT_ENTITIES.SERVICE_PROGRESS,
    bookingId,
    {
      booking_id: bookingId,
      mechanic_id: mechanic?.id,
      timestamp: new Date().toISOString()
    }
  );

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

  // Get mechanic_id for audit logging
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id')
    .eq('user_id', user.id)
    .single();

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

  // Log audit activity after successful service completion
  await logAuditActivity(
    user?.id || null,
    AUDIT_ACTIONS.COMPLETE_SERVICE,
    AUDIT_ENTITIES.SERVICE_PROGRESS,
    bookingId,
    {
      booking_id: bookingId,
      mechanic_id: mechanic?.id,
      actual_duration: result?.actual_duration,
      timestamp: new Date().toISOString()
    }
  );

  // Revalidate all related paths
  revalidateBookingPaths(bookingId);
  return { success: true };
}
