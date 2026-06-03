import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import QuickNavigation, { mechanicNavigationItems } from '@/components/dashboard/QuickNavigation';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MechanicDashboard() {
  const user = await requireRole(['mechanic']);
  
  const supabase = await createClient();
  
  // Get mechanic data by user_id (proper relation)
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name, user_id')
    .eq('user_id', user.id)
    .single();

  if (!mechanic) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard Mekanik</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Data Mekanik Tidak Ditemukan</h3>
          <p className="text-yellow-700 mb-4">
            Akun Anda belum terhubung dengan data mekanik. Hubungi admin untuk menghubungkan akun Anda.
          </p>
        </div>
      </div>
    );
  }

  // Get queue stats - TWO-STEP APPROACH to avoid RLS issues with joins
  let queueCount = 0;
  let inProgressCount = 0;
  let completedToday = 0;
  
  if (mechanic) {
    // Step 1: Get all booking IDs assigned to this mechanic
    const { data: assignments } = await supabase
      .from('assignments')
      .select('booking_id')
      .eq('mechanic_id', mechanic.id);
    
    const bookingIds = assignments?.map(a => a.booking_id) || [];
    
    if (bookingIds.length > 0) {
      // Step 2: Query bookings directly with the booking IDs
      
      // Query 1: Count active queue (not done/cancelled)
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id, status')
        .in('id', bookingIds)
        .not('status', 'in', '(done,cancelled)');
      
      queueCount = activeBookings?.length || 0;

      // Query 2: Count in_progress bookings
      const { data: inProgressBookings } = await supabase
        .from('bookings')
        .select('id, status')
        .in('id', bookingIds)
        .eq('status', 'in_progress');
      
      inProgressCount = inProgressBookings?.length || 0;

      // Query 3: Count completed today from service_progress
      const today = new Date().toISOString().split('T')[0];
      const { data: completedProgress } = await supabase
        .from('service_progress')
        .select('booking_id, end_time')
        .in('booking_id', bookingIds)
        .not('end_time', 'is', null)
        .gte('end_time', `${today}T00:00:00`)
        .lt('end_time', `${today}T23:59:59`);
      
      completedToday = completedProgress?.length || 0;
    }
  }

  // Add badge to queue navigation if there are items
  const navigationItems = mechanicNavigationItems.map(item => {
    if (item.href === '/mechanic/queue' && queueCount > 0) {
      return {
        ...item,
        badge: `${queueCount} items`
      };
    }
    return item;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header with Gradient Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Selamat Datang, {user.name}!</h1>
                <p className="text-blue-100 mt-1">Siap untuk menyelesaikan pekerjaan hari ini</p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-blue-100 text-sm">Hari ini</p>
              <p className="text-2xl font-bold text-white">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Queue Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{queueCount}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Total Antrian</h3>
            <p className="text-xs text-gray-500 mt-1">Motor yang menunggu</p>
            {queueCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/mechanic/queue" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  Lihat Detail
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* In Progress Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-orange-600">{inProgressCount}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Sedang Dikerjakan</h3>
            <p className="text-xs text-gray-500 mt-1">Pekerjaan aktif</p>
            {inProgressCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-orange-600 font-medium flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                  Dalam proses
                </span>
              </div>
            )}
          </div>

          {/* Completed Today Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">{completedToday}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Selesai Hari Ini</h3>
            <p className="text-xs text-gray-500 mt-1">Motor yang sudah selesai</p>
            {completedToday > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kerja bagus!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Cards */}
        {queueCount > 0 ? (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Ada {queueCount} Motor Menunggu
                </h3>
                <p className="text-blue-100">
                  Mulai kerjakan servis berikutnya untuk menjaga produktivitas Anda
                </p>
              </div>
              <Link
                href="/mechanic/queue"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Lihat Antrian
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Tidak Ada Antrian
              </h3>
              <p className="text-gray-600 mb-6">
                Anda sudah menyelesaikan semua pekerjaan! Nikmati waktu istirahat Anda.
              </p>
            </div>
          </div>
        )}

        {/* Performance Tips Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tips Produktivitas</h2>
              <p className="text-sm text-gray-500">Tingkatkan efisiensi kerja Anda</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Prioritaskan Antrian</h4>
                <p className="text-xs text-gray-600 mt-1">Kerjakan motor dengan jadwal paling awal terlebih dahulu</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Update Progress</h4>
                <p className="text-xs text-gray-600 mt-1">Selalu update status pekerjaan secara real-time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Jaga Kualitas</h4>
                <p className="text-xs text-gray-600 mt-1">Pastikan setiap servis dikerjakan dengan standar terbaik</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Komunikasi</h4>
                <p className="text-xs text-gray-600 mt-1">Laporkan masalah atau kendala kepada admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
