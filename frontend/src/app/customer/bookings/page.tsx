import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';
import BookingFilters from '@/components/bookings/BookingFilters';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(['customer']);
  
  const supabase = await createClient();
  const params = await searchParams;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Build query with filters
  let query = supabase
    .from('bookings')
    .select(`
      *,
      booking_services (
        service_type:service_types (
          name
        )
      ),
      booking_consultations (
        complaint_text
      )
    `)
    .eq('customer_id', user?.id);

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.search) {
    query = query.or(`vehicle_plate.ilike.%${params.search}%,vehicle_type.ilike.%${params.search}%`);
  }

  if (params.dateFrom) {
    query = query.gte('schedule_start', new Date(params.dateFrom as string).toISOString());
  }

  if (params.dateTo) {
    const dateTo = new Date(params.dateTo as string);
    dateTo.setHours(23, 59, 59, 999);
    query = query.lte('schedule_start', dateTo.toISOString());
  }

  const { data: bookings } = await query.order('schedule_start', { ascending: false });

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      queued: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-green-100 text-green-700',
      done: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'MENUNGGU',
      confirmed: 'DIKONFIRMASI',
      queued: 'DALAM ANTRIAN',
      in_progress: 'SEDANG DIKERJAKAN',
      done: 'SELESAI',
      cancelled: 'DIBATALKAN',
    };
    return labels[status] || status.toUpperCase();
  };

  return (
    <div>
      <RealtimeBookingList />
      
      {/* Enhanced Header with Gradient Background */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 mb-8 overflow-hidden shadow-2xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
              <span className="text-white/90 text-xs font-bold uppercase tracking-wider">Dashboard Booking</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Booking Saya</h1>
            <p className="text-blue-100 text-sm">Kelola semua booking servis motor Anda dengan mudah</p>
          </div>
          <Link
            href="/customer/bookings/new"
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all duration-200 shadow-2xl shadow-black/20 flex items-center gap-2 hover:scale-105 transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Booking Baru
          </Link>
        </div>
      </div>

      <BookingFilters />

      {!bookings || bookings.length === 0 ? (
        <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 p-16 rounded-3xl shadow-sm text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 rounded-full opacity-30 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100 rounded-full opacity-30 translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Belum Ada Booking</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Mulai perjalanan servis motor Anda dengan membuat booking pertama. Mudah, cepat, dan terpercaya!
            </p>
            <Link
              href="/customer/bookings/new"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold transition-all duration-200 shadow-xl shadow-blue-600/30 hover:scale-105 transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Booking Pertama
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const hasNotes = booking.booking_consultations && booking.booking_consultations.length > 0;
            const notes = hasNotes ? booking.booking_consultations[0].complaint_text : null;
            
            return (
              <div
                key={booking.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="p-8">
                  {/* Header: Vehicle Info & Status */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
                            <path d="M4 12c0-2.21.9-4.21 2.35-5.65L8 8l2-2-1.65-1.65C9.79 3.9 11.79 3 14 3c1.87 0 3.62.64 5 1.71L17 7l2-2 2.29 2.29C22.36 8.38 23 10.13 23 12c0 2.21-.9 4.21-2.35 5.65L19 16l-2 2 1.65 1.65C17.21 20.1 15.21 21 13 21c-1.87 0-3.62-.64-5-1.71L10 17l-2 2-2.29-2.29C4.64 15.62 4 13.87 4 12z"/>
                          </svg>
                        </div>
                        {/* Decorative dot */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                          {booking.vehicle_type}
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {booking.vehicle_plate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-4 py-2 text-xs font-bold rounded-xl uppercase tracking-wide shadow-sm ${getStatusBadge(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  {/* Body: Schedule & Services */}
                  <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    {/* Schedule Info */}
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Jadwal Kedatangan
                          </label>
                          <div className="text-sm font-bold text-gray-900">
                            {formatDateWIB(booking.schedule_start)}
                          </div>
                          <div className="text-sm font-semibold text-blue-600 mt-0.5">
                            {formatTimeWIB(booking.schedule_start)} WIB
                          </div>
                        </div>
                      </div>
                      {booking.schedule_end && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                              Estimasi Selesai
                            </label>
                            <div className="text-sm font-bold text-gray-900">
                              {formatTimeWIB(booking.schedule_end)} WIB
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Services Info */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Layanan Terpilih
                      </label>
                      {booking.booking_services && booking.booking_services.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {booking.booking_services.map((bs: { service_type?: { name?: string } }, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold border border-blue-200"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                              </svg>
                              {bs.service_type?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-xs font-semibold italic border border-gray-200">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Konsultasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                            Catatan/Keluhan
                          </label>
                          <p className="text-sm text-amber-900 font-medium leading-relaxed">
                            {notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer: Actions */}
                  <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium">ID: {booking.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/customer/bookings/${booking.id}`}
                        className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Reschedule
                      </Link>
                      <Link
                        href={`/customer/bookings/${booking.id}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:scale-105 transform"
                      >
                        Lihat Detail
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
