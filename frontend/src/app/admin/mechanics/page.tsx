import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteMechanicButton from '@/components/mechanics/DeleteMechanicButton';
import { detectMechanicOverload } from '@/lib/utils/overload-detection';

export default async function MechanicsPage() {
  await requireRole(['admin', 'owner']);
  
  const supabase = await createClient();
  
  // Get mechanics with user relation info
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select(`
      *,
      user:users(name, email)
    `)
    .order('created_at', { ascending: false });

  // Count unlinked mechanics
  const unlinkedCount = mechanics?.filter(m => !m.user_id).length || 0;
  const totalMechanics = mechanics?.length || 0;
  const activeMechanics = mechanics?.filter(m => m.is_active).length || 0;
  const totalCapacity = mechanics?.reduce((sum, m) => sum + (m.daily_capacity_minutes || 0), 0) || 0;

  // Get workload status for all mechanics
  let overloadData;
  try {
    overloadData = await detectMechanicOverload();
  } catch (error) {
    console.error('Failed to fetch overload data:', error);
    overloadData = { overloadedMechanics: [], totalMechanics: 0, overloadedCount: 0, systemOverloadPercentage: 0 };
  }

  // Create a map of mechanic overload statuses (including non-overloaded mechanics)
  const mechanicWorkloadMap = new Map();
  
  // First, add all overloaded mechanics
  for (const status of overloadData.overloadedMechanics) {
    mechanicWorkloadMap.set(status.mechanicId, status);
  }
  
  // Then fetch status for active mechanics not in overloaded list
  for (const mechanic of (mechanics || [])) {
    if (mechanic.is_active && !mechanicWorkloadMap.has(mechanic.id)) {
      // They are not overloaded, add with 0 workload
      mechanicWorkloadMap.set(mechanic.id, {
        mechanicId: mechanic.id,
        mechanicName: mechanic.name,
        currentLoad: 0,
        maxCapacity: mechanic.daily_capacity_minutes || 480,
        isOverloaded: false,
        overloadPercentage: 0,
        queuedBookings: 0,
        inProgressBookings: 0
      });
    }
  }

  const overloadedCount = overloadData.overloadedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Kelola Mekanik</h1>
                <p className="text-blue-100 mt-1">Manajemen tim mekanik dan kapasitas kerja</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {unlinkedCount > 0 && (
                <Link
                  href="/admin/mechanics/link"
                  className="inline-flex items-center bg-white text-blue-600 px-5 py-3 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link User ({unlinkedCount})
                </Link>
              )}
              <Link
                href="/admin/mechanics/new"
                className="inline-flex items-center bg-white text-blue-600 px-5 py-3 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Mekanik
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Mechanics Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-4xl font-bold text-blue-600">{totalMechanics}</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Total Mekanik</h3>
            <p className="text-xs text-gray-500 mt-1">Semua mekanik terdaftar</p>
          </div>

          {/* Active Mechanics Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-4xl font-bold text-green-600">{activeMechanics}</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Mekanik Aktif</h3>
            <p className="text-xs text-gray-500 mt-1">Siap bekerja</p>
          </div>

          {/* Total Capacity Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{Math.round(totalCapacity / 60)}h</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Kapasitas Total</h3>
            <p className="text-xs text-gray-500 mt-1">{totalCapacity} menit per hari</p>
          </div>
        </div>

        {/* Warning for unlinked mechanics */}
        {unlinkedCount > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-5 rounded-xl mb-8 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-yellow-800 font-semibold">Perhatian: Ada {unlinkedCount} mekanik yang belum terhubung dengan user</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Mekanik yang belum terhubung tidak dapat login ke sistem.
                </p>
                <Link 
                  href="/admin/mechanics/link" 
                  className="inline-flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-all text-sm mt-3 shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Hubungkan Sekarang
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Warning for overloaded mechanics */}
        {overloadedCount > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 rounded-xl mb-8 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-red-800 font-semibold">⚠️ Peringatan Overload: {overloadedCount} mekanik melebihi kapasitas</h3>
                <p className="text-red-700 text-sm mt-1">
                  Beberapa mekanik memiliki beban kerja ≥80% dari kapasitas harian. Pertimbangkan untuk mendistribusikan ulang tugas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mechanics List */}
        {!mechanics || mechanics.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Belum Ada Mekanik
              </h3>
              <p className="text-gray-600 mb-6">
                Mulai tambahkan data mekanik untuk mengelola tim bengkel Anda
              </p>
              <Link
                href="/admin/mechanics/new"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Mekanik Pertama
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Nama Mekanik
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Beban Kerja Hari Ini
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      User Terhubung
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Kapasitas/Hari
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mechanics.map((mechanic, index) => {
                    const workloadStatus = mechanicWorkloadMap.get(mechanic.id);
                    const percentage = workloadStatus?.overloadPercentage || 0;
                    const currentLoad = workloadStatus?.currentLoad || 0;
                    const maxCapacity = workloadStatus?.maxCapacity || mechanic.daily_capacity_minutes || 480;
                    
                    // Determine color based on percentage
                    let statusColor, statusBg, statusText, progressBarColor;
                    if (percentage >= 80) {
                      statusColor = 'text-red-700';
                      statusBg = 'bg-red-100';
                      statusText = 'Overload';
                      progressBarColor = 'bg-gradient-to-r from-red-500 to-red-600';
                    } else if (percentage >= 60) {
                      statusColor = 'text-yellow-700';
                      statusBg = 'bg-yellow-100';
                      statusText = 'Sibuk';
                      progressBarColor = 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                    } else {
                      statusColor = 'text-green-700';
                      statusBg = 'bg-green-100';
                      statusText = 'Normal';
                      progressBarColor = 'bg-gradient-to-r from-green-500 to-green-600';
                    }

                    return (
                    <tr key={mechanic.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md">
                            {mechanic.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{mechanic.name}</div>
                            {mechanic.skill_notes && (
                              <div className="text-sm text-gray-500 mt-1">{mechanic.skill_notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          mechanic.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${mechanic.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          {mechanic.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {mechanic.is_active && workloadStatus ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusBg} ${statusColor}`}>
                                {percentage >= 80 && (
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {statusText} {percentage}%
                              </span>
                              <span className="text-xs text-gray-600 font-medium">
                                {currentLoad}/{maxCapacity} menit
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`${progressBarColor} h-2.5 rounded-full transition-all`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">
                              {workloadStatus.queuedBookings} antrian • {workloadStatus.inProgressBookings} proses
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mechanic.user ? (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{mechanic.user.name}</div>
                              <div className="text-xs text-gray-500">{mechanic.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium">Belum terhubung</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {mechanic.daily_capacity_minutes ? `${mechanic.daily_capacity_minutes} menit` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/admin/mechanics/${mechanic.id}/edit`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <DeleteMechanicButton
                            mechanicId={mechanic.id}
                            mechanicName={mechanic.name}
                          />
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
