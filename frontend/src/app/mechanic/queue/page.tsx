import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';
import BookingFilters from '@/components/bookings/BookingFilters';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MechanicQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(['mechanic']);
  
  const supabase = await createClient();
  const params = await searchParams;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get mechanic data by user_id (proper relation)
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name, user_id')
    .eq('user_id', user?.id)
    .single();

  if (!mechanic) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Antrian Saya</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Data Mekanik Tidak Ditemukan</h3>
          <p className="text-yellow-700 mb-4">
            Akun Anda belum terhubung dengan data mekanik. Ini bisa terjadi karena:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mb-4 space-y-1">
            <li>Admin belum membuat data mekanik untuk akun Anda</li>
            <li>Nama di akun user tidak sama dengan nama di data mekanik</li>
            <li>Relasi antara user dan mekanik belum diatur dengan benar</li>
          </ul>
          <p className="text-yellow-800 font-medium">
            Hubungi admin untuk menghubungkan akun Anda dengan data mekanik.
          </p>
        </div>
      </div>
    );
  }

  // Build query for assignments with filters
  const query = supabase
    .from('assignments')
    .select(`
      *,
      booking:bookings (
        *,
        customer:users!bookings_customer_id_fkey (
          name,
          email
        ),
        booking_services (
          service_type:service_types (
            name
          )
        ),
        booking_consultations (
          complaint_text
        ),
        service_progress (
          status,
          start_time,
          end_time
        )
      )
    `)
    .eq('mechanic_id', mechanic.id);

  const { data: assignmentsRaw } = await query;
  
  // Sort by queue_position
  const assignments = assignmentsRaw?.sort((a, b) => {
    return a.queue_position - b.queue_position;
  });

  // Apply filters on client side (because of nested relations)
  let filteredAssignments = assignments || [];

  if (params.status) {
    filteredAssignments = filteredAssignments.filter((assignment) => {
      const booking = assignment.booking;
      const progress = booking?.service_progress?.[0];
      
      // Map booking status to progress status for filtering
      if (params.status === 'queued') {
        return progress?.status === 'queued' || booking?.status === 'confirmed';
      }
      if (params.status === 'in_progress') {
        return progress?.status === 'in_progress' || booking?.status === 'in_progress';
      }
      if (params.status === 'done') {
        return progress?.status === 'done' || booking?.status === 'done';
      }
      return booking?.status === params.status;
    });
  }

  if (params.search) {
    const searchLower = (params.search as string).toLowerCase();
    filteredAssignments = filteredAssignments.filter((assignment) => {
      const booking = assignment.booking;
      return (
        booking?.vehicle_plate?.toLowerCase().includes(searchLower) ||
        booking?.vehicle_type?.toLowerCase().includes(searchLower) ||
        booking?.customer?.name?.toLowerCase().includes(searchLower)
      );
    });
  }

  if (params.dateFrom) {
    const dateFrom = new Date(params.dateFrom as string);
    filteredAssignments = filteredAssignments.filter((assignment) => {
      const scheduleStart = new Date(assignment.booking?.schedule_start);
      return scheduleStart >= dateFrom;
    });
  }

  if (params.dateTo) {
    const dateTo = new Date(params.dateTo as string);
    dateTo.setHours(23, 59, 59, 999);
    filteredAssignments = filteredAssignments.filter((assignment) => {
      const scheduleStart = new Date(assignment.booking?.schedule_start);
      return scheduleStart <= dateTo;
    });
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      queued: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-green-100 text-green-800',
      done: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      queued: 'Dalam Antrian',
      in_progress: 'Sedang Dikerjakan',
      done: 'Selesai',
      paused: 'Dijeda',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <RealtimeBookingList />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-2 4h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Antrian Kerja</h1>
                <p className="text-blue-100 mt-1">Mekanik: {mechanic.name}</p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-blue-100 text-sm">Total Motor</p>
              <p className="text-3xl font-bold text-white">{filteredAssignments.length}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <BookingFilters showPriorityFilter={false} />
        </div>

        {/* Queue List */}
        {!filteredAssignments || filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {params.status || params.search || params.dateFrom || params.dateTo
                  ? 'Tidak Ada Hasil'
                  : 'Tidak Ada Antrian'}
              </h3>
              <p className="text-gray-600">
                {params.status || params.search || params.dateFrom || params.dateTo
                  ? 'Tidak ada motor yang sesuai dengan filter yang dipilih.'
                  : 'Belum ada motor dalam antrian Anda saat ini.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment: {
              id: string;
              queue_position: number;
              booking: {
                id: string;
                vehicle_type: string;
                vehicle_plate: string;
                schedule_start: string;
                priority?: number;
                customer?: { name?: string };
                booking_services?: Array<{ service_type?: { name?: string } }>;
                booking_consultations?: Array<{ complaint_text?: string }>;
                service_progress?: Array<{ status?: string }>;
              };
            }) => {
              const booking = assignment.booking;
              const progress = booking.service_progress && booking.service_progress.length > 0 
                ? booking.service_progress[0] 
                : null;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    {/* Header with Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          #{assignment.queue_position}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.vehicle_type}
                          </h3>
                          <p className="text-sm text-gray-600 font-mono font-semibold">{booking.vehicle_plate}</p>
                        </div>
                      </div>
                      {progress && progress.status && (
                        <span className={`px-4 py-2 text-sm font-semibold rounded-xl ${getStatusBadge(progress.status)}`}>
                          {getStatusLabel(progress.status)}
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Customer</p>
                          <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Jadwal</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(booking.schedule_start).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {' '}
                            {new Date(booking.schedule_start).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Jenis Servis</p>
                          {booking.booking_services && booking.booking_services.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {booking.booking_services.map((bs: { service_type?: { name?: string } }, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                                  {bs.service_type?.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Konsultasi</p>
                          )}
                        </div>
                      </div>

                      {booking.booking_consultations && booking.booking_consultations.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Keluhan</p>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {booking.booking_consultations[0].complaint_text}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-gray-100">
                      <Link
                        href={`/mechanic/queue/${booking.id}`}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Lihat Detail & Mulai Kerja
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
