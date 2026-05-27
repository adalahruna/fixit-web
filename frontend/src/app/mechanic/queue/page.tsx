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

  const { data: assignments } = await query.order('queue_position', { ascending: true });

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
    <div>
      <RealtimeBookingList />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Antrian Saya</h1>
        <div className="text-sm text-gray-600">
          Mekanik: <span className="font-medium">{mechanic.name}</span>
        </div>
      </div>

      <BookingFilters />

      {!filteredAssignments || filteredAssignments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          {params.status || params.search || params.dateFrom || params.dateTo
            ? 'Tidak ada booking yang sesuai dengan filter.'
            : 'Belum ada booking dalam antrian Anda.'}
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
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Queue #{assignment.queue_position}
                      </span>
                      {progress && progress.status && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(progress.status)}`}>
                          {getStatusLabel(progress.status)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.vehicle_type}
                    </h3>
                    <p className="text-sm text-gray-600">{booking.vehicle_plate}</p>
                  </div>
                  <Link
                    href={`/mechanic/queue/${booking.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Detail →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">{booking.customer?.name}</p>
                  </div>

                  <div>
                    <span className="text-gray-600">Jadwal:</span>
                    <p className="font-medium">
                      {new Date(booking.schedule_start).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      {new Date(booking.schedule_start).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-600">Jenis Servis:</span>
                    {booking.booking_services && booking.booking_services.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {booking.booking_services.map((bs: { service_type?: { name?: string } }, idx: number) => (
                          <li key={idx} className="text-sm">
                            {bs.service_type?.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Konsultasi</p>
                    )}
                  </div>

                  {booking.booking_consultations && booking.booking_consultations.length > 0 && (
                    <div>
                      <span className="text-gray-600">Keluhan:</span>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {booking.booking_consultations[0].complaint_text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
