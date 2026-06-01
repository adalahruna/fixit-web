import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RescheduleButton from '@/components/bookings/RescheduleButton';
import CancelButton from '@/components/bookings/CancelButton';
import RealtimeBookingStatus from '@/components/bookings/RealtimeBookingStatus';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['customer']);
  
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get booking detail
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      booking_services (
        service_type:service_types (
          name,
          description,
          default_duration_minutes,
          price
        )
      ),
      booking_consultations (
        complaint_text,
        created_at
      ),
      assignments (
        mechanic:mechanics (
          name
        )
      ),
      service_progress (
        start_time,
        end_time,
        status
      )
    `)
    .eq('id', id)
    .eq('customer_id', user?.id)
    .maybeSingle();

  if (!booking) {
    notFound();
  }

  // Debug: Log service_progress data
  console.log('=== DEBUG: Customer Booking Detail ===');
  console.log('Booking ID:', booking.id);
  console.log('Booking Status:', booking.status);
  console.log('Assignments:', JSON.stringify(booking.assignments, null, 2));
  console.log('Service Progress:', JSON.stringify(booking.service_progress, null, 2));
  console.log('Is Array?', Array.isArray(booking.service_progress));
  console.log('Length:', booking.service_progress?.length);
  console.log('Has Assignment?', booking.assignments?.length > 0);

  // Normalize service_progress to handle both array and object
  const serviceProgress = Array.isArray(booking.service_progress) 
    ? (booking.service_progress.length > 0 ? booking.service_progress[0] : null)
    : booking.service_progress;

  // Normalize assignments to handle both array and object
  const assignment = Array.isArray(booking.assignments)
    ? (booking.assignments.length > 0 ? booking.assignments[0] : null)
    : booking.assignments;

  console.log('ServiceProgress normalized:', serviceProgress);
  console.log('Assignment normalized:', assignment);
  console.log('=====================================');

  // Calculate total price
  const totalPrice = booking.booking_services?.reduce((sum: number, bs: { service_type?: { price?: number } }) => {
    return sum + (bs.service_type?.price || 0);
  }, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/customer/bookings"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider mb-6 transition-opacity hover:opacity-80"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Booking List
      </Link>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header - Blue Background */}
        <div className="bg-blue-600 px-10 py-9 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">Detail Booking</h1>
              <p className="text-xs font-mono tracking-widest text-blue-50 uppercase">
                Booking ID: #{booking.id.slice(0, 13)}
              </p>
            </div>
            <RealtimeBookingStatus
              bookingId={booking.id}
              initialStatus={booking.status}
            />
          </div>
        </div>

        {/* Grid Information */}
        <div className="grid md:grid-cols-2 gap-5 p-10">
          {/* Schedule Box */}
          <div className="bg-gray-50 rounded-xl p-7">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">
              Service Schedule
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Date</label>
                  <span className="block text-sm font-semibold text-gray-900">
                    {new Date(booking.schedule_start).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Start Time</label>
                  <span className="block text-sm font-semibold text-gray-900">
                    {new Date(booking.schedule_start).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              {booking.schedule_end && (
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-900 mb-0.5">Est. Completion</label>
                    <span className="block text-sm font-semibold text-gray-900">
                      {new Date(booking.schedule_end).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Motorcycle Data Box */}
          <div className="bg-gray-50 rounded-xl p-7">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">
              Motorcycle Data
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.72 2.03C12.5 2.01 12.26 2 12 2s-.5.01-.72.03C9.08 2.36 7.5 4.19 7.5 6.5v.5H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1.5v-.5c0-2.31-1.58-4.14-3.78-4.47zM16 9v10H8V9h8zm-7.5-2.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V7h-7v-.5z"/>
                  </svg>
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Brand & Model</label>
                  <span className="block text-sm font-semibold text-gray-900">
                    {booking.vehicle_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">License Plate</label>
                  <span className="block text-sm font-semibold text-gray-900">
                    {booking.vehicle_plate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="px-10 pb-8">
          <div className="flex justify-between items-center mb-7">
            <h3 className="text-lg font-extrabold text-gray-900">Jenis Servis</h3>
            {booking.booking_services && booking.booking_services.length > 0 && (
              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide">
                {booking.booking_services.length} ITEMS
              </span>
            )}
          </div>

          {booking.booking_services && booking.booking_services.length > 0 ? (
            <div className="space-y-6">
              {booking.booking_services.map((bs: { service_type?: { name?: string; description?: string; default_duration_minutes?: number; price?: number } }, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        {bs.service_type?.name}
                      </h4>
                      {bs.service_type?.description && (
                        <p className="text-xs text-gray-900">
                          {bs.service_type.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-10 text-right">
                    {bs.service_type?.default_duration_minutes && (
                      <div>
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                          Durasi
                        </label>
                        <span className="text-sm font-bold text-gray-900">
                          {Math.floor(bs.service_type.default_duration_minutes / 60)} Jam {bs.service_type.default_duration_minutes % 60 > 0 ? `${bs.service_type.default_duration_minutes % 60} Menit` : ''}
                        </span>
                      </div>
                    )}
                    {bs.service_type?.price && (
                      <div>
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                          Harga
                        </label>
                        <span className="text-sm font-bold text-gray-900">
                          Rp {bs.service_type.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-900 italic">Tidak ada jenis servis dipilih (konsultasi)</p>
            </div>
          )}

          {/* Notes */}
          {booking.booking_consultations && booking.booking_consultations.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 mt-6">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">
                Catatan/Keluhan:
              </label>
              <p className="text-sm text-gray-700 font-medium">
                {booking.booking_consultations[0].complaint_text}
              </p>
            </div>
          )}

          {/* Foto Keluhan */}
          {booking.complaint_photo_url && (
            <div className="mt-6">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                📸 Foto Keluhan:
              </label>
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={booking.complaint_photo_url} 
                  alt="Foto keluhan motor" 
                  className="w-full max-w-2xl mx-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mechanic & Progress Info */}
        {assignment && (
          <div className="px-10 pb-8">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Informasi Mekanik & Progres</h3>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Mekanik
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {assignment.mechanic.name}
                </p>
              </div>
              {serviceProgress ? (
                <>
                  {serviceProgress.status && (
                    <div>
                      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full uppercase ${
                        serviceProgress.status === 'queued' ? 'bg-purple-100 text-purple-700' :
                        serviceProgress.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                        serviceProgress.status === 'done' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {serviceProgress.status === 'queued' ? 'Dalam Antrian' :
                         serviceProgress.status === 'in_progress' ? 'Sedang Dikerjakan' :
                         serviceProgress.status === 'done' ? 'Selesai' :
                         serviceProgress.status}
                      </span>
                    </div>
                  )}
                  {serviceProgress.start_time && (
                    <div>
                      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                        Waktu Mulai
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(serviceProgress.start_time).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  {serviceProgress.end_time && (
                    <div>
                      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                        Waktu Selesai
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(serviceProgress.end_time).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-900 italic">
                  Booking sudah di-assign ke mekanik. Menunggu mekanik memulai servis...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">
              Total Estimasi Harga
            </label>
            <div className="text-4xl font-extrabold text-gray-900 tracking-tight">
              <span className="text-3xl font-normal">Rp</span> {totalPrice.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <CancelButton
              bookingId={booking.id}
              currentSchedule={booking.schedule_start}
              status={booking.status}
            />
            <RescheduleButton
              bookingId={booking.id}
              currentSchedule={booking.schedule_start}
              status={booking.status}
            />
          </div>
        </div>

        {/* Gradient Bottom Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
      </div>
    </div>
  );
}
