import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function MechanicsPage() {
  await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get mechanics with user relation info
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select(`
      *,
      user:users(name, email)
    `)
    .order('created_at', { ascending: false });

  // Count unlinked mechanics
  const unlinkedCount = mechanics?.filter(m => !m.user_id).length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kelola Mekanik</h1>
        <div className="flex space-x-3">
          {unlinkedCount > 0 && (
            <Link
              href="/admin/mechanics/link"
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
            >
              🔗 Link User ({unlinkedCount})
            </Link>
          )}
          <Link
            href="/admin/mechanics/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Tambah Mekanik
          </Link>
        </div>
      </div>

      {unlinkedCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">Ada {unlinkedCount} mekanik yang belum terhubung dengan user</p>
              <p className="text-yellow-700 text-sm">
                Mekanik yang belum terhubung tidak dapat login dan melihat history mereka. 
                <Link href="/admin/mechanics/link" className="underline font-medium">Klik di sini untuk menghubungkan</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {!mechanics || mechanics.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Belum ada mekanik. Klik &quot;Tambah Mekanik&quot; untuk menambahkan.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Mekanik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User Terhubung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kapasitas/Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mechanics.map((mechanic) => (
                <tr key={mechanic.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mechanic.name}</div>
                    {mechanic.skill_notes && (
                      <div className="text-sm text-gray-500">{mechanic.skill_notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      mechanic.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mechanic.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {mechanic.user ? (
                      <div>
                        <div className="text-sm font-medium text-green-600">✓ {mechanic.user.name}</div>
                        <div className="text-xs text-gray-500">{mechanic.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-red-600">✗ Belum terhubung</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mechanic.daily_capacity_minutes ? `${mechanic.daily_capacity_minutes} menit` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/mechanics/${mechanic.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
