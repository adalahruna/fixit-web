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
  const vehiclePlate = formData.get('vehicle_plate') as string;
  const vehicleType = formData.get('vehicle_type') as string;
  const consultationText = formData.get('consultation_text') as string;
  const serviceIds = formData.getAll('service_ids') as string[];

  // Validation
  if (!scheduledDate || !scheduledTime) {
    return { error: 'Tanggal dan jam servis wajib diisi' };
  }

  if (!vehiclePlate || !vehicleType) {
    return { error: 'Data motor wajib diisi lengkap' };
  }

  // BR-11: Jika tidak ada servis dipilih, keluhan wajib diisi
  if (serviceIds.length === 0 && !consultationText) {
    return { error: 'Jika tidak memilih jenis servis, keluhan/konsultasi wajib diisi' };
  }

  // Combine date and time for schedule_start with timezone
  const scheduleStartDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
  const scheduleStart = scheduleStartDate.toISOString();

  // Calculate estimated duration and schedule_end
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

  // Calculate schedule_end
  const scheduleEnd = new Date(scheduleStartDate.getTime() + estimatedDurationMinutes * 60000).toISOString();

  // Create booking
  const bookingData = {
    customer_id: user.id,
    schedule_start: scheduleStart,
    schedule_end: scheduleEnd,
    status: 'pending',
    vehicle_plate: vehiclePlate,
    vehicle_type: vehicleType,
  };
  
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();

  if (bookingError) {
    return { error: bookingError.message };
  }

  // Insert booking_services with duration
  if (serviceIds.length > 0) {
    const { data: services } = await supabase
      .from('service_types')
      .select('id, default_duration_minutes')
      .in('id', serviceIds);

    if (services) {
      const bookingServices = services.map(service => ({
        booking_id: booking.id,
        service_type_id: service.id,
        duration_minutes: service.default_duration_minutes,
      }));

      const { error: servicesError } = await supabase
        .from('booking_services')
        .insert(bookingServices);

      if (servicesError) {
        return { error: servicesError.message };
      }
    }
  }

  // Insert consultation if provided
  if (consultationText) {
    const { error: consultationError } = await supabase
      .from('booking_consultations')
      .insert({
        booking_id: booking.id,
        complaint_text: consultationText,
      });

    if (consultationError) {
      return { error: consultationError.message };
    }
  }

  revalidatePath('/customer/bookings');
  redirect('/customer/bookings');
}
