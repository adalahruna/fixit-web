import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import QuickNavigation, { customerNavigationItems } from '@/components/dashboard/QuickNavigation';
import { createClient } from '@/lib/supabase/server';

export default async function CustomerDashboard() {
  const user = await requireRole(['customer']);
  
  const supabase = await createClient();
  
  // Get customer's booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('customer_id', user.id);

  const totalBookings = bookings?.length || 0;
  const activeBookings = bookings?.filter(b => ['pending', 'confirmed', 'queued', 'in_progress'].includes(b.status)).length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'done').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Customer</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Selamat datang, {user.name}!</h2>
        <p className="text-gray-600">
          Kelola booking servis motor Anda dengan mudah melalui menu di bawah ini.
        </p>
      </div>

      {/* Quick Navigation */}
      <QuickNavigation 
        items={customerNavigationItems}
        title="Menu Utama"
      />

      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Booking</p>
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{activeBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
        <h3 className="text-lg font-semibold mb-2">Butuh servis motor?</h3>
        <p className="text-blue-100 mb-4">Jadwalkan servis motor Anda sekarang juga!</p>
        <Link
          href="/customer/bookings/new"
          className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buat Booking Baru
        </Link>
      </div>
    </div>
  );
}
