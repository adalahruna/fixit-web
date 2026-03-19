import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';

export default async function AdminBookingsPage() {
  await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get all bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
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
      assignments (
        mechanic:mechanics (
          name
        )
      )
    `)
    .order('schedule_start', { ascending: true });

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
      <h1 className="text-3xl font-bold mb-6">Kelola Booking</h1>

      {!bookings || bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Belum ada booking.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Motor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jadwal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mekanik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer?.name}
                    </div>
                    <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.vehicle_type}</div>
                    <div className="text-sm text-gray-500">{booking.vehicle_plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateWIB(booking.schedule_start).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeWIB(booking.schedule_start)} WIB
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.assignments && (Array.isArray(booking.assignments) 
                      ? (booking.assignments.length > 0 && booking.assignments[0].mechanic?.name)
                      : booking.assignments.mechanic?.name) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
