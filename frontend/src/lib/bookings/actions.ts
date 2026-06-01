'use server';

import { createClient } from '../supabase/server';
import { revalidateBookingPaths } from '../utils/revalidation';
import { redirect } from 'next/navigation';
import { localToUTC } from '../utils/datetime';
import { checkSlotAvailability } from '../utils/slot-availability';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';
import { validateIndonesianPlate } from '../utils/plate-validation';

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
  const complaintPhotoBase64 = formData.get('complaint_photo') as string | null;

  // Validation
  if (!scheduledDate || !scheduledTime) {
    return { error: 'Tanggal dan jam servis wajib diisi' };
  }

  // Combine date and time to check if it's in the past
  const scheduleStart = localToUTC(scheduledDate, scheduledTime);
  const scheduleStartDate = new Date(scheduleStart);
  const now = new Date();

  // Check if booking time is in the past
  if (scheduleStartDate <= now) {
    return { error: 'Tidak dapat booking di waktu yang sudah lewat. Pilih waktu di masa depan.' };
  }

  // Validate operational hours (08:00 - 17:00 WIB)
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const startTime = 8 * 60; // 08:00
  const endTime = 17 * 60; // 17:00

  if (timeInMinutes < startTime || timeInMinutes > endTime) {
    return { error: 'Jam operasional: 08:00 - 17:00 WIB' };
  }

  if (!vehiclePlate || !vehicleType) {
    return { error: 'Data motor wajib diisi lengkap' };
  }

  // Validate Indonesian plate number format
  const plateValidation = validateIndonesianPlate(vehiclePlate);
  if (!plateValidation.isValid) {
    return { error: `Format plat nomor tidak valid: ${plateValidation.error}` };
  }

  // BR-11: Jika tidak ada servis dipilih, keluhan wajib diisi
  if (serviceIds.length === 0 && !consultationText) {
    return { error: 'Jika tidak memilih jenis servis, keluhan/konsultasi wajib diisi' };
  }

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

  // Validate that service doesn't exceed operational hours
  const endTimeMinutes = timeInMinutes + estimatedDurationMinutes;
  if (endTimeMinutes > endTime) {
    const exceedMinutes = endTimeMinutes - endTime;
    const exceedHours = Math.floor(exceedMinutes / 60);
    const exceedMins = exceedMinutes % 60;
    return { 
      error: `Estimasi servis ${estimatedDurationMinutes} menit akan selesai pukul ${Math.floor(endTimeMinutes / 60)}:${String(endTimeMinutes % 60).padStart(2, '0')}, ` +
             `melebihi jam operasional ${exceedHours > 0 ? exceedHours + ' jam ' : ''}${exceedMins} menit. ` +
             `Silakan pilih waktu lebih awal atau booking untuk besok.`
    };
  }

  // Calculate schedule_end
  const scheduleEnd = new Date(scheduleStartDate.getTime() + estimatedDurationMinutes * 60000).toISOString();

  // Check slot availability
  const slotCheck = await checkSlotAvailability(scheduleStart, estimatedDurationMinutes);
  
  if (!slotCheck.available) {
    return { error: slotCheck.message || 'Slot tidak tersedia' };
  }

  // Upload complaint photo if provided
  let complaintPhotoUrl: string | null = null;
  if (complaintPhotoBase64) {
    try {
      // Extract base64 data and convert to buffer
      const base64Data = complaintPhotoBase64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from base64 header
      const mimeType = complaintPhotoBase64.split(';')[0].split(':')[1];
      const fileExt = mimeType.split('/')[1];
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Gagal mengupload foto. Silakan coba lagi' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('complaint-photos')
        .getPublicUrl(uploadData.path);

      complaintPhotoUrl = publicUrl;
    } catch (error) {
      console.error('Error processing photo:', error);
      return { error: 'Gagal memproses foto. Silakan coba lagi' };
    }
  }

  // Create booking
  const bookingData = {
    customer_id: user.id,
    schedule_start: scheduleStart,
    schedule_end: scheduleEnd,
    status: 'pending',
    vehicle_plate: vehiclePlate,
    vehicle_type: vehicleType,
    complaint_photo_url: complaintPhotoUrl,
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

  // Log audit activity
  await logAuditActivity(
    AUDIT_ACTIONS.CREATE_BOOKING,
    AUDIT_ENTITIES.BOOKING,
    booking.id,
    {
      scheduled_start: bookingData.schedule_start,
      scheduled_end: bookingData.schedule_end,
      vehicle_plate: vehiclePlate,
      vehicle_type: vehicleType,
      services_count: serviceIds.length,
      has_consultation: !!consultationText
    }
  );

  revalidateBookingPaths(booking.id);
  redirect('/customer/bookings');
}
