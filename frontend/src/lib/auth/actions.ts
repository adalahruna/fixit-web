'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Get user role dari database
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('email', data.email)
    .single();

  revalidatePath('/', 'layout');
  
  // Redirect berdasarkan role
  if (userData?.role === 'customer') {
    redirect('/customer');
  } else if (userData?.role === 'admin') {
    redirect('/admin');
  } else if (userData?.role === 'mechanic') {
    redirect('/mechanic');
  } else if (userData?.role === 'owner') {
    redirect('/owner');
  }
  
  redirect('/');
}

export async function register(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  };

  // Create auth user dengan role di metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        role: 'customer', // Simpan role di metadata
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Create user record dengan role customer (default)
  if (authData.user) {
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: 'customer',
      status: 'active',
    });

    if (dbError) {
      return { error: dbError.message };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/customer');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
