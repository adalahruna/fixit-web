import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function CustomerDashboard() {
  const user = await requireRole(['customer']);
  
  const supabase = await createClient();
  
  // Get customer's booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('customer_id', user.id);

  const totalBookings = bookings?.length || 0;
  const activeBookings = bookings?.filter(b => ['pending', 'confirmed', 'queued', 'in_progress'].includes(b.status)).length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'done').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header with Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Dashboard Customer
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Selamat Datang, <span className="text-blue-600">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kelola booking dan servis motor Anda dengan mudah dan cepat
          </p>
        </div>

        {/* Stats Grid - Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{totalBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Booking</h3>
              <p className="text-xs text-gray-500">Semua booking yang pernah dibuat</p>
            </div>
          </div>


          {/* Active Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{activeBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Booking Aktif</h3>
              <p className="text-xs text-gray-500">Sedang dalam proses servis</p>
            </div>
          </div>

          {/* Completed Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{completedBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Selesai</h3>
              <p className="text-xs text-gray-500">Booking yang telah selesai</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Section - Enhanced */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-12 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Navigasi Cepat</h3>
              <p className="text-sm text-gray-600 mt-1">Akses fitur utama dengan cepat</p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Quick Access</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Saya Navigation Card */}
            <Link
              href="/customer/bookings"
              className="group relative block p-6 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Booking Saya</h4>
                  <p className="text-sm text-gray-600">Lihat dan kelola semua booking Anda</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>


            {/* Buat Booking Baru Navigation Card */}
            <Link
              href="/customer/bookings/new"
              className="group relative block p-6 rounded-xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white hover:from-green-100 hover:to-green-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">Buat Booking Baru</h4>
                  <p className="text-sm text-gray-600">Jadwalkan servis motor sekarang</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Service Information Section - Enhanced */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Layanan Servis Kami</h2>
            <p className="text-gray-600">Pilihan layanan terbaik untuk motor Anda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ganti Oli Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-12 -mt-12 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">Rp 50K</div>
                    <div className="text-xs text-gray-500">per servis</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ganti Oli</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Ganti oli mesin termasuk filter dan pengecekan umum motor
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">~45 menit</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Populer</span>
                </div>
              </div>
            </div>

            {/* Servis Rutin Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-transparent rounded-full -mr-12 -mt-12 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">Rp 350K</div>
                    <div className="text-xs text-gray-500">per servis</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Servis Rutin</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Pembersihan CVT/injeksi, cek busi, filter udara lengkap
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">~2.5 jam</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Lengkap</span>
                </div>
              </div>
            </div>


            {/* Perbaikan Umum Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-12 -mt-12 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-gray-900">Variabel</div>
                    <div className="text-xs text-gray-500">sesuai kerusakan</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Perbaikan Umum</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Perbaikan rem, suspensi, dan kelistrikan motor
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Tergantung</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Fleksibel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action - Enhanced */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative text-center">
            <div className="inline-block mb-4">
              <span className="bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                ⚡ Booking Mudah & Cepat
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Siap untuk Servis Motor Anda?
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Booking sekarang dan dapatkan layanan terbaik dari mekanik profesional kami dengan harga transparan
            </p>
            <Link
              href="/customer/bookings/new"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
            >
              <span>Buat Booking Sekarang</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-blue-200 text-sm mt-6">
              ✓ Mekanik Bersertifikat  •  ✓ Harga Transparan  •  ✓ Garansi Servis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
