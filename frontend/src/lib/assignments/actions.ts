'use server';

import { createClient } from '../supabase/server';
import { revalidateAssignmentPaths } from '../utils/revalidation';
import { logAuditActivity } from '../audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/constants';

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

  // Get mechanic name for audit metadata
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('name')
    .eq('id', mechanicId)
    .single();

  // Log audit activity (non-blocking)
  await logAuditActivity(
    user.id,
    AUDIT_ACTIONS.ASSIGN_MECHANIC,
    AUDIT_ENTITIES.ASSIGNMENT,
    bookingId,
    {
      booking_id: bookingId,
      mechanic_id: mechanicId,
      mechanic_name: mechanic?.name || 'Unknown'
    }
  );

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

  // Get assignment details before unassignment for audit logging
  const { data: assignment } = await supabase
    .from('assignments')
    .select('mechanic_id, mechanics(name)')
    .eq('booking_id', bookingId)
    .single();

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

  // Log audit activity (non-blocking)
  await logAuditActivity(
    user.id,
    AUDIT_ACTIONS.UNASSIGN_MECHANIC,
    AUDIT_ENTITIES.ASSIGNMENT,
    bookingId,
    {
      booking_id: bookingId,
      mechanic_id: assignment?.mechanic_id || 'Unknown',
      mechanic_name: (assignment?.mechanics as any)?.name || 'Unknown'
    }
  );

  // Revalidate all related paths
  revalidateAssignmentPaths(bookingId);
  return { success: true };
}
