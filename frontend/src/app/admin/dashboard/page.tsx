import { requireRole } from '@/lib/auth/utils';
import { calculateKPIMetrics } from '@/lib/kpi/calculations';

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
        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Completed: {kpiData.completedBookings} | Cancelled: {kpiData.cancelledBookings}
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className={`text-2xl font-bold ${getStatusColor(kpiData.onTimeCompletionRate, { good: 90, warning: 75 })}`}>
                {kpiData.onTimeCompletionRate}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Target: ≥90% (Good), ≥75% (Warning)
          </div>
        </div>

        {/* Average Service Time */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Avg Service Time</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.averageServiceTime} min</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Based on {kpiData.completedBookings} completed services
          </div>
        </div>

        {/* Mechanic Utilization */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Mechanic Utilization</p>
              <p className={`text-2xl font-bold ${getStatusColor(kpiData.mechanicUtilization, { good: 70, warning: 50 })}`}>
                {kpiData.mechanicUtilization}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Target: ≥70% (Good), ≥50% (Warning)
          </div>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <span className="text-gray-600">Revenue per Completed Booking:</span>
              <span className="font-semibold">
                {kpiData.completedBookings > 0 
                  ? formatCurrency(kpiData.totalRevenue / kpiData.completedBookings)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>

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
              <span className="text-gray-600">Cancellation Rate:</span>
              <span className={`font-semibold ${
                kpiData.totalBookings > 0 && (kpiData.cancelledBookings / kpiData.totalBookings) * 100 > 10
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {kpiData.totalBookings > 0 
                  ? Math.round((kpiData.cancelledBookings / kpiData.totalBookings) * 100)
                  : 0
                }%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Satisfaction:</span>
              <span className="font-semibold text-blue-600">{kpiData.customerSatisfactionRate}%</span>
              <span className="text-xs text-gray-400">(Placeholder)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Booking Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Daily Booking Trend</h3>
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-full">
            {kpiData.dailyBookingTrend.map((day, index) => {
              const maxCount = Math.max(...kpiData.dailyBookingTrend.map(d => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center min-w-0 flex-1">
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: '100px' }}>
                    <div 
                      className="w-full bg-blue-500 rounded-t flex items-end justify-center text-white text-xs font-semibold"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '20px' : '0' }}
                    >
                      {day.count > 0 && day.count}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                    {new Date(day.date).toLocaleDateString('id-ID', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Booking Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{kpiData.completedBookings}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{kpiData.pendingBookings}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{kpiData.cancelledBookings}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{kpiData.totalBookings}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}