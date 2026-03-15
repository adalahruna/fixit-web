import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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
        consultation_text,
        created_at
      ),
      mechanic:mechanics (
        name
      )
    `)
    .eq('id', id)
    .eq('customer_id', user?.id)
    .single();

  if (!booking) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      QUEUED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      DONE: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Menunggu Konfirmasi',
      CONFIRMED: 'Dikonfirmasi',
      QUEUED: 'Dalam Antrian',
      IN_PROGRESS: 'Sedang Dikerjakan',
      DONE: 'Selesai',
      CANCELLED: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/customer/bookings"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Kembali ke Daftar Booking
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">Detail Booking</h1>
              <p className="text-blue-100">ID: {booking.id.slice(0, 8)}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusBadge(booking.status)} text-gray-800`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Jadwal */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Jadwal Servis</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Tanggal:</span>{' '}
                {new Date(booking.scheduled_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Jam:</span>{' '}
                {new Date(booking.scheduled_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {booking.estimated_duration_minutes && (
                <p className="text-gray-700 mt-1">
                  <span className="font-medium">Estimasi Durasi:</span>{' '}
                  {booking.estimated_duration_minutes} menit
                </p>
              )}
            </div>
          </div>

          {/* Data Motor */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Data Motor</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Merk:</span> {booking.motorcycle_brand}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Model:</span> {booking.motorcycle_model}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Plat Nomor:</span> {booking.motorcycle_plate}
              </p>
            </div>
          </div>

          {/* Jenis Servis */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Jenis Servis</h2>
            {booking.booking_services && booking.booking_services.length > 0 ? (
              <div className="space-y-2">
                {booking.booking_services.map((bs: any, idx: number) => (
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
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Keluhan/Konsultasi</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {booking.booking_consultations[0].consultation_text}
                </p>
              </div>
            </div>
          )}

          {/* Mekanik */}
          {booking.mechanic && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Mekanik</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-medium">Nama:</span> {booking.mechanic.name}
                </p>
              </div>
            </div>
          )}

          {/* Progress Info */}
          {booking.actual_start_time && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Progres Servis</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Mulai:</span>{' '}
                  {new Date(booking.actual_start_time).toLocaleString('id-ID')}
                </p>
                {booking.actual_finish_time && (
                  <p className="text-gray-700">
                    <span className="font-medium">Selesai:</span>{' '}
                    {new Date(booking.actual_finish_time).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
