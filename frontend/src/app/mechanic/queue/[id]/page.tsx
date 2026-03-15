import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function MechanicBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['mechanic']);
  
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user data from users table
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user?.id)
    .single();
  
  // Get mechanic data
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('name', userData?.name || '')
    .single();

  if (!mechanic) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Detail Booking</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <p className="text-yellow-800">
            Data mekanik tidak ditemukan. Hubungi admin untuk setup akun mekanik Anda.
          </p>
        </div>
      </div>
    );
  }

  // Get booking detail - only if assigned to this mechanic
  const { data: assignment } = await supabase
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
        service_progress (
          start_time,
          end_time,
          status
        )
      )
    `)
    .eq('booking_id', id)
    .eq('mechanic_id', mechanic.id)
    .single();

  if (!assignment) {
    notFound();
  }

  const booking = assignment.booking;
  const progress = booking.service_progress && booking.service_progress.length > 0 
    ? booking.service_progress[0] 
    : null;

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/mechanic/queue"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Kembali ke Antrian
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">Detail Booking</h1>
              <p className="text-purple-100">Queue Position: #{assignment.queue_position}</p>
            </div>
            {progress && (
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusBadge(progress.status)} text-gray-800`}>
                {getStatusLabel(progress.status)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Informasi Customer</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Nama:</span> {booking.customer?.name}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Email:</span> {booking.customer?.email}
              </p>
            </div>
          </div>

          {/* Jadwal */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Jadwal Servis</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Tanggal:</span>{' '}
                {new Date(booking.schedule_start).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Jam Mulai:</span>{' '}
                {new Date(booking.schedule_start).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {booking.schedule_end && (
                <p className="text-gray-700 mt-1">
                  <span className="font-medium">Estimasi Selesai:</span>{' '}
                  {new Date(booking.schedule_end).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Data Motor */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Data Motor</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Jenis Motor:</span> {booking.vehicle_type}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Plat Nomor:</span> {booking.vehicle_plate}
              </p>
            </div>
          </div>

          {/* Jenis Servis */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Jenis Servis</h2>
            {booking.booking_services && booking.booking_services.length > 0 ? (
              <div className="space-y-2">
                {booking.booking_services.map((bs: { service_type?: { name?: string; description?: string; default_duration_minutes?: number; price?: number } }, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{bs.service_type?.name}</p>
                    {bs.service_type?.description && (
                      <p className="text-sm text-gray-600 mt-1">{bs.service_type.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>Durasi: {bs.service_type?.default_duration_minutes} menit</span>
                      {bs.service_type?.price && (
                        <span>Harga: Rp {bs.service_type.price.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 italic">Tidak ada jenis servis dipilih (konsultasi)</p>
              </div>
            )}
          </div>

          {/* Keluhan/Konsultasi */}
          {booking.booking_consultations && booking.booking_consultations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Keluhan/Konsultasi Customer</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {booking.booking_consultations[0].complaint_text}
                </p>
              </div>
            </div>
          )}

          {/* Progress Info */}
          {progress && progress.start_time && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Progres Servis</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Mulai:</span>{' '}
                  {new Date(progress.start_time).toLocaleString('id-ID')}
                </p>
                {progress.end_time && (
                  <p className="text-gray-700">
                    <span className="font-medium">Selesai:</span>{' '}
                    {new Date(progress.end_time).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Coming Soon */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Fitur update progres (Start/Done) akan segera tersedia di Week 11.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
