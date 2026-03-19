'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignMechanic(bookingId: string, mechanicId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check if user is admin/owner
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || !['admin', 'owner'].includes(userData.role)) {
    return { error: 'Forbidden: Only admin/owner can assign mechanics' };
  }

  // Get current queue position for this mechanic
  const { data: existingAssignments } = await supabase
    .from('assignments')
    .select('queue_position')
    .eq('mechanic_id', mechanicId)
    .order('queue_position', { ascending: false })
    .limit(1);

  const nextPosition = existingAssignments && existingAssignments.length > 0 
    ? existingAssignments[0].queue_position + 1 
    : 1;

  // Create assignment
  const { error: assignError } = await supabase
    .from('assignments')
    .insert({
      booking_id: bookingId,
      mechanic_id: mechanicId,
      queue_position: nextPosition,
    });

  if (assignError) {
    return { error: assignError.message };
  }

  // Update booking status to confirmed
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Create service_progress record with queued status
  const { error: progressError } = await supabase
    .from('service_progress')
    .insert({
      booking_id: bookingId,
      status: 'queued',
    });

  if (progressError) {
    return { error: progressError.message };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/mechanic');
  
  return { success: true };
}

export async function unassignMechanic(bookingId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check if user is admin/owner
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || !['admin', 'owner'].includes(userData.role)) {
    return { error: 'Forbidden: Only admin/owner can unassign mechanics' };
  }

  // Delete assignment
  const { error: deleteError } = await supabase
    .from('assignments')
    .delete()
    .eq('booking_id', bookingId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Update booking status back to pending
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'pending' })
    .eq('id', bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Delete service_progress record
  await supabase
    .from('service_progress')
    .delete()
    .eq('booking_id', bookingId);

  revalidatePath('/admin/bookings');
  revalidatePath('/mechanic');
  
  return { success: true };
}
