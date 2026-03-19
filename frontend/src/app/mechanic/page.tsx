import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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

  // Get queue count
  let queueCount = 0;
  if (mechanic) {
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('mechanic_id', mechanic.id);
    queueCount = count || 0;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Mekanik</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Kelola antrian servis Anda dengan mudah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/mechanic/queue"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">📋 Antrian Saya</h2>
          <p className="text-gray-600">Lihat dan kelola antrian booking Anda</p>
          {queueCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {queueCount} booking dalam antrian
            </p>
          )}
        </Link>

        <div className="bg-gray-100 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 text-gray-600">🔧 Update Progres</h2>
          <p className="text-gray-500">Fitur akan segera tersedia</p>
        </div>
      </div>
    </div>
  );
}
