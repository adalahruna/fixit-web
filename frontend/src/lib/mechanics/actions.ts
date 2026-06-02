'use server';

import { createClient } from '../supabase/server';
import { revalidateMechanicPaths } from '../utils/revalidation';
import { logAuditActivity } from '../audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/constants';

export async function createMechanic(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const is_active = formData.get('is_active') === 'true';
  const daily_capacity_minutes = formData.get('daily_capacity_minutes') 
    ? parseInt(formData.get('daily_capacity_minutes') as string) 
    : null;
  const skill_notes = formData.get('skill_notes') as string || null;

  // Validation
  if (!name) {
    return { error: 'Nama mekanik wajib diisi' };
  }
  if (!email) {
    return { error: 'Email wajib diisi' };
  }
  if (!password || password.length < 6) {
    return { error: 'Password minimal 6 karakter' };
  }

  try {
    // 1. Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: 'Email sudah terdaftar' };
    }

    // 2. Get current admin session (to restore later)
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    // 3. Create user account using signUp
    // Note: signUp will automatically login as the new user, so we need to restore admin session after
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'mechanic'
        },
        emailRedirectTo: undefined // Prevent redirect
      }
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return { error: `Gagal membuat akun: ${authError?.message || 'Unknown error'}` };
    }

    // 4. Immediately restore admin session BEFORE any database operations
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      });
    }

    // 5. Create NEW Supabase client with restored admin session
    const adminSupabase = await createClient();

    // 6. Create user record in users table (using admin client)
    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'mechanic'
      });

    if (userError) {
      console.error('User table error:', userError);
      return { error: `Gagal menyimpan data user: ${userError.message}` };
    }

    // 7. Create mechanic record linked to user (using admin client)
    const { error: mechanicError, data: mechanicData } = await adminSupabase
      .from('mechanics')
      .insert({
        name,
        is_active,
        daily_capacity_minutes,
        skill_notes,
        user_id: authData.user.id // Link to user
      })
      .select()
      .single();

    if (mechanicError) {
      console.error('Mechanic error:', mechanicError);
      // Cleanup: delete user if mechanic creation fails
      await adminSupabase.from('users').delete().eq('id', authData.user.id);
      return { error: `Gagal menyimpan data mekanik: ${mechanicError.message}` };
    }

    // Log audit activity (non-blocking)
    try {
      await logAuditActivity(
        authData.user.id,
        AUDIT_ACTIONS.CREATE_MECHANIC,
        AUDIT_ENTITIES.MECHANIC,
        mechanicData.id,
        {
          name,
          is_active,
          daily_capacity_minutes,
          user_id: authData.user.id
        }
      );
    } catch (auditError) {
      // Silent fail - audit logging shouldn't block mechanic creation
      console.error('Audit logging failed:', auditError);
    }

    revalidateMechanicPaths();
    
    // Return success with account info
    return { 
      success: 'Mekanik dan akun login berhasil dibuat!',
      accountInfo: {
        email,
        password // Show password once so admin can give it to mechanic
      }
    };
  } catch (error) {
    console.error('Error creating mechanic:', error);
    return { error: 'Terjadi kesalahan saat membuat mekanik' };
  }
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

    // Log audit activity after successful update (non-blocking)
    try {
      await logAuditActivity(
        user?.id || null,
        AUDIT_ACTIONS.UPDATE_MECHANIC,
        AUDIT_ENTITIES.MECHANIC,
        id,
        {
          name: data.name,
          is_active: data.is_active,
          daily_capacity_minutes: data.daily_capacity_minutes,
          skill_notes: data.skill_notes,
          user_id: currentMechanic.user_id
        }
      );
    } catch (auditError) {
      // Silent fail - audit logging shouldn't block mechanic update
      console.error('Audit logging failed:', auditError);
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
 * Delete mechanic
 */
export async function deleteMechanic(id: string) {
  const supabase = await createClient();

  try {
    // Check if mechanic has active or pending assignments
    const { data: assignments, error: checkError } = await supabase
      .from('assignments')
      .select(`
        id,
        booking:bookings!inner(status)
      `)
      .eq('mechanic_id', id)
      .in('booking.status', ['pending', 'confirmed', 'queued', 'in_progress'])
      .limit(1);

    if (checkError) {
      return { error: checkError.message };
    }

    if (assignments && assignments.length > 0) {
      return { error: 'Tidak dapat menghapus mekanik yang memiliki assignment aktif atau pending' };
    }

    // Get mechanic data to check for user_id
    const { data: mechanic } = await supabase
      .from('mechanics')
      .select('user_id, name, is_active, daily_capacity_minutes')
      .eq('id', id)
      .single();

    // Delete mechanic
    const { error: deleteError } = await supabase
      .from('mechanics')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // Log audit activity (non-blocking)
    if (mechanic) {
      try {
        await logAuditActivity(
          user?.id || null,
          AUDIT_ACTIONS.DELETE_MECHANIC,
          AUDIT_ENTITIES.MECHANIC,
          id,
          {
            name: mechanic.name,
            is_active: mechanic.is_active,
            daily_capacity_minutes: mechanic.daily_capacity_minutes,
            user_id: mechanic.user_id
          }
        );
      } catch (auditError) {
        // Silent fail - audit logging shouldn't block mechanic deletion
        console.error('Audit logging failed:', auditError);
      }
    }

    // If mechanic has linked user, optionally delete the user account too
    // (This is optional - you might want to keep the user account)
    if (mechanic?.user_id) {
      // Delete user account
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', mechanic.user_id);

      if (userDeleteError) {
        console.error('Failed to delete linked user:', userDeleteError);
        // Don't fail the operation, mechanic is already deleted
      }
    }

    revalidateMechanicPaths();
    return { success: true };
  } catch (error) {
    console.error('Error deleting mechanic:', error);
    return { error: 'Terjadi kesalahan saat menghapus mekanik' };
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