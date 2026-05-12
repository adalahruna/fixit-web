import { requireRole } from '@/lib/auth/utils';
import { calculateKPIMetrics } from '@/lib/kpi/calculations';
import KPICard from '@/components/dashboard/KPICard';
import ChartCard, { SimpleBarChart, DonutChart } from '@/components/dashboard/ChartCard';
import QuickNavigation, { adminNavigationItems } from '@/components/dashboard/QuickNavigation';

interface SearchParams {
  startDate?: string;
  endDate?: string;
}

export default async function KPIDashboardPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await requireRole(['admin', 'owner']);

  const kpiData = await calculateKPIMetrics(
    searchParams.startDate,
    searchParams.endDate
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">KPI Dashboard</h1>
      </div>

      {/* Quick Navigation */}
      <QuickNavigation 
        items={adminNavigationItems}
        title="Menu Utama"
      />

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form method="GET" className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={searchParams.startDate || ''}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              defaultValue={searchParams.endDate || ''}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Update
          </button>
        </form>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Bookings"
          value={kpiData.totalBookings}
          subtitle={`Completed: ${kpiData.completedBookings} | Cancelled: ${kpiData.cancelledBookings}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />

        <KPICard
          title="On-Time Rate"
          value={`${kpiData.onTimeCompletionRate}%`}
          subtitle="Target: ≥90% (Good), ≥75% (Warning)"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color={kpiData.onTimeCompletionRate >= 90 ? "green" : kpiData.onTimeCompletionRate >= 75 ? "orange" : "red"}
        />

        <KPICard
          title="Avg Service Time"
          value={`${kpiData.averageServiceTime} min`}
          subtitle={`Based on ${kpiData.completedBookings} completed services`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="purple"
        />

        <KPICard
          title="Mechanic Utilization"
          value={`${kpiData.mechanicUtilization}%`}
          subtitle="Target: ≥70% (Good), ≥50% (Warning)"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color={kpiData.mechanicUtilization >= 70 ? "green" : kpiData.mechanicUtilization >= 50 ? "orange" : "red"}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <ChartCard title="Booking Status Distribution">
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
        <ChartCard title="Service Type Performance">
          <SimpleBarChart 
            data={kpiData.serviceTypeDistribution.map(service => ({
              label: service.name,
              value: service.count,
              color: 'bg-blue-500'
            }))}
          />
        </ChartCard>

        {/* Mechanic Performance */}
        <ChartCard title="Mechanic Performance">
          <SimpleBarChart 
            data={kpiData.mechanicPerformance.map(mechanic => ({
              label: mechanic.name,
              value: mechanic.completedJobs,
              color: 'bg-green-500'
            }))}
          />
        </ChartCard>

        {/* Weekly Trend */}
        <ChartCard title="Weekly Booking Trend">
          <SimpleBarChart 
            data={kpiData.weeklyTrend.map(week => ({
              label: week.week,
              value: week.bookings,
              color: 'bg-purple-500'
            }))}
          />
        </ChartCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-semibold">{formatCurrency(kpiData.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Booking Value:</span>
              <span className="font-semibold">{formatCurrency(kpiData.averageBookingValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue per Completed:</span>
              <span className="font-semibold">
                {kpiData.completedBookings > 0 
                  ? formatCurrency(kpiData.totalRevenue / kpiData.completedBookings)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>

        {/* Service Quality */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Service Quality</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Completion Rate:</span>
              <span className={`font-semibold ${getStatusColor(
                kpiData.totalBookings > 0 ? (kpiData.completedBookings / kpiData.totalBookings) * 100 : 0,
                { good: 85, warning: 70 }
              )}`}>
                {kpiData.totalBookings > 0 
                  ? Math.round((kpiData.completedBookings / kpiData.totalBookings) * 100)
                  : 0
                }%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reschedule Rate:</span>
              <span className="font-semibold text-orange-600">{kpiData.rescheduleRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Wait Time:</span>
              <span className="font-semibold">{kpiData.averageWaitTime} min</span>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
          <div className="space-y-3">
            {kpiData.peakHours.map((peak, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {peak.hour}:00 - {peak.hour + 1}:00
                </span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(peak.load / Math.max(...kpiData.peakHours.map(p => p.load))) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{peak.load}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}