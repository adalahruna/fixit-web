'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function startService(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user is assigned mechanic
  const { data: assignment } = await supabase
    .from('assignments')
    .select('mechanic_id')
    .eq('booking_id', bookingId)
    .single();

  if (!assignment) {
    return { error: 'Booking tidak di-assign' };
  }

  // Get mechanic data
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id')
    .eq('name', userData?.name)
    .single();

  if (!mechanic || mechanic.id !== assignment.mechanic_id) {
    return { error: 'Anda tidak di-assign untuk booking ini' };
  }

  // Update service_progress status
  const { error } = await supabase
    .from('service_progress')
    .update({
      status: 'in_progress',
      start_time: new Date().toISOString(),
    })
    .eq('booking_id', bookingId)
    .eq('status', 'queued');

  if (error) {
    return { error: error.message };
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ status: 'in_progress' })
    .eq('id', bookingId);

  revalidatePath(`/mechanic/queue/${bookingId}`);
  return { success: true };
}

export async function completeService(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user is assigned mechanic
  const { data: assignment } = await supabase
    .from('assignments')
    .select('mechanic_id')
    .eq('booking_id', bookingId)
    .single();

  if (!assignment) {
    return { error: 'Booking tidak di-assign' };
  }

  // Get mechanic data
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id')
    .eq('name', userData?.name)
    .single();

  if (!mechanic || mechanic.id !== assignment.mechanic_id) {
    return { error: 'Anda tidak di-assign untuk booking ini' };
  }

  // Update service_progress status
  const { error } = await supabase
    .from('service_progress')
    .update({
      status: 'done',
      end_time: new Date().toISOString(),
    })
    .eq('booking_id', bookingId)
    .eq('status', 'in_progress');

  if (error) {
    return { error: error.message };
  }

  // Update booking status to completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId);

  revalidatePath(`/mechanic/queue/${bookingId}`);
  revalidatePath('/mechanic/queue');
  return { success: true };
}
