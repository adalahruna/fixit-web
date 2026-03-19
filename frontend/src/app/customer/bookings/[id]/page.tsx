import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RescheduleButton from '@/components/bookings/RescheduleButton';
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
    .single();

  if (!booking) {
    notFound();
  }

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
            <RealtimeBookingStatus
              bookingId={booking.id}
              initialStatus={booking.status}
            />
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
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Keluhan/Konsultasi</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {booking.booking_consultations[0].complaint_text}
                </p>
              </div>
            </div>
          )}

          {/* Mekanik */}
          {booking.assignments && booking.assignments.length > 0 && booking.assignments[0].mechanic && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Mekanik</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-medium">Nama:</span> {booking.assignments[0].mechanic.name}
                </p>
              </div>
            </div>
          )}

          {/* Progress Info */}
          {booking.service_progress && booking.service_progress.length > 0 && booking.service_progress[0].start_time && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Progres Servis</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Mulai:</span>{' '}
                  {new Date(booking.service_progress[0].start_time).toLocaleString('id-ID')}
                </p>
                {booking.service_progress[0].end_time && (
                  <p className="text-gray-700">
                    <span className="font-medium">Selesai:</span>{' '}
                    {new Date(booking.service_progress[0].end_time).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reschedule Button */}
          <RescheduleButton
            bookingId={booking.id}
            currentSchedule={booking.schedule_start}
            status={booking.status}
          />
        </div>
      </div>
    </div>
  );
}
