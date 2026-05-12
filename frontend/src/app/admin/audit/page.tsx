import { requireRole } from '@/lib/auth/utils';
import { getAuditLogs } from '@/lib/audit/actions';
import Link from 'next/link';

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
  searchParams: SearchParams;
}) {
  await requireRole(['admin', 'owner']);

  const page = parseInt(searchParams.page || '1');
  const filters = {
    entity: searchParams.entity,
    action: searchParams.action,
    start_date: searchParams.start_date,
    end_date: searchParams.end_date
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
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete') || action.includes('cancel')) return 'bg-red-100 text-red-800';
    if (action.includes('login') || action.includes('start')) return 'bg-purple-100 text-purple-800';
    if (action.includes('error')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity
            </label>
            <select
              name="entity"
              defaultValue={filters.entity || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              name="action"
              defaultValue={filters.action || ''}
              placeholder="e.g., create_booking"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              defaultValue={filters.start_date || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              defaultValue={filters.end_date || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Showing {auditData.logs.length} of {auditData.totalCount} audit logs
          {filters.entity && ` for entity: ${filters.entity}`}
          {filters.action && ` with action: ${filters.action}`}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditData.logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(log.timestamp_log)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.actor ? (
                      <div>
                        <div className="font-medium">{log.actor.name}</div>
                        <div className="text-xs text-gray-500">{log.actor.role}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.entity_id ? (
                      <span className="truncate max-w-xs block">
                        {log.entity_id}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          View metadata
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      '-'
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
        <div className="flex justify-center space-x-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}&${new URLSearchParams(filters as any).toString()}`}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          
          <span className="px-3 py-2 bg-blue-600 text-white rounded-md">
            Page {page} of {auditData.totalPages}
          </span>
          
          {page < auditData.totalPages && (
            <Link
              href={`?page=${page + 1}&${new URLSearchParams(filters as any).toString()}`}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {/* Empty State */}
      {auditData.logs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
          <p className="text-gray-500 mb-4">
            {auditData.totalCount === 0 
              ? "No audit logs have been recorded yet. Audit logging will start tracking activities automatically."
              : "No audit logs match your current filters. Try adjusting the filter criteria."
            }
          </p>
          {auditData.totalCount === 0 && (
            <div className="text-sm text-gray-400">
              <p>Audit logs will be created when users perform actions like:</p>
              <ul className="mt-2 space-y-1">
                <li>• Creating or cancelling bookings</li>
                <li>• Assigning mechanics</li>
                <li>• Starting or completing services</li>
                <li>• Managing master data</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}