import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';

export default async function CustomerDashboard() {
  const user = await requireRole(['customer']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Customer</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-gray-600">Selamat datang, {user.name}!</p>
        <p className="text-sm text-gray-500 mt-2">
          Kelola booking servis motor Anda dengan mudah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/customer/bookings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">📋 Booking Saya</h2>
          <p className="text-gray-600">Lihat dan kelola booking servis motor Anda</p>
        </Link>

        <Link
          href="/customer/bookings/new"
          className="bg-blue-600 p-6 rounded-lg shadow hover:shadow-md transition-shadow text-white"
        >
          <h2 className="text-xl font-semibold mb-2">+ Buat Booking Baru</h2>
          <p className="text-blue-100">Jadwalkan servis motor Anda sekarang</p>
        </Link>
      </div>
    </div>
  );
}
