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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto pt-10 pb-16 px-5">
        <h1 className="text-5xl font-extrabold leading-tight mb-8 text-[#0f172a]">
          Servis Motor <br />
          <span className="text-[#0052ff]">Masa Depan</span>
        </h1>

        <div className="relative bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] rounded-3xl p-10 mb-8 flex justify-center items-center min-h-[350px] shadow-xl overflow-hidden">
          <div className="absolute top-5 left-5 bg-[#bfdbfe] text-[#1d4ed8] text-[10px] font-bold px-3 py-1.5 rounded tracking-wider">
            POWERED MAINTENANCE
          </div>
          <div className="text-8xl">🏍️</div>
        </div>

        <p className="text-[#64748b] text-base leading-relaxed max-w-2xl mx-auto mb-8">
          Nikmati kemudahan booking servis motor secara online dengan pemantauan antrian real-time dan mekanik tersertifikasi.
        </p>

        <Link
          href="/customer/bookings/new"
          className="inline-block bg-[#0052ff] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-[#0044d6] transition-all hover:-translate-y-0.5 shadow-lg"
        >
          Booking Sekarang
        </Link>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Bookings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#eff6ff] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-2xl font-extrabold text-[#0f172a]">{totalBookings}</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-1">Total Booking</h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Semua booking yang pernah Anda buat
            </p>
          </div>

          {/* Active Bookings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#fef3c7] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-extrabold text-[#0f172a]">{activeBookings}</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-1">Booking Aktif</h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Booking yang sedang dalam proses
            </p>
          </div>

          {/* Completed Bookings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#d1fae5] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-extrabold text-[#0f172a]">{completedBookings}</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-1">Selesai</h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Booking yang telah diselesaikan
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-3 text-[#0f172a]">Menu Utama</h2>
          <p className="text-[#64748b] text-sm">Akses cepat ke fitur-fitur utama</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Saya */}
          <Link
            href="/customer/bookings"
            className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-[#eff6ff] rounded-2xl flex items-center justify-center group-hover:bg-[#dbeafe] transition-colors">
                <svg className="w-7 h-7 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#cbd5e1] group-hover:text-[#3b82f6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2">Booking Saya</h3>
            <p className="text-sm text-[#64748b] leading-relaxed">
              Lihat dan kelola semua booking servis motor Anda
            </p>
          </Link>

          {/* Buat Booking Baru */}
          <Link
            href="/customer/bookings/new"
            className="group bg-gradient-to-br from-[#0052ff] to-[#0044d6] rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-white"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Buat Booking Baru</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Jadwalkan servis motor Anda sekarang juga
            </p>
          </Link>
        </div>
      </section>

      {/* Service Estimates Section */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-3 text-[#0f172a]">Estimasi Biaya Servis</h2>
          <p className="text-[#64748b] text-sm">Estimasi biaya transparan yang disesuaikan dengan kebutuhan motor Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ganti Oli */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-[#eff6ff] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-lg font-extrabold text-[#0f172a]">Rp 50.000</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Ganti Oli</h3>
            <p className="text-xs text-[#64748b] leading-relaxed mb-6">
              Ganti oli mesin sintetis penuh termasuk filter dan pengecekan umum.
            </p>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-2 tracking-wide">
                <span>ESTIMASI DURASI</span>
                <span>45 MENIT</span>
              </div>
              <div className="w-full h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          {/* Servis Rutin */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-[#eff6ff] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-lg font-extrabold text-[#0f172a]">Rp 350.000</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Servis Rutin</h3>
            <p className="text-xs text-[#64748b] leading-relaxed mb-6">
              Pembersihan CVT/injeksi, cek busi, filter udara, dan diagnosa mesin.
            </p>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-2 tracking-wide">
                <span>ESTIMASI DURASI</span>
                <span>2.5 JAM</span>
              </div>
              <div className="w-full h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Perbaikan Umum */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-[#eff6ff] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div className="text-sm font-extrabold text-[#0f172a]">Sesuai Kerusakan</div>
            </div>
            <h3 className="text-base font-bold text-[#0f172a] mb-2">Perbaikan Umum</h3>
            <p className="text-xs text-[#64748b] leading-relaxed mb-6">
              Perbaikan rem, suspensi, dan masalah kelistrikan yang kompleks.
            </p>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-2 tracking-wide">
                <span>ESTIMASI DURASI</span>
                <span>VARIABEL</span>
              </div>
              <div className="w-full h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
