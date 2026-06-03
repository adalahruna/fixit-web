import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDateWIB, formatTimeWIB, formatDateTimeWIB } from '@/lib/utils/datetime';
import { StartServiceButton, CompleteServiceButton } from '@/components/progress/ServiceActionButtons';

export default async function MechanicBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['mechanic']);
  
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get mechanic data by user_id (proper relation)
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('id, name, user_id')
    .eq('user_id', user?.id)
    .single();

  if (!mechanic) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Detail Booking</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <p className="text-yellow-800">
            Data mekanik tidak ditemukan. Hubungi admin untuk setup akun mekanik Anda.
          </p>
        </div>
      </div>
    );
  }

  // Get booking detail - only if assigned to this mechanic
  const { data: assignment } = await supabase
    .from('assignments')
    .select(`
      *,
      booking:bookings (
        *,
        customer:users!bookings_customer_id_fkey (
          name,
          email
        ),
        booking_services (
          service_type:service_types (
            name,
            description,
            default_duration_minutes,
            price
          )
        ),
        booking_consultations (
          complaint_text,
          created_at
        ),
        service_progress (
          start_time,
          end_time,
          status
        )
      )
    `)
    .eq('booking_id', id)
    .eq('mechanic_id', mechanic.id)
    .single();

  if (!assignment) {
    notFound();
  }

  const booking = assignment.booking;
  
  const progress = booking.service_progress && (Array.isArray(booking.service_progress) && booking.service_progress.length > 0)
    ? booking.service_progress[0] 
    : (Array.isArray(booking.service_progress) ? null : booking.service_progress);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      queued: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-green-100 text-green-800',
      done: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      queued: 'Dalam Antrian',
      in_progress: 'Sedang Dikerjakan',
      done: 'Selesai',
      paused: 'Dijeda',
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: number | null | undefined) => {
    if (!priority) return null;
    
    const configs: Record<number, { label: string; className: string; icon: string }> = {
      1: { 
        label: '🔥 URGENT', 
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
        icon: '🔥'
      },
      2: { 
        label: '⚡ HIGH', 
        className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
        icon: '⚡'
      },
      3: { 
        label: '📋 NORMAL', 
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
        icon: '📋'
      },
      4: { 
        label: '⏰ LOW', 
        className: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
        icon: '⏰'
      },
    };
    
    return configs[priority] || null;
  };

  const priorityConfig = getPriorityBadge(booking.priority);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/mechanic/queue"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Antrian
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">Detail Booking</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-100 font-semibold">Queue Position: #{assignment.queue_position}</span>
                    {priorityConfig && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-lg ${priorityConfig.className} animate-pulse`}>
                        {priorityConfig.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {progress && (
                <span className={`px-4 py-2 text-sm font-bold rounded-xl shadow-md ${getStatusBadge(progress.status)}`}>
                  {getStatusLabel(progress.status)}
                </span>
              )}
            </div>
            
            {/* Priority Alert Banner */}
            {booking.priority && booking.priority <= 2 && (
              <div className="mt-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-white">
                      {booking.priority === 1 ? '🔥 Booking ini URGENT! Prioritaskan pengerjaan segera.' : '⚡ Booking prioritas tinggi - kerjakan secepatnya.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
          {/* Customer Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Informasi Customer</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-24">Nama:</span>
                <span className="text-gray-900 font-medium">{booking.customer?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-24">Email:</span>
                <span className="text-gray-900">{booking.customer?.email}</span>
              </div>
            </div>
          </div>

          {/* Jadwal */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Jadwal Servis</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-40">Tanggal:</span>
                <span className="text-gray-900 font-medium">{formatDateWIB(booking.schedule_start)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-40">Jam Mulai:</span>
                <span className="text-gray-900 font-medium">{formatTimeWIB(booking.schedule_start)} WIB</span>
              </div>
              {booking.schedule_end && (
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-40">Estimasi Selesai:</span>
                  <span className="text-gray-900 font-medium">{formatTimeWIB(booking.schedule_end)} WIB</span>
                </div>
              )}
            </div>
          </div>

          {/* Data Motor */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data Motor</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-32">Jenis Motor:</span>
                <span className="text-gray-900 font-medium">{booking.vehicle_type}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 w-32">Plat Nomor:</span>
                <span className="text-gray-900 font-mono font-bold text-lg bg-white px-3 py-1 rounded-lg border-2 border-purple-300">
                  {booking.vehicle_plate}
                </span>
              </div>
            </div>
          </div>

          {/* Jenis Servis */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Jenis Servis</h2>
            </div>
            {booking.booking_services && booking.booking_services.length > 0 ? (
              <div className="space-y-3">
                {booking.booking_services.map((bs: { service_type?: { name?: string; description?: string; default_duration_minutes?: number; price?: number } }, idx: number) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{bs.service_type?.name}</p>
                        {bs.service_type?.description && (
                          <p className="text-sm text-gray-600 mt-1">{bs.service_type.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-green-100">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{bs.service_type?.default_duration_minutes} menit</span>
                      </div>
                      {bs.service_type?.price && (
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-gray-700">Rp {bs.service_type.price.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <p className="text-gray-500 italic text-center">Tidak ada jenis servis dipilih (konsultasi)</p>
              </div>
            )}
          </div>

          {/* Keluhan/Konsultasi */}
          {booking.booking_consultations && (
            (Array.isArray(booking.booking_consultations) && booking.booking_consultations.length > 0 && booking.booking_consultations[0].complaint_text) ||
            (!Array.isArray(booking.booking_consultations) && booking.booking_consultations.complaint_text)
          ) && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-300">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl text-white mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">💬 Keluhan/Konsultasi Customer</h2>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-yellow-200 shadow-sm">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {Array.isArray(booking.booking_consultations) 
                    ? booking.booking_consultations[0].complaint_text 
                    : booking.booking_consultations.complaint_text}
                </p>
              </div>
            </div>
          )}

          {/* Foto Keluhan */}
          {booking.complaint_photo_url && (
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-200">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl text-white mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">📸 Foto Keluhan</h2>
              </div>
              <div className="bg-white border-2 border-pink-200 rounded-xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={booking.complaint_photo_url} 
                  alt="Foto keluhan customer" 
                  className="w-full max-w-2xl mx-auto object-contain"
                />
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center font-medium bg-white rounded-lg py-2 px-3 border border-pink-200">
                📷 Foto diupload oleh customer saat membuat booking
              </p>
            </div>
          )}

          {/* Progress Info */}
          {progress && progress.start_time && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Progres Servis</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Mulai:</span>
                      <p className="text-gray-900 font-bold">{formatDateTimeWIB(progress.start_time)} WIB</p>
                    </div>
                  </div>
                </div>
                {progress.end_time && (
                  <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="font-semibold text-gray-700 text-sm">Selesai:</span>
                        <p className="text-gray-900 font-bold">{formatDateTimeWIB(progress.end_time)} WIB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {progress && (
            <div className="border-t-4 border-gray-200 pt-6">
              {progress.status === 'queued' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 mb-3">
                    <p className="text-sm font-semibold text-center">
                      🚀 Motor sudah siap untuk dikerjakan!
                    </p>
                  </div>
                  <StartServiceButton bookingId={id} />
                </div>
              )}

              {progress.status === 'in_progress' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 mb-3">
                    <p className="text-sm font-semibold text-center">
                      ⚡ Servis sedang berlangsung - klik tombol di bawah saat selesai
                    </p>
                  </div>
                  <CompleteServiceButton bookingId={id} />
                </div>
              )}

              {progress.status === 'done' && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 text-center shadow-lg">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xl font-bold">Servis Selesai!</p>
                  </div>
                  <p className="text-sm text-green-100">Motor sudah siap untuk diambil customer</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
