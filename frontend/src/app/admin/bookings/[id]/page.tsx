import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AssignMechanicForm } from '@/components/assignments/AssignMechanicForm';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingStatus from '@/components/bookings/RealtimeBookingStatus';
import SLAWarning from '@/components/warnings/SLAWarning';
import OverloadWarning from '@/components/warnings/OverloadWarning';
import { getBookingSLAStatus } from '@/lib/utils/sla-calculation';

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'owner']);
  
  const { id } = await params;
  const supabase = await createClient();
  
  // Get booking detail
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey (
        name,
        email
      ),
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
        id,
        queue_position,
        mechanic:mechanics (
          id,
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
    .single();

  if (!booking) {
    notFound();
  }

  // Get all mechanics for assignment
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const isAssigned = booking.assignments && (Array.isArray(booking.assignments) ? booking.assignments.length > 0 : !!booking.assignments);
  const assignment = Array.isArray(booking.assignments) ? booking.assignments[0] : booking.assignments;
  
  // Check if booking is done
  const serviceProgress = Array.isArray(booking.service_progress) ? booking.service_progress[0] : booking.service_progress;
  const isDone = booking.status === 'done' || serviceProgress?.status === 'done';

  // Get SLA status for this booking
  const slaStatus = await getBookingSLAStatus(id);

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-bold mb-8 transition-all hover:gap-3 duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Daftar Booking
      </Link>

      {/* SLA Warning */}
      {slaStatus && (slaStatus.isLate || slaStatus.isAtRisk) && (
        <SLAWarning
          bookingId={slaStatus.bookingId}
          isLate={slaStatus.isLate}
          isAtRisk={slaStatus.isAtRisk}
          delayMinutes={slaStatus.delayMinutes}
          estimatedEnd={slaStatus.estimatedEnd}
          className="mb-6"
        />
      )}

      {/* Mechanic Overload Warning */}
      {assignment?.mechanic?.id && (
        <OverloadWarning mechanicId={assignment.mechanic.id} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header - Enhanced Gradient Background */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-10 py-12 text-white overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative flex justify-between items-start">
                <div>
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                    <span className="text-white/90 text-xs font-bold uppercase tracking-wider">Admin View</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-3 tracking-tight">Detail Booking</h1>
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

            {/* Content */}
            <div className="p-10 space-y-8">
              {/* Customer Info - Enhanced */}
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border border-green-200 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      Customer
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-semibold mb-1">Nama</label>
                        <span className="block text-base font-bold text-gray-900">
                          {booking.customer?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-semibold mb-1">Email</label>
                        <span className="block text-base font-bold text-gray-900">
                          {booking.customer?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Vehicle - Grid Layout */}
              <div className="grid md:grid-cols-2 gap-6">
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

                {/* Vehicle Box */}
                <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-7">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
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

              {/* Jenis Servis - Enhanced */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-extrabold text-gray-900">Jenis Servis</h3>
                  {booking.booking_services && booking.booking_services.length > 0 && (
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide">
                      {booking.booking_services.length} ITEMS
                    </span>
                  )}
                </div>

                {booking.booking_services && booking.booking_services.length > 0 ? (
                  <div className="space-y-4">
                    {booking.booking_services.map((bs: { service_type?: { name?: string; description?: string; default_duration_minutes?: number; price?: number } }, idx: number) => (
                      <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 rounded-2xl flex justify-between items-center hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                              {bs.service_type?.name}
                            </h4>
                            {bs.service_type?.description && (
                              <p className="text-xs text-gray-600">
                                {bs.service_type.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-8 text-right">
                          {bs.service_type?.default_duration_minutes && (
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Durasi
                              </label>
                              <span className="text-sm font-bold text-gray-900">
                                {bs.service_type.default_duration_minutes} min
                              </span>
                            </div>
                          )}
                          {bs.service_type?.price && (
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                    <p className="text-gray-500 italic">Tidak ada jenis servis dipilih (konsultasi)</p>
                  </div>
                )}
              </div>

              {/* Keluhan/Konsultasi - Enhanced */}
              {booking.booking_consultations && (
                (Array.isArray(booking.booking_consultations) && booking.booking_consultations.length > 0) ||
                (!Array.isArray(booking.booking_consultations) && booking.booking_consultations.complaint_text)
              ) && (
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Keluhan/Konsultasi Customer
                  </h3>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {Array.isArray(booking.booking_consultations)
                        ? booking.booking_consultations[0].complaint_text
                        : booking.booking_consultations.complaint_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Foto Keluhan - Enhanced */}
              {booking.complaint_photo_url && (
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Foto Keluhan
                  </h3>
                  <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={booking.complaint_photo_url} 
                      alt="Foto keluhan customer" 
                      className="w-full max-w-2xl mx-auto object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center italic">
                    📸 Foto diupload oleh customer saat membuat booking
                  </p>
                </div>
              )}
            </div>
            
            {/* Gradient Bottom Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
          </div>
        </div>

        {/* Sidebar - Assignment Enhanced */}
        <div className="lg:col-span-1">
          {/* Assignment Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">Assignment Mekanik</h2>
            </div>
            
            {isDone ? (
              /* Tiket Selesai - Show completion info */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-extrabold text-green-800 uppercase tracking-wide">Tiket Selesai</p>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Dikerjakan oleh</label>
                      <p className="text-gray-900 font-bold text-lg">
                        {assignment?.mechanic?.name || '-'}
                      </p>
                    </div>
                    {serviceProgress?.start_time && (
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Waktu Mulai</label>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTimeWIB(serviceProgress.start_time)} WIB
                        </p>
                      </div>
                    )}
                    {serviceProgress?.end_time && (
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Waktu Selesai</label>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTimeWIB(serviceProgress.end_time)} WIB
                        </p>
                      </div>
                    )}
                    {serviceProgress?.actual_duration && (
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Durasi Aktual</label>
                        <p className="text-sm font-semibold text-gray-900">
                          {serviceProgress.actual_duration} menit
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Tiket yang sudah selesai tidak dapat di-assign ulang
                    </p>
                  </div>
                </div>
              </div>
            ) : isAssigned ? (
              /* Already Assigned - Show reassign form */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-extrabold text-green-800 uppercase tracking-wide">Sudah Di-assign</p>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Mekanik</label>
                      <p className="text-gray-900 font-bold text-lg">{assignment?.mechanic?.name}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Posisi Queue</label>
                      <p className="text-sm font-semibold text-gray-900">
                        #{assignment?.queue_position}
                      </p>
                    </div>
                  </div>
                </div>
                <AssignMechanicForm 
                  bookingId={booking.id} 
                  currentMechanicId={assignment?.mechanic?.id}
                  mechanics={mechanics || []}
                  isAssigned={true}
                />
              </div>
            ) : (
              /* Not Assigned - Show assign form */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-extrabold text-yellow-800 uppercase tracking-wide">Belum Di-assign</p>
                  </div>
                  <p className="text-xs text-yellow-700 leading-relaxed">
                    Booking ini belum di-assign ke mekanik. Pilih mekanik di bawah untuk assign.
                  </p>
                </div>
                <AssignMechanicForm 
                  bookingId={booking.id}
                  mechanics={mechanics || []}
                  isAssigned={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
