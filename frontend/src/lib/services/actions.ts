'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createService(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    default_duration_minutes: parseInt(formData.get('default_duration_minutes') as string),
    price: parseFloat(formData.get('price') as string),
  };

  // Validation
  if (!data.name || data.default_duration_minutes <= 0) {
    return { error: 'Nama dan durasi wajib diisi dengan benar' };
  }

  const { error } = await supabase.from('service_types').insert(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/services');
  redirect('/admin/services');
}

export async function updateService(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    default_duration_minutes: parseInt(formData.get('default_duration_minutes') as string),
    price: parseFloat(formData.get('price') as string),
  };

  // Validation
  if (!data.name || data.default_duration_minutes <= 0) {
    return { error: 'Nama dan durasi wajib diisi dengan benar' };
  }

  const { error } = await supabase
    .from('service_types')
    .update(data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/services');
  redirect('/admin/services');
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('service_types')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/services');
  return { success: true };
}
