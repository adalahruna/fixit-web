import { requireRole } from '@/lib/auth/utils';

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'owner']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Gunakan menu di atas untuk mengelola booking, servis, dan mekanik.
        </p>
      </div>
    </div>
  );
}
