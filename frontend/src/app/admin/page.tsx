import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get pending bookings count
  const { count: pendingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Kelola bengkel Anda dengan mudah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/bookings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">📋 Kelola Booking</h2>
          <p className="text-gray-600">Lihat dan assign booking ke mekanik</p>
          {pendingCount && pendingCount > 0 && (
            <p className="text-sm text-red-500 mt-2 font-medium">
              {pendingCount} booking menunggu assignment
            </p>
          )}
        </Link>

        <Link
          href="/admin/services"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">🔧 Jenis Servis</h2>
          <p className="text-gray-600">Kelola master data jenis servis</p>
        </Link>

        <Link
          href="/admin/mechanics"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">👨‍🔧 Mekanik</h2>
          <p className="text-gray-600">Kelola data mekanik bengkel</p>
        </Link>
      </div>
    </div>
  );
}
