import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';

export default async function MechanicQueuePage() {
  await requireRole(['mechanic']);
  
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user data from users table
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user?.id)
    .single();
  
  // Get mechanic data by matching user name
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('name', userData?.name || '')
    .single();

  if (!mechanic) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Antrian Saya</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <p className="text-yellow-800">
            Data mekanik tidak ditemukan. Hubungi admin untuk setup akun mekanik Anda.
          </p>
        </div>
      </div>
    );
  }

  // Get queue/assignments for this mechanic
  const { data: assignments } = await supabase
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
    .eq('mechanic_id', mechanic.id)
    .order('queue_position', { ascending: true });

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
      <h1 className="text-3xl font-bold mb-6">Antrian Saya</h1>

      {!assignments || assignments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Belum ada booking dalam antrian Anda.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: {
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
