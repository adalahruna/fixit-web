import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import QuickNavigation, { mechanicNavigationItems } from '@/components/dashboard/QuickNavigation';

export default async function MechanicDashboard() {
  const user = await requireRole(['mechanic']);
  
  const supabase = await createClient();
  
  // Get user data from users table
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();
  
  // Get mechanic data
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('name', userData?.name || '')
    .single();

  // Get queue stats
  let queueCount = 0;
  let inProgressCount = 0;
  let completedToday = 0;
  
  if (mechanic) {
    // Total assignments
    const { count: totalQueue } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('mechanic_id', mechanic.id);
    queueCount = totalQueue || 0;

    // In progress bookings
    const { count: inProgress } = await supabase
      .from('bookings')
      .select('*, assignments!inner(*)', { count: 'exact', head: true })
      .eq('assignments.mechanic_id', mechanic.id)
      .eq('status', 'in_progress');
    inProgressCount = inProgress || 0;

    // Completed today
    const today = new Date().toISOString().split('T')[0];
    const { count: completed } = await supabase
      .from('service_progress')
      .select('*, assignments!inner(*)', { count: 'exact', head: true })
      .eq('assignments.mechanic_id', mechanic.id)
      .gte('end_time', `${today}T00:00:00`)
      .lt('end_time', `${today}T23:59:59`);
    completedToday = completed || 0;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Mekanik</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Selamat datang, {user.name}!</h2>
        <p className="text-gray-600">
          Kelola antrian servis Anda dengan mudah.
        </p>
      </div>

      {/* Quick Navigation */}
      <QuickNavigation 
        items={navigationItems}
        title="Menu Utama"
      />

      {/* Work Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Antrian</p>
              <p className="text-2xl font-bold text-gray-900">{queueCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Sedang Dikerjakan</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
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
              <p className="text-sm font-medium text-gray-600">Selesai Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {queueCount > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <h3 className="text-lg font-semibold mb-2">Ada {queueCount} booking dalam antrian</h3>
          <p className="text-blue-100 mb-4">Mulai kerjakan servis berikutnya</p>
          <Link
            href="/mechanic/queue"
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Lihat Antrian
          </Link>
        </div>
      )}
    </div>
  );
}
