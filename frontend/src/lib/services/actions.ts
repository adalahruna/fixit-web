'use server';

import { createClient } from '../supabase/server';
import { revalidateServicePaths } from '../utils/revalidation';
import { redirect } from 'next/navigation';
import { logAuditActivity } from '../audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/constants';

export async function createService(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const serviceData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    default_duration_minutes: parseInt(formData.get('default_duration_minutes') as string),
    price: parseFloat(formData.get('price') as string),
  };

  // Validation
  if (!serviceData.name || serviceData.default_duration_minutes <= 0) {
    return { error: 'Nama dan durasi wajib diisi dengan benar' };
  }

  const { error, data } = await supabase.from('service_types').insert(serviceData).select().single();

  if (error) {
    return { error: error.message };
  }

  // Log audit activity (non-blocking)
  await logAuditActivity(
    null,
    AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
    AUDIT_ENTITIES.SERVICE_TYPE,
    data.id,
    {
      name: data.name,
      price: data.price,
      default_duration_minutes: data.default_duration_minutes
    }
  );

  revalidateServicePaths();
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

  // Log audit activity (non-blocking)
  await logAuditActivity(
    null,
    AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
    AUDIT_ENTITIES.SERVICE_TYPE,
    id,
    {
      name: data.name,
      price: data.price,
      default_duration_minutes: data.default_duration_minutes
    }
  );

  revalidateServicePaths();
  redirect('/admin/services');
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  // Get service type data before deletion for audit log
  const { data: serviceType } = await supabase
    .from('service_types')
    .select('*')
    .eq('id', id)
    .single();

  // Check if service type has associated bookings
  const { data: bookings, error: checkError } = await supabase
    .from('booking_services')
    .select('id')
    .eq('service_type_id', id)
    .limit(1);

  if (checkError) {
    return { error: checkError.message };
  }

  if (bookings && bookings.length > 0) {
    return { error: 'Tidak dapat menghapus jenis servis yang memiliki booking terkait' };
  }

  // Delete service type
  const { error } = await supabase
    .from('service_types')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  // Log audit activity (non-blocking)
  if (serviceType) {
    await logAuditActivity(
      null,
      AUDIT_ACTIONS.DELETE_SERVICE_TYPE,
      AUDIT_ENTITIES.SERVICE_TYPE,
      id,
      {
        name: serviceType.name,
        price: serviceType.price,
        default_duration_minutes: serviceType.default_duration_minutes
      }
    );
  }

  revalidateServicePaths();
  return { success: true };
}
