import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import QuickNavigation, { adminNavigationItems } from '@/components/dashboard/QuickNavigation';

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get pending bookings count
  const { count: pendingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Add badge to booking management if there are pending bookings
  const navigationItems = adminNavigationItems.map(item => {
    if (item.href === '/admin/bookings' && pendingCount && pendingCount > 0) {
      return {
        ...item,
        badge: `${pendingCount} pending`
      };
    }
    return item;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Selamat datang, {user.name}!</h2>
        <p className="text-gray-600">
          Kelola bengkel Anda dengan mudah melalui menu-menu di bawah ini.
        </p>
      </div>

      {/* Quick Navigation */}
      <QuickNavigation 
        items={navigationItems}
        title="Menu Utama"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount || 0}</p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/dashboard"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">KPI Dashboard</p>
              <p className="text-sm text-gray-500">Lihat analisis performa</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sla"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">SLA Monitoring</p>
              <p className="text-sm text-gray-500">Monitor performa SLA</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
