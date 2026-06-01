import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AssignMechanicForm } from '@/components/assignments/AssignMechanicForm';
import { formatDateWIB, formatTimeWIB } from '@/lib/utils/datetime';
import RealtimeBookingStatus from '@/components/bookings/RealtimeBookingStatus';
import SLAWarning from '@/components/warnings/SLAWarning';
import OverloadWarning from '@/components/warnings/OverloadWarning';
import { getBookingSLAStatus } from '@/lib/utils/sla-calculation';

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'owner']);
  
  const { id } = await params;
  const supabase = await createClient();
  
  // Get booking detail
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
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
      assignments (
        id,
        queue_position,
        mechanic:mechanics (
          id,
          name
        )
      ),
      service_progress (
        start_time,
        end_time,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (!booking) {
    notFound();
  }

  // Get all mechanics for assignment
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const isAssigned = booking.assignments && (Array.isArray(booking.assignments) ? booking.assignments.length > 0 : !!booking.assignments);
  const assignment = Array.isArray(booking.assignments) ? booking.assignments[0] : booking.assignments;
  
  // Check if booking is done
  const serviceProgress = Array.isArray(booking.service_progress) ? booking.service_progress[0] : booking.service_progress;
  const isDone = booking.status === 'done' || serviceProgress?.status === 'done';

  // Get SLA status for this booking
  const slaStatus = await getBookingSLAStatus(id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Kembali ke Daftar Booking
        </Link>
      </div>

      {/* SLA Warning */}
      {slaStatus && (slaStatus.isLate || slaStatus.isAtRisk) && (
        <SLAWarning
          bookingId={slaStatus.bookingId}
          isLate={slaStatus.isLate}
          isAtRisk={slaStatus.isAtRisk}
          delayMinutes={slaStatus.delayMinutes}
          estimatedEnd={slaStatus.estimatedEnd}
          className="mb-6"
        />
      )}

      {/* Mechanic Overload Warning */}
      {assignment?.mechanic?.id && (
        <OverloadWarning mechanicId={assignment.mechanic.id} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Detail Booking</h1>
                  <p className="text-blue-50">ID: {booking.id.slice(0, 8)}</p>
                </div>
                <RealtimeBookingStatus
                  bookingId={booking.id}
                  initialStatus={booking.status}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Informasi Customer</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-medium">Nama:</span> {booking.customer?.name}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">Email:</span> {booking.customer?.email}
                  </p>
                </div>
              </div>

              {/* Jadwal */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Jadwal Servis</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-medium">Tanggal:</span>{' '}
                    {formatDateWIB(booking.schedule_start)}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">Jam Mulai:</span>{' '}
                    {formatTimeWIB(booking.schedule_start)} WIB
                  </p>
                  {booking.schedule_end && (
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">Estimasi Selesai:</span>{' '}
                      {formatTimeWIB(booking.schedule_end)} WIB
                    </p>
                  )}
                </div>
              </div>

              {/* Data Motor */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Data Motor</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-medium">Jenis Motor:</span> {booking.vehicle_type}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-medium">Plat Nomor:</span> {booking.vehicle_plate}
                  </p>
                </div>
              </div>

              {/* Jenis Servis */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Jenis Servis</h2>
                {booking.booking_services && booking.booking_services.length > 0 ? (
                  <div className="space-y-2">
                    {booking.booking_services.map((bs: { service_type?: { name?: string; description?: string; default_duration_minutes?: number; price?: number } }, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900">{bs.service_type?.name}</p>
                        {bs.service_type?.description && (
                          <p className="text-sm text-gray-600 mt-1">{bs.service_type.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Durasi: {bs.service_type?.default_duration_minutes} menit</span>
                          {bs.service_type?.price && (
                            <span>Harga: Rp {bs.service_type.price.toLocaleString('id-ID')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 italic">Tidak ada jenis servis dipilih (konsultasi)</p>
                  </div>
                )}
              </div>

              {/* Keluhan/Konsultasi */}
              {booking.booking_consultations && (
                (Array.isArray(booking.booking_consultations) && booking.booking_consultations.length > 0) ||
                (!Array.isArray(booking.booking_consultations) && booking.booking_consultations.complaint_text)
              ) && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">Keluhan/Konsultasi Customer</h2>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {Array.isArray(booking.booking_consultations)
                        ? booking.booking_consultations[0].complaint_text
                        : booking.booking_consultations.complaint_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Foto Keluhan */}
              {booking.complaint_photo_url && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">📸 Foto Keluhan</h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={booking.complaint_photo_url} 
                      alt="Foto keluhan customer" 
                      className="w-full max-w-2xl mx-auto object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Foto diupload oleh customer saat membuat booking
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Assignment */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Assignment Mekanik</h2>
            
            {isDone ? (
              /* Tiket Selesai - Show completion info */
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800">Tiket Selesai</p>
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">
                    Dikerjakan oleh: {assignment?.mechanic?.name || '-'}
                  </p>
                  {serviceProgress?.start_time && (
                    <p className="text-sm text-gray-600">
                      Mulai: {formatTimeWIB(serviceProgress.start_time)} WIB
                    </p>
                  )}
                  {serviceProgress?.end_time && (
                    <p className="text-sm text-gray-600">
                      Selesai: {formatTimeWIB(serviceProgress.end_time)} WIB
                    </p>
                  )}
                  {serviceProgress?.actual_duration && (
                    <p className="text-sm text-gray-600 mt-2">
                      Durasi: {serviceProgress.actual_duration} menit
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ℹ️ Tiket yang sudah selesai tidak dapat di-assign ulang
                  </p>
                </div>
              </div>
            ) : isAssigned ? (
              /* Already Assigned - Show reassign form */
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">Sudah Di-assign</p>
                  <p className="text-gray-900 font-semibold">{assignment?.mechanic?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Posisi Queue: #{assignment?.queue_position}
                  </p>
                </div>
                <AssignMechanicForm 
                  bookingId={booking.id} 
                  currentMechanicId={assignment?.mechanic?.id}
                  mechanics={mechanics || []}
                  isAssigned={true}
                />
              </div>
            ) : (
              /* Not Assigned - Show assign form */
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Booking ini belum di-assign ke mekanik. Pilih mekanik di bawah untuk assign.
                  </p>
                </div>
                <AssignMechanicForm 
                  bookingId={booking.id}
                  mechanics={mechanics || []}
                  isAssigned={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
