'use server';

import { createClient } from '../supabase/server';
import { revalidateMechanicPaths } from '../utils/revalidation';
import { redirect } from 'next/navigation';

export async function createMechanic(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    name: formData.get('name') as string,
    is_active: formData.get('is_active') === 'true',
    daily_capacity_minutes: formData.get('daily_capacity_minutes') 
      ? parseInt(formData.get('daily_capacity_minutes') as string) 
      : null,
    skill_notes: formData.get('skill_notes') as string || null,
  };

  // Validation
  if (!data.name) {
    return { error: 'Nama mekanik wajib diisi' };
  }

  const { error } = await supabase.from('mechanics').insert(data);

  if (error) {
    return { error: error.message };
  }

  revalidateMechanicPaths();
  
  // For create, we can redirect immediately since there's no user sync needed
  redirect('/admin/mechanics');
}

export async function updateMechanic(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const data = {
    name: formData.get('name') as string,
    is_active: formData.get('is_active') === 'true',
    daily_capacity_minutes: formData.get('daily_capacity_minutes') 
      ? parseInt(formData.get('daily_capacity_minutes') as string) 
      : null,
    skill_notes: formData.get('skill_notes') as string || null,
  };

  // Validation
  if (!data.name) {
    return { error: 'Nama mekanik wajib diisi' };
  }

  try {
    // First, get current mechanic data BEFORE updating
    const { data: currentMechanic } = await supabase
      .from('mechanics')
      .select('user_id, name')
      .eq('id', id)
      .single();

    if (!currentMechanic) {
      return { error: 'Data mekanik tidak ditemukan' };
    }

    // Update mechanic data
    const { error: mechanicError } = await supabase
      .from('mechanics')
      .update(data)
      .eq('id', id);

    if (mechanicError) {
      return { error: mechanicError.message };
    }

    // If mechanic has user_id relation, update user name too
    if (currentMechanic.user_id) {
      const { error: userError } = await supabase
        .from('users')
        .update({ name: data.name })
        .eq('id', currentMechanic.user_id);

      if (userError) {
        console.error('Failed to sync user name:', userError);
        // Don't fail the whole operation, just log the error
        // The mechanic update was successful, user sync is secondary
      }
    } else {
      // Fallback: try to find user by current name and link them
      // This is for backward compatibility
      const { data: relatedUser } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentMechanic.name) // Use current name, not updated name
        .eq('role', 'mechanic')
        .single();

      if (relatedUser) {
        // Update user name and link the mechanic
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ name: data.name })
          .eq('id', relatedUser.id);

        // Also update mechanic to link with user
        const { error: mechanicLinkError } = await supabase
          .from('mechanics')
          .update({ user_id: relatedUser.id })
          .eq('id', id);

        if (userUpdateError) {
          console.error('Failed to update user name:', userUpdateError);
          // Don't fail the operation, just log
        }
        if (mechanicLinkError) {
          console.error('Failed to link mechanic with user:', mechanicLinkError);
          // Don't fail the operation, just log
        }
      }
    }

    revalidateMechanicPaths();
    
    // Return success message instead of redirecting immediately
    // This allows the form to show success feedback
    return { success: 'Data mekanik berhasil diupdate' };
  } catch (error) {
    console.error('Error updating mechanic:', error);
    return { error: 'Terjadi kesalahan saat mengupdate data mekanik' };
  }
}

/**
 * Link mechanic with user account
 */
export async function linkMechanicWithUser(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const mechanicId = formData.get('mechanic_id') as string;
  const userId = formData.get('user_id') as string;

  if (!mechanicId || !userId) {
    return { error: 'Mechanic ID dan User ID wajib diisi' };
  }

  try {
    // Check if user exists and has mechanic role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .eq('role', 'mechanic')
      .single();

    if (userError || !user) {
      return { error: 'User tidak ditemukan atau bukan mekanik' };
    }

    // Check if mechanic exists
    const { data: mechanic, error: mechanicError } = await supabase
      .from('mechanics')
      .select('id, name')
      .eq('id', mechanicId)
      .single();

    if (mechanicError || !mechanic) {
      return { error: 'Data mekanik tidak ditemukan' };
    }

    // Update mechanic to link with user
    const { error: linkError } = await supabase
      .from('mechanics')
      .update({ 
        user_id: userId,
        name: user.name // Sync name with user
      })
      .eq('id', mechanicId);

    if (linkError) {
      return { error: linkError.message };
    }

    revalidateMechanicPaths();
    return { success: 'Mekanik berhasil dihubungkan dengan user' };
  } catch (error) {
    console.error('Error linking mechanic with user:', error);
    return { error: 'Terjadi kesalahan saat menghubungkan mekanik dengan user' };
  }
}

/**
 * Get unlinked mechanics and users for admin
 */
export async function getUnlinkedData() {
  const supabase = await createClient();

  try {
    // Get mechanics without user_id
    const { data: unlinkedMechanics } = await supabase
      .from('mechanics')
      .select('id, name')
      .is('user_id', null);

    // Get mechanic users without linked mechanic
    const { data: mechanicUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'mechanic');

    // Filter out users that are already linked
    const { data: linkedMechanics } = await supabase
      .from('mechanics')
      .select('user_id')
      .not('user_id', 'is', null);

    const linkedUserIds = linkedMechanics?.map(m => m.user_id) || [];
    const unlinkedUsers = mechanicUsers?.filter(u => !linkedUserIds.includes(u.id)) || [];

    return {
      unlinkedMechanics: unlinkedMechanics || [],
      unlinkedUsers: unlinkedUsers || []
    };
  } catch (error) {
    console.error('Error getting unlinked data:', error);
    return {
      unlinkedMechanics: [],
      unlinkedUsers: []
    };
  }
}