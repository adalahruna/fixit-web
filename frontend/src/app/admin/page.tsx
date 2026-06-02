import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status');

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
  const activeBookings = bookings?.filter(b => ['confirmed', 'queued', 'in_progress'].includes(b.status)).length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'done').length || 0;

  // Get mechanics count
  const { count: mechanicsCount } = await supabase
    .from('mechanics')
    .select('*', { count: 'exact', head: true });

  // Get services count
  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header with Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
              Dashboard Admin
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Selamat Datang, <span className="text-indigo-600">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kelola bengkel Anda dengan mudah dan efisien melalui dashboard admin
          </p>
        </div>

        {/* Stats Grid - Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pending Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{pendingBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Pending Booking</h3>
              <p className="text-xs text-gray-500">Menunggu konfirmasi</p>
              {pendingBookings > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-yellow-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Perlu tindakan
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{activeBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Booking Aktif</h3>
              <p className="text-xs text-gray-500">Sedang dikerjakan</p>
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

          {/* Total Bookings KPI Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{totalBookings}</div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Booking</h3>
              <p className="text-xs text-gray-500">Semua booking</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Section - Enhanced */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-12 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Menu Utama</h3>
              <p className="text-sm text-gray-600 mt-1">Akses fitur administrasi dengan cepat</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kelola Booking Navigation Card */}
            <Link
              href="/admin/bookings"
              className="group relative block p-6 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Kelola Booking</h4>
                  <p className="text-sm text-gray-600">Lihat dan kelola semua booking</p>
                  {pendingBookings > 0 && (
                    <span className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      {pendingBookings} pending
                    </span>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Kelola Layanan Navigation Card */}
            <Link
              href="/admin/services"
              className="group relative block p-6 rounded-xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white hover:from-green-100 hover:to-green-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">Kelola Layanan</h4>
                  <p className="text-sm text-gray-600">Tambah, edit, atau hapus layanan</p>
                  <span className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {servicesCount || 0} layanan
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Kelola Mekanik Navigation Card */}
            <Link
              href="/admin/mechanics"
              className="group relative block p-6 rounded-xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">Kelola Mekanik</h4>
                  <p className="text-sm text-gray-600">Kelola data mekanik</p>
                  <span className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    {mechanicsCount || 0} mekanik
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* KPI Dashboard Navigation Card */}
            <Link
              href="/admin/dashboard"
              className="group relative block p-6 rounded-xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white hover:from-indigo-100 hover:to-indigo-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">KPI Dashboard</h4>
                  <p className="text-sm text-gray-600">Lihat metrik dan analitik</p>
                  <span className="mt-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                    Analytics
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Audit Logs Navigation Card */}
            <Link
              href="/admin/audit"
              className="group relative block p-6 rounded-xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white hover:from-orange-100 hover:to-orange-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">Audit Logs</h4>
                  <p className="text-sm text-gray-600">Lihat riwayat aktivitas sistem</p>
                  <span className="mt-2 inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    Security
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* SLA Monitoring Navigation Card */}
            <Link
              href="/admin/sla"
              className="group relative block p-6 rounded-xl border-2 border-red-100 bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg group-hover:shadow-xl transition-shadow mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">SLA Monitoring</h4>
                  <p className="text-sm text-gray-600">Monitor SLA dan peringatan</p>
                  <span className="mt-2 inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    Critical
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* System Information Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Informasi Sistem</h2>
            <p className="text-gray-600">Ringkasan status sistem bengkel</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Booking Status Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-12 -mt-12 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">{totalBookings}</div>
                    <div className="text-xs text-gray-500">total</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Status Booking</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Ringkasan status semua booking
                </p>
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{pendingBookings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aktif:</span>
                    <span className="font-semibold text-blue-600">{activeBookings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selesai:</span>
                    <span className="font-semibold text-green-600">{completedBookings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mekanik Status Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-12 -mt-12 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">{mechanicsCount || 0}</div>
                    <div className="text-xs text-gray-500">mekanik</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tim Mekanik</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Total mekanik yang tersedia
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <Link 
                    href="/admin/mechanics" 
                    className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center"
                  >
                    <span>Kelola Mekanik</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Layanan Status Card */}
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
                    <div className="text-2xl font-extrabold text-gray-900">{servicesCount || 0}</div>
                    <div className="text-xs text-gray-500">layanan</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Layanan Servis</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Total layanan yang tersedia
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <Link 
                    href="/admin/services" 
                    className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center"
                  >
                    <span>Kelola Layanan</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action - Enhanced */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative text-center">
            <div className="inline-block mb-4">
              <span className="bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                📊 Dashboard Admin
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Kelola Bengkel Anda dengan Efisien
            </h3>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Gunakan fitur-fitur admin untuk mengelola booking, layanan, mekanik, dan monitoring performa bengkel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                <span>Kelola Booking</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center bg-indigo-500 text-white px-8 py-4 rounded-xl hover:bg-indigo-400 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 group border-2 border-white"
              >
                <span>Lihat KPI</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
            </div>
            <p className="text-indigo-200 text-sm mt-6">
              ✓ Manajemen Booking  •  ✓ Monitoring KPI  •  ✓ Audit Logs  •  ✓ SLA Monitoring
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
