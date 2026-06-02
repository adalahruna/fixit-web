import { requireRole } from '@/lib/auth/utils';
import { calculateKPIMetrics } from '@/lib/kpi/calculations';
import KPICard from '@/components/dashboard/KPICard';
import ChartCard, { SimpleBarChart, DonutChart } from '@/components/dashboard/ChartCard';

interface SearchParams {
  startDate?: string;
  endDate?: string;
}

export default async function KPIDashboardPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(['admin', 'owner']);

  const params = await searchParams;
  const kpiData = await calculateKPIMetrics(
    params.startDate,
    params.endDate
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Design */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dasbor KPI</h1>
              <p className="text-blue-100 mt-1">Analitik & Pemantauan Kinerja</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <div className="text-sm text-blue-100 mb-1">Total Booking</div>
            <div className="text-3xl font-extrabold">{kpiData.totalBookings.toLocaleString()}</div>
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
            Filter Periode
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
                defaultValue={params.startDate || ''}
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
                defaultValue={params.endDate || ''}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Perbarui
            </button>
          </form>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Booking"
          value={kpiData.totalBookings}
          subtitle={`Selesai: ${kpiData.completedBookings} | Batal: ${kpiData.cancelledBookings} | Aktif: ${kpiData.pendingBookings}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />

        <KPICard
          title="Tingkat Ketepatan Waktu"
          value={`${kpiData.onTimeCompletionRate}%`}
          subtitle="Target: ≥90% (Baik), ≥75% (Peringatan)"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="blue"
        />

        <KPICard
          title="Rata-rata Waktu Servis"
          value={`${kpiData.averageServiceTime} menit`}
          subtitle={`Berdasarkan ${kpiData.completedBookings} servis selesai`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="blue"
        />

        <KPICard
          title="Utilisasi Mekanik"
          value={`${kpiData.mechanicUtilization}%`}
          subtitle="Target: ≥70% (Baik), ≥50% (Peringatan)"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <ChartCard title="Distribusi Status Booking">
          <DonutChart 
            data={kpiData.bookingsByStatus.map(item => ({
              label: item.status,
              value: item.count,
              color: item.color
            }))}
            centerText={`${kpiData.totalBookings}`}
          />
        </ChartCard>

        {/* Service Type Performance */}
        <ChartCard title="Performa Tipe Layanan">
          <SimpleBarChart 
            data={kpiData.serviceTypeDistribution.map(service => ({
              label: service.name,
              value: service.count,
              color: 'bg-blue-500'
            }))}
          />
        </ChartCard>

        {/* Mechanic Performance */}
        <ChartCard title="Performa Mekanik">
          <SimpleBarChart 
            data={kpiData.mechanicPerformance.map(mechanic => ({
              label: mechanic.name,
              value: mechanic.completedJobs,
              color: 'bg-blue-500'
            }))}
          />
        </ChartCard>

        {/* Weekly Trend */}
        <ChartCard title="Tren Booking Mingguan">
          <SimpleBarChart 
            data={kpiData.weeklyTrend.map(week => ({
              label: week.week,
              value: week.bookings,
              color: 'bg-blue-500'
            }))}
          />
        </ChartCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full mr-3 shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900">Ringkasan Pendapatan</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Total Pendapatan:</span>
              <span className="font-bold text-blue-700">{formatCurrency(kpiData.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Rata-rata Nilai Booking:</span>
              <span className="font-bold text-blue-700">{formatCurrency(kpiData.averageBookingValue)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Pendapatan per Selesai:</span>
              <span className="font-bold text-blue-700">
                {kpiData.completedBookings > 0 
                  ? formatCurrency(kpiData.totalRevenue / kpiData.completedBookings)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>

        {/* Service Quality */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full mr-3 shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900">Kualitas Layanan</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Tingkat Penyelesaian:</span>
              <span className="font-bold text-blue-700">
                {kpiData.totalBookings > 0 
                  ? Math.round((kpiData.completedBookings / kpiData.totalBookings) * 100)
                  : 0
                }%
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Tingkat Reschedule:</span>
              <span className="font-bold text-blue-700">{kpiData.rescheduleRate}%</span>
            </div>
            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
              <span className="text-sm font-semibold text-blue-800">Rata-rata Waktu Tunggu:</span>
              <span className="font-bold text-blue-700">{kpiData.averageWaitTime} menit</span>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full mr-3 shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900">Jam Sibuk</h3>
          </div>
          <div className="space-y-3">
            {kpiData.peakHours.map((peak, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-blue-800">
                    {peak.hour}:00 - {peak.hour + 1}:00
                  </span>
                  <span className="text-sm font-bold text-blue-700">{peak.load}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(peak.load / Math.max(...kpiData.peakHours.map(p => p.load))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}