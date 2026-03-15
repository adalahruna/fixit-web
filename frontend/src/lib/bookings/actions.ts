'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBooking(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Parse form data
  const scheduledDate = formData.get('scheduled_date') as string;
  const scheduledTime = formData.get('scheduled_time') as string;
  const motorcycleBrand = formData.get('motorcycle_brand') as string;
  const motorcycleModel = formData.get('motorcycle_model') as string;
  const motorcyclePlate = formData.get('motorcycle_plate') as string;
  const consultationText = formData.get('consultation_text') as string;
  const serviceIds = formData.getAll('service_ids') as string[];

  // Validation
  if (!scheduledDate || !scheduledTime) {
    return { error: 'Tanggal dan jam servis wajib diisi' };
  }

  if (!motorcycleBrand || !motorcycleModel || !motorcyclePlate) {
    return { error: 'Data motor wajib diisi lengkap' };
  }

  // BR-11: Jika tidak ada servis dipilih, keluhan wajib diisi
  if (serviceIds.length === 0 && !consultationText) {
    return { error: 'Jika tidak memilih jenis servis, keluhan/konsultasi wajib diisi' };
  }

  // Combine date and time
  const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

  // Calculate estimated duration
  let estimatedDurationMinutes = 60; // Default jika tidak ada servis
  if (serviceIds.length > 0) {
    const { data: services } = await supabase
      .from('service_types')
      .select('default_duration_minutes')
      .in('id', serviceIds);
    
    if (services) {
      estimatedDurationMinutes = services.reduce(
        (sum, s) => sum + s.default_duration_minutes, 
        0
      );
    }
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      scheduled_at: scheduledAt,
      status: 'PENDING',
      motorcycle_brand: motorcycleBrand,
      motorcycle_model: motorcycleModel,
      motorcycle_plate: motorcyclePlate,
      estimated_duration_minutes: estimatedDurationMinutes,
    })
    .select()
    .single();

  if (bookingError) {
    return { error: bookingError.message };
  }

  // Insert booking_services
  if (serviceIds.length > 0) {
    const bookingServices = serviceIds.map(serviceId => ({
      booking_id: booking.id,
      service_type_id: serviceId,
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) {
      return { error: servicesError.message };
    }
  }

  // Insert consultation if provided
  if (consultationText) {
    const { error: consultationError } = await supabase
      .from('booking_consultations')
      .insert({
        booking_id: booking.id,
        consultation_text: consultationText,
        created_by: user.id,
      });

    if (consultationError) {
      return { error: consultationError.message };
    }
  }

  revalidatePath('/customer/bookings');
  redirect('/customer/bookings');
}
