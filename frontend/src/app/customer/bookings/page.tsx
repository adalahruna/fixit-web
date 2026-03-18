import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';

export default async function BookingsPage() {
  await requireRole(['customer']);
  
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get bookings for current customer
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      booking_services (
        service_type:service_types (
          name
        )
      )
    `)
    .eq('customer_id', user?.id)
    .order('schedule_start', { ascending: false });

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      queued: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-green-100 text-green-800',
      done: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      queued: 'Dalam Antrian',
      in_progress: 'Sedang Dikerjakan',
      done: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  return (
    <div>
      <RealtimeBookingList />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Booking Saya</h1>
        <Link
          href="/customer/bookings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Buat Booking
        </Link>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">Belum ada booking.</p>
          <Link
            href="/customer/bookings/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Buat Booking Pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {booking.vehicle_type}
                  </h3>
                  <p className="text-sm text-gray-600">{booking.vehicle_plate}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Jadwal:</span>
                  <p className="font-medium">
                    {formatDateWIB(booking.schedule_start)}
                  </p>
                  <p className="font-medium">
                    {formatTimeWIB(booking.schedule_start)} WIB
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
              </div>

              {booking.schedule_end && (
                <div className="mt-3 text-sm text-gray-600">
                  Estimasi selesai: {formatTimeWIB(booking.schedule_end)} WIB
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
