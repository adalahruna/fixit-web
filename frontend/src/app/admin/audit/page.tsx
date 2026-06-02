import { requireRole } from '@/lib/auth/utils';
import { getAuditLogs } from '@/lib/audit/actions';
import Link from 'next/link';

interface AuditLogWithActor {
  id: string;
  actor_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  timestamp_log: string;
  metadata?: Record<string, unknown>;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface SearchParams {
  page?: string;
  entity?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(['admin', 'owner']);

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const filters = {
    entity: params.entity,
    action: params.action,
    start_date: params.start_date,
    end_date: params.end_date
  };

  const auditData = await getAuditLogs(page, 50, filters);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return 'bg-blue-100 text-blue-800 border-2 border-blue-300';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-200 text-blue-900 border-2 border-blue-400';
    if (action.includes('delete') || action.includes('cancel')) return 'bg-blue-300 text-blue-900 border-2 border-blue-500';
    if (action.includes('login') || action.includes('start')) return 'bg-blue-100 text-blue-800 border-2 border-blue-300';
    if (action.includes('error')) return 'bg-blue-200 text-blue-900 border-2 border-blue-400';
    return 'bg-gray-100 text-gray-800 border-2 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Design */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
              <p className="text-blue-100 mt-1">Pelacakan aktivitas sistem dan riwayat perubahan data</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-sm text-blue-100">Total Logs</div>
            <div className="text-2xl font-bold">{auditData.totalCount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter & Pencarian
          </h2>
        </div>
        <div className="p-6">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Entity
              </label>
              <select
                name="entity"
                defaultValue={filters.entity || ''}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              >
                <option value="">All Entities</option>
                <option value="booking">Booking</option>
                <option value="user">User</option>
                <option value="mechanic">Mechanic</option>
                <option value="service_type">Service Type</option>
                <option value="assignment">Assignment</option>
                <option value="service_progress">Service Progress</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Action
              </label>
              <input
                type="text"
                name="action"
                defaultValue={filters.action || ''}
                placeholder="e.g., create_booking"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                defaultValue={filters.start_date || ''}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                defaultValue={filters.end_date || ''}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl mr-4 shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-900 mb-1">Hasil Pencarian</div>
            <div className="text-lg text-gray-700">
              Menampilkan <span className="font-bold text-blue-700">{auditData.logs.length}</span> dari{' '}
              <span className="font-bold text-blue-700">{auditData.totalCount}</span> audit logs
              {filters.entity && <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-800">entity: {filters.entity}</span>}
              {filters.action && <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-800">action: {filters.action}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Entity ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditData.logs.map((log: AuditLogWithActor) => (
                <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDateTime(log.timestamp_log)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.actor ? (
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 font-bold text-sm">
                          {log.actor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{log.actor.name}</div>
                          <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 inline-block">
                            {log.actor.role}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        System
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.entity_id ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 block max-w-xs truncate">
                        {log.entity_id}
                      </code>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View metadata
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border border-gray-200 max-h-40 overflow-y-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {auditData.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}&${new URLSearchParams(filters as Record<string, string>).toString()}`}
              className="px-6 py-3 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>
          )}
          
          <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold shadow-md">
            Page {page} of {auditData.totalPages}
          </div>
          
          {page < auditData.totalPages && (
            <Link
              href={`?page=${page + 1}&${new URLSearchParams(filters as Record<string, string>).toString()}`}
              className="px-6 py-3 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-blue-700 flex items-center"
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Empty State */}
      {auditData.logs.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-12 text-center border-2 border-blue-200">
          <div className="text-blue-400 mb-6">
            <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {auditData.totalCount === 0 ? "Belum Ada Audit Logs" : "Tidak Ada Hasil"}
          </h3>
          <p className="text-lg text-gray-600 mb-4">
            {auditData.totalCount === 0 
              ? "Audit logging akan mulai melacak aktivitas secara otomatis."
              : "Tidak ada audit logs yang sesuai dengan filter Anda. Coba sesuaikan kriteria pencarian."
            }
          </p>
          {auditData.totalCount === 0 && (
            <div className="bg-white rounded-lg p-6 mt-6 border-2 border-blue-200 max-w-md mx-auto">
              <p className="text-sm font-semibold text-gray-700 mb-3">Audit logs akan dibuat saat pengguna melakukan aksi seperti:</p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Membuat atau membatalkan booking
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Assign mekanik ke booking
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Memulai atau menyelesaikan service
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Mengelola master data
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}