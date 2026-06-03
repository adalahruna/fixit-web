import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RescheduleButton from '@/components/bookings/RescheduleButton';
import CancelButton from '@/components/bookings/CancelButton';
import RealtimeBookingStatus from '@/components/bookings/RealtimeBookingStatus';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';

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

  // Normalize service_progress to handle both array and object
  const serviceProgress = Array.isArray(booking.service_progress) 
    ? (booking.service_progress.length > 0 ? booking.service_progress[0] : null)
    : booking.service_progress;

  // Normalize assignments to handle both array and object
  const assignment = Array.isArray(booking.assignments)
    ? (booking.assignments.length > 0 ? booking.assignments[0] : null)
    : booking.assignments;

  // Calculate total price
  const totalPrice = booking.booking_services?.reduce((sum: number, bs: { service_type?: { price?: number } }) => {
    return sum + (bs.service_type?.price || 0);
  }, 0) || 0;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/customer/bookings"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-bold mb-8 transition-all hover:gap-3 duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Daftar Booking
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header - Enhanced Gradient Background */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-10 py-12 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex justify-between items-start">
            <div>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                <span className="text-white/90 text-xs font-bold uppercase tracking-wider">Detail Booking</span>
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">Informasi Lengkap</h1>
              <p className="text-xs font-mono tracking-widest text-blue-100 uppercase flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ID: #{booking.id.slice(0, 13)}
              </p>
            </div>
            <RealtimeBookingStatus
              bookingId={booking.id}
              initialStatus={booking.status}
            />
          </div>
        </div>

        {/* Grid Information - Enhanced */}
        <div className="grid md:grid-cols-2 gap-6 p-10">
          {/* Schedule Box */}
          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                  Jadwal Servis
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Tanggal</label>
                    <span className="block text-base font-bold text-gray-900">
                      {formatDateWIB(booking.schedule_start)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Waktu Mulai</label>
                    <span className="block text-base font-bold text-gray-900">
                      {formatTimeWIB(booking.schedule_start)} WIB
                    </span>
                  </div>
                </div>
                {booking.schedule_end && (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Est. Selesai</label>
                      <span className="block text-base font-bold text-gray-900">
                        {formatTimeWIB(booking.schedule_end)} WIB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Motorcycle Data Box */}
          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
                    <path d="M4 12c0-2.21.9-4.21 2.35-5.65L8 8l2-2-1.65-1.65C9.79 3.9 11.79 3 14 3c1.87 0 3.62.64 5 1.71L17 7l2-2 2.29 2.29C22.36 8.38 23 10.13 23 12c0 2.21-.9 4.21-2.35 5.65L19 16l-2 2 1.65 1.65C17.21 20.1 15.21 21 13 21c-1.87 0-3.62-.64-5-1.71L10 17l-2 2-2.29-2.29C4.64 15.62 4 13.87 4 12z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                  Data Kendaraan
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
                      <path d="M4 12c0-2.21.9-4.21 2.35-5.65L8 8l2-2-1.65-1.65C9.79 3.9 11.79 3 14 3c1.87 0 3.62.64 5 1.71L17 7l2-2 2.29 2.29C22.36 8.38 23 10.13 23 12c0 2.21-.9 4.21-2.35 5.65L19 16l-2 2 1.65 1.65C17.21 20.1 15.21 21 13 21c-1.87 0-3.62-.64-5-1.71L10 17l-2 2-2.29-2.29C4.64 15.62 4 13.87 4 12z"/>
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Merk & Model</label>
                    <span className="block text-base font-bold text-gray-900">
                      {booking.vehicle_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1">Nomor Polisi</label>
                    <span className="block text-base font-bold text-gray-900">
                      {booking.vehicle_plate}
                    </span>
                  </div>
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
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 space-y-4 border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                  Mekanik
                </label>
                <p className="text-base font-bold text-gray-900">
                  {assignment.mechanic.name}
                </p>
              </div>
              {serviceProgress ? (
                <>
                  {serviceProgress.status && (
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <span className={`inline-block px-4 py-2 text-xs font-bold rounded-xl uppercase shadow-sm ${
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
                      <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                        Waktu Mulai Servis
                      </label>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-bold text-gray-900">
                          {formatDateWIB(serviceProgress.start_time)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600 mt-1 ml-7">
                        {formatTimeWIB(serviceProgress.start_time)} WIB
                      </p>
                    </div>
                  )}
                  {serviceProgress.end_time && (
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                        Waktu Selesai Servis
                      </label>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-bold text-gray-900">
                          {formatDateWIB(serviceProgress.end_time)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-green-600 mt-1 ml-7">
                        {formatTimeWIB(serviceProgress.end_time)} WIB
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-blue-900 italic bg-blue-50 p-4 rounded-lg border border-blue-200">
                  ⏳ Booking sudah di-assign ke mekanik. Menunggu mekanik memulai servis...
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
