import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: services } = await supabase.from('service_types').select('*');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Enhanced Navbar with Gradient - Same as Dashboard */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  FixIt
                </h1>
                <p className="text-xs text-gray-500 font-medium">Motor Service Booking</p>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-105 transform">
                  Daftar Sekarang
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Rounded Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-12 py-16 lg:py-20">
            <div className="text-center text-white">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Servis Motor Jadi Mudah & Cepat
              </h2>
              <p className="text-lg lg:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Booking servis motor online dengan sistem antrian terpantau real-time. 
                Hemat waktu, transparan, dan profesional.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/register" className="inline-block">
                  <button className="px-8 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-105 transform">
                    Mulai Booking →
                  </button>
                </Link>
                <Link href="/login" className="inline-block">
                  <button className="px-8 py-3 text-white border-2 border-white hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors">
                    Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Rounded Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Kenapa Pilih FixIt?
          </h3>
          <p className="text-lg text-gray-600">
            Sistem booking servis motor terbaik untuk Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 text-center rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105 transform">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <span className="text-3xl">📱</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Booking Online</h4>
            <p className="text-gray-600">
              Booking kapan saja, di mana saja tanpa perlu datang langsung
            </p>
          </div>

          <div className="bg-white p-8 text-center rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105 transform">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <span className="text-3xl">⏱️</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Pantau Real-Time</h4>
            <p className="text-gray-600">
              Lihat posisi antrian dan progres servis motor Anda secara langsung
            </p>
          </div>

          <div className="bg-white p-8 text-center rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105 transform">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <span className="text-3xl">✅</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Mekanik Profesional</h4>
            <p className="text-gray-600">
              Dikerjakan oleh mekanik berpengalaman dan terpercaya
            </p>
          </div>
        </div>
      </div>

      {/* Services Section with Rounded Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Layanan Servis Kami
          </h3>
          <p className="text-lg text-gray-600">
            Berbagai pilihan servis untuk motor Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105 transform">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30">
                  <span className="text-2xl">🔧</span>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                  Rp {service.price?.toLocaleString('id-ID') || '-'}
                </span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h4>
              <p className="text-gray-600 mb-4 min-h-[48px]">
                {service.description || 'Servis berkualitas untuk motor Anda'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~{service.default_duration_minutes} menit
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="inline-block">
            <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 transform">
              Booking Sekarang →
            </button>
          </Link>
        </div>
      </div>

      {/* How It Works Section with Rounded Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Cara Booking
          </h3>
          <p className="text-lg text-gray-600">
            Mudah dan cepat, hanya 3 langkah
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 text-center rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-blue-600/30">
              1
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Daftar Akun</h4>
            <p className="text-gray-600">
              Buat akun dengan data diri dan motor Anda
            </p>
          </div>

          <div className="bg-white p-8 text-center rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-blue-600/30">
              2
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Pilih Layanan</h4>
            <p className="text-gray-600">
              Pilih jenis servis dan jadwal yang sesuai
            </p>
          </div>

          <div className="bg-white p-8 text-center rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-blue-600/30">
              3
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Datang & Servis</h4>
            <p className="text-gray-600">
              Datang sesuai jadwal dan motor Anda siap diservis
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section with Rounded Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-12 py-16 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">
              Siap Servis Motor Anda?
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Daftar sekarang dan rasakan kemudahan booking servis motor online
            </p>
            <Link href="/register" className="inline-block">
              <button className="px-10 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 transform">
                Daftar Gratis Sekarang →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <span className="text-2xl font-bold">FixIt</span>
            </div>
            <p className="text-gray-400 mb-6">
              Sistem booking servis motor online terpercaya
            </p>
            <div className="mt-6 pt-6 border-t border-gray-800 text-sm text-gray-500">
              © 2024 FixIt. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}