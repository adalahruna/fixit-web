import { requireRole } from '@/lib/auth/utils';

export default async function MechanicDashboard() {
  const user = await requireRole(['mechanic']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Antrian Servis Saya</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Antrian booking yang di-assign ke Anda akan muncul di sini.
        </p>
      </div>
    </div>
  );
}
