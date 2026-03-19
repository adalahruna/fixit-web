'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
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

  revalidatePath('/admin/mechanics');
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

  const { error } = await supabase
    .from('mechanics')
    .update(data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/mechanics');
  redirect('/admin/mechanics');
}
