import { requireRole } from '@/lib/auth/utils';

export default async function OwnerDashboard() {
  const user = await requireRole(['owner']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Owner</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Dashboard analitik dan monitoring operasional bengkel.
        </p>
      </div>
    </div>
  );
}
