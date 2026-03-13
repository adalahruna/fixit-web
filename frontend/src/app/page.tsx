import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: services } = await supabase.from('service_types').select('*');

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Bengkel Motor</h1>
            <div className="flex space-x-4">
              <Link href="/login" className="text-blue-600 hover:text-blue-700">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistem Booking Servis Motor Online
          </h2>
          <p className="text-lg text-gray-600">
            Booking servis motor Anda dengan mudah dan pantau progres secara real-time
          </p>
        </div>

        <h3 className="text-2xl font-bold mb-6">Layanan Kami</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-800">{service.name}</h4>
              <p className="text-gray-600 mt-2">{service.description || 'Tidak ada deskripsi.'}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">~{service.default_duration_minutes} menit</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                  Rp {service.price?.toLocaleString('id-ID') || '-'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700 transition"
          >
            Mulai Booking Sekarang
          </Link>
        </div>
      </div>
    </main>
  );
}