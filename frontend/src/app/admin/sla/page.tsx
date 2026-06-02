import { requireRole } from '@/lib/auth/utils';
import { calculateSLADelay } from '@/lib/utils/sla-calculation';
import { detectMechanicOverload } from '@/lib/utils/overload-detection';
import OverloadWarning from '@/components/warnings/OverloadWarning';
import Link from 'next/link';

interface SearchParams {
  startDate?: string;
  endDate?: string;
}

export default async function SLAMonitoringPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(['admin', 'owner']);

  const params = await searchParams;
  
  // Set default date range to last 7 days
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 7);
  
  const startDateStr = params.startDate || defaultStartDate.toISOString().split('T')[0];
  const endDateStr = params.endDate || defaultEndDate.toISOString().split('T')[0];
  
  // Get SLA data for the specified date range
  const slaReport = await calculateSLADelay(startDateStr, endDateStr);

  // Get overload detection data
  const overloadData = await detectMechanicOverload();

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Design */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">SLA & Overload Monitoring</h1>
              <p className="text-blue-100 mt-1">Real-time monitoring untuk performa layanan dan kapasitas mekanik</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-sm text-blue-100">Periode</div>
            <div className="text-lg font-semibold">{startDateStr} s/d {endDateStr}</div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Filter Tanggal
          </h2>
        </div>
        <div className="p-6">
        <form method="GET" className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDateStr}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Tanggal Akhir
            </label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDateStr}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            Filter
          </button>
        </form>
      </div>
    </div>

      {/* System Overload Warning */}
      <OverloadWarning showSystemWarning={true} />

      {/* SLA Summary Cards - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-blue-700 mb-2">
            {slaReport.onTimePercentage}%
          </div>
          <div className="text-sm font-semibold text-blue-800 mb-1">On-Time Rate</div>
          <div className="text-xs text-blue-700 bg-blue-200/50 rounded-full px-3 py-1 inline-block">
            {slaReport.onTimeBookings.length} dari {slaReport.totalBookings} booking
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-blue-700 mb-2">
            {slaReport.lateBookings.length}
          </div>
          <div className="text-sm font-semibold text-blue-800 mb-1">Booking Terlambat</div>
          <div className="text-xs text-blue-700 bg-blue-200/50 rounded-full px-3 py-1 inline-block">
            Rata-rata: {slaReport.averageDelayMinutes} menit
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-blue-700 mb-2">
            {slaReport.atRiskBookings.length}
          </div>
          <div className="text-sm font-semibold text-blue-800 mb-1">Booking Berisiko</div>
          <div className="text-xs text-blue-700 bg-blue-200/50 rounded-full px-3 py-1 inline-block">
            Perlu perhatian segera
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-blue-700 mb-2">
            {overloadData.overloadedCount}
          </div>
          <div className="text-sm font-semibold text-blue-800 mb-1">Mekanik Overload</div>
          <div className="text-xs text-blue-700 bg-blue-200/50 rounded-full px-3 py-1 inline-block">
            {overloadData.systemOverloadPercentage}% sistem overload
          </div>
        </div>
      </div>

      {/* Overloaded Mechanics */}
      {overloadData.overloadedMechanics.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Mekanik Overload - Perhatian Khusus Diperlukan
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Mekanik
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Beban Saat Ini
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Kapasitas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Persentase
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overloadData.overloadedMechanics.map((mechanic) => (
                  <tr key={mechanic.mechanicId} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{mechanic.mechanicName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-700">{mechanic.currentLoad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mechanic.maxCapacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full ${
                          mechanic.overloadPercentage >= 100 
                            ? 'bg-blue-200 text-blue-900 border-2 border-blue-400'
                            : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        }`}>
                          {mechanic.overloadPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold">
                          Queue: {mechanic.queuedBookings}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold">
                          Progress: {mechanic.inProgressBookings}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* At-Risk Bookings */}
      {slaReport.atRiskBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Booking Berisiko Terlambat
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Layanan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Jadwal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Target Selesai
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slaReport.atRiskBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{booking.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {booking.serviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(booking.scheduledStart)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-700">
                        {formatTime(booking.estimatedEnd)} WIB
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border-2 border-blue-300">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/admin/bookings/${booking.bookingId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-semibold"
                      >
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Late Bookings */}
      {slaReport.lateBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Booking Terlambat
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Layanan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Jadwal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Target Selesai
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Aktual Selesai
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Delay
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slaReport.lateBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{booking.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {booking.serviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(booking.scheduledStart)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(booking.estimatedEnd)} WIB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      {booking.actualEnd ? formatTime(booking.actualEnd) + ' WIB' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-full bg-blue-200 text-blue-900 border-2 border-blue-400">
                        +{booking.delayMinutes} menit
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/admin/bookings/${booking.bookingId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-semibold"
                      >
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {slaReport.atRiskBookings.length === 0 && slaReport.lateBookings.length === 0 && overloadData.overloadedCount === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-12 text-center border-2 border-blue-200">
          <div className="text-blue-500 mb-6">
            <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Semua Berjalan Lancar!</h3>
          <p className="text-lg text-gray-600 mb-2">
            Tidak ada booking yang terlambat atau berisiko, dan tidak ada mekanik yang overload.
          </p>
          <p className="text-sm text-gray-500">
            Sistem operasi bengkel berjalan dengan optimal. Keep up the good work!
          </p>
        </div>
      )}
    </div>
  );
}