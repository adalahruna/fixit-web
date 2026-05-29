'use server';

import { createClient } from '../supabase/server';
import { revalidateAssignmentPaths } from '../utils/revalidation';

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

  // Use atomic database function for assignment
  const { data: result, error } = await supabase
    .rpc('assign_mechanic_atomic', {
      p_booking_id: bookingId,
      p_mechanic_id: mechanicId
    });

  if (error) {
    return { error: error.message };
  }

  if (result?.error) {
    return { error: result.error };
  }

  // Revalidate all related paths
  revalidateAssignmentPaths(bookingId);
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

  // Use atomic database function for unassignment
  const { data: result, error } = await supabase
    .rpc('unassign_mechanic_atomic', {
      p_booking_id: bookingId
    });

  if (error) {
    return { error: error.message };
  }

  // Check if function returned an error
  if (result && typeof result === 'object') {
    if ('error' in result && result.error) {
      return { error: result.error as string };
    }
    if ('success' in result && result.success === false && 'error' in result) {
      return { error: result.error as string };
    }
  }

  // Revalidate all related paths
  revalidateAssignmentPaths(bookingId);
  return { success: true };
}
