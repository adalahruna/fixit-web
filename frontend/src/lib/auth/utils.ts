import { createClient } from '../supabase/server';

export async function getUser() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Ambil role dari metadata dulu (cepat, tidak perlu query DB)
  let role = user.user_metadata?.role as string;

  // Fallback: jika role tidak ada di metadata, query dari database
  if (!role) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    role = userData?.role || 'customer';

    // Sync role ke metadata untuk next time
    if (userData?.role) {
      await supabase.auth.updateUser({
        data: { role: userData.role }
      });
    }
  }

  // Get full user data dari database
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Jika query DB gagal karena RLS, return data minimal dari auth
  if (!userData) {
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || '',
      phone: user.user_metadata?.phone || '',
      role: role,
      status: 'active' as const,
      created_at: user.created_at,
    };
  }

  return userData;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}
