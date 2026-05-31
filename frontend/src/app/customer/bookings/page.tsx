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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Booking Saya</h1>
        <div className="flex gap-3">
          <Link
            href="/customer/bookings?status=done"
            className="px-5 py-2.5 border-2 border-gray-900 text-gray-900 rounded-md font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            History Booking
          </Link>
          <Link
            href="/customer/bookings/new"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Book New Service
          </Link>
        </div>
      </div>

      <BookingFilters />

      {!bookings || bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-900 mb-6 text-lg">Belum ada booking.</p>
          <Link
            href="/customer/bookings/new"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Buat Booking Pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const hasNotes = booking.booking_consultations && booking.booking_consultations.length > 0;
            const notes = hasNotes ? booking.booking_consultations[0].complaint_text : null;
            
            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-8">
                  {/* Header: Vehicle Info & Status */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.72 2.03C12.5 2.01 12.26 2 12 2s-.5.01-.72.03C9.08 2.36 7.5 4.19 7.5 6.5v.5H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1.5v-.5c0-2.31-1.58-4.14-3.78-4.47zM16 9v10H8V9h8zm-7.5-2.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V7h-7v-.5z"/>
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                          {booking.vehicle_type}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                          {booking.vehicle_plate}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wide ${getStatusBadge(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  {/* Body: Schedule & Services */}
                  <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    {/* Schedule Info */}
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                            Jadwal Kedatangan
                          </label>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDateWIB(booking.schedule_start)} • {formatTimeWIB(booking.schedule_start)}
                          </div>
                        </div>
                      </div>
                      {booking.schedule_end && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                              Estimasi Selesai
                            </label>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatTimeWIB(booking.schedule_end)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Services Info */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                        Layanan Terpilih
                      </label>
                      {booking.booking_services && booking.booking_services.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {booking.booking_services.map((bs: { service_type?: { name?: string } }, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              {bs.service_type?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-block bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-semibold italic">
                          Konsultasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div className="bg-gray-50 rounded-lg p-5 mb-8">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Catatan/Keluhan:
                      </label>
                      <p className="text-sm text-gray-700 font-medium">
                        {notes}
                      </p>
                    </div>
                  )}

                  {/* Footer: Actions */}
                  <div className="border-t border-gray-100 pt-6 flex justify-end items-center gap-5">
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Reschedule
                    </Link>
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="px-5 py-2.5 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                    >
                      Detail Booking
                    </Link>
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
