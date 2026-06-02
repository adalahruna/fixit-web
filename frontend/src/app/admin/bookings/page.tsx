import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingList from '@/components/bookings/RealtimeBookingList';
import BookingFilters from '@/components/bookings/BookingFilters';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  const params = await searchParams;
  
  // Get mechanics for filter
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  
  // Build query with filters
  let query = supabase
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
          id,
          name
        )
      )
    `);

  // Apply filters
  if (params.status) {
    // Special handling for "unassigned" filter
    if (params.status === 'unassigned') {
      query = query.eq('status', 'pending');
    } else {
      query = query.eq('status', params.status);
    }
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

  const { data: bookings } = await query.order('schedule_start', { ascending: true });

  // Filter by mechanic on client side (because of nested relation)
  let filteredBookings = bookings || [];
  
  // Filter unassigned bookings if requested
  if (params.status === 'unassigned') {
    filteredBookings = filteredBookings.filter((booking) => {
      const hasAssignment = booking.assignments && (
        Array.isArray(booking.assignments) 
          ? booking.assignments.length > 0 
          : !!booking.assignments
      );
      return !hasAssignment && booking.status === 'pending';
    });
  }
  
  if (params.mechanicId) {
    filteredBookings = filteredBookings.filter((booking) => {
      const assignment = Array.isArray(booking.assignments) 
        ? booking.assignments[0] 
        : booking.assignments;
      return assignment?.mechanic?.id === params.mechanicId;
    });
  }
  
  // Sort unassigned bookings by created_at (oldest first = highest priority)
  if (params.status === 'unassigned') {
    filteredBookings.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }
  
  // Calculate stats
  const totalBookings = filteredBookings.length;
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
  const unassignedBookings = filteredBookings.filter(b => {
    const hasAssignment = b.assignments && (
      Array.isArray(b.assignments) ? b.assignments.length > 0 : !!b.assignments
    );
    return !hasAssignment && b.status === 'pending';
  }).length;
  const activeBookings = filteredBookings.filter(b => ['confirmed', 'queued', 'in_progress'].includes(b.status)).length;

  // Helper function to calculate wait time in minutes
  const getWaitTimeMinutes = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  };
  
  // Helper function to get wait time badge for unassigned bookings
  const getWaitTimeBadge = (booking: typeof filteredBookings[0]) => {
    const hasAssignment = booking.assignments && (
      Array.isArray(booking.assignments) 
        ? booking.assignments.length > 0 
        : !!booking.assignments
    );
    
    if (hasAssignment || booking.status !== 'pending') return null;
    
    const waitMinutes = getWaitTimeMinutes(booking.created_at);
    
    if (waitMinutes > 30) {
      return { color: 'bg-red-100 text-red-800 border-red-300', label: `🔴 ${waitMinutes} menit`, priority: 'high' };
    } else if (waitMinutes > 15) {
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: `⚠️ ${waitMinutes} menit`, priority: 'medium' };
    } else if (waitMinutes > 0) {
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: `${waitMinutes} menit`, priority: 'low' };
    }
    
    return null;
  };

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

  const getPriorityBadge = (priority: number) => {
    const styles: Record<number, { bg: string; text: string; label: string; icon: string }> = {
      1: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent', icon: '🔥' },
      2: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High', icon: '⚡' },
      3: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal', icon: '📋' },
      4: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low', icon: '📌' },
    };
    return styles[priority] || styles[3];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <RealtimeBookingList />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Manajemen Booking
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Kelola Booking</h1>
          <p className="text-gray-600">Monitor dan kelola semua booking servis motor</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Bookings Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{totalBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Booking</h3>
              <p className="text-xs text-gray-500">Sesuai filter</p>
            </div>
          </div>

          {/* Pending Bookings Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{pendingBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Pending</h3>
              <p className="text-xs text-gray-500">Menunggu konfirmasi</p>
            </div>
          </div>

          {/* Unassigned Bookings Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-red-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{unassignedBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Belum Ditugaskan</h3>
              <p className="text-xs text-gray-500">Perlu assign mekanik</p>
            </div>
          </div>

          {/* Active Bookings Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{activeBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Aktif</h3>
              <p className="text-xs text-gray-500">Sedang dikerjakan</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <BookingFilters showMechanicFilter={true} mechanics={mechanics || []} />
        </div>

        {/* Bookings List */}
        {!filteredBookings || filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-xl text-center border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {params.status || params.search || params.dateFrom || params.dateTo || params.mechanicId
                  ? 'Tidak Ada Booking yang Sesuai'
                  : 'Belum Ada Booking'}
              </h3>
              <p className="text-gray-600">
                {params.status || params.search || params.dateFrom || params.dateTo || params.mechanicId
                  ? 'Coba ubah filter untuk melihat booking lainnya'
                  : 'Booking akan muncul di sini ketika ada customer yang membuat booking'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Prioritas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Motor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Jadwal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Mekanik
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const waitTimeBadge = getWaitTimeBadge(booking);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {waitTimeBadge ? (
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${waitTimeBadge.color}`}>
                              {waitTimeBadge.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold">
                              {booking.customer?.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {booking.customer?.name}
                              </div>
                              <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{booking.vehicle_type}</div>
                              <div className="text-sm text-gray-500 font-mono">{booking.vehicle_plate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <div className="text-gray-900 font-medium">
                                {formatDateWIB(booking.schedule_start).split(',')[0]}
                              </div>
                              <div className="text-gray-500">
                                {formatTimeWIB(booking.schedule_start)} WIB
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            {(() => {
                              const priorityInfo = getPriorityBadge(booking.priority || 3);
                              return (
                                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${priorityInfo.bg} ${priorityInfo.text}`}>
                                  {priorityInfo.icon} {priorityInfo.label}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.assignments && (Array.isArray(booking.assignments) 
                            ? (booking.assignments.length > 0 && (
                                <div className="flex items-center text-sm">
                                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="font-medium text-gray-900">{booking.assignments[0].mechanic?.name}</span>
                                </div>
                              ))
                            : (booking.assignments.mechanic?.name && (
                                <div className="flex items-center text-sm">
                                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="font-medium text-gray-900">{booking.assignments.mechanic?.name}</span>
                                </div>
                              ))
                          ) || <span className="text-sm text-gray-400 italic">Belum ditugaskan</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
