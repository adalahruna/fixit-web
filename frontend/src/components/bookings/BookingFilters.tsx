'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BookingFiltersProps {
  showMechanicFilter?: boolean;
  mechanics?: Array<{ id: string; name: string }>;
  showPriorityFilter?: boolean;
}

export default function BookingFilters({ showMechanicFilter = false, mechanics = [], showPriorityFilter = false }: BookingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [mechanicId, setMechanicId] = useState(searchParams.get('mechanicId') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'unassigned', label: '🔴 Belum Di-assign' },
    { value: 'confirmed', label: 'Dikonfirmasi' },
    { value: 'queued', label: 'Dalam Antrian' },
    { value: 'in_progress', label: 'Sedang Dikerjakan' },
    { value: 'done', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  const priorityOptions = [
    { value: '', label: 'Semua Prioritas' },
    { value: '1', label: '🔥 Urgent' },
    { value: '2', label: '⚡ High' },
    { value: '3', label: '📋 Normal' },
    { value: '4', label: '📌 Low' },
  ];

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (mechanicId) params.set('mechanicId', mechanicId);
    if (priority) params.set('priority', priority);
    
    router.push(`?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setMechanicId('');
    setPriority('');
    router.push(window.location.pathname);
  };

  // Auto-apply filters on change (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, dateFrom, dateTo, mechanicId, priority]);

  const hasActiveFilters = search || status || dateFrom || dateTo || mechanicId || priority;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Cari
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plat nomor, nama..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
          />
        </div>

        {/* Mechanic Filter (only for admin) */}
        {showMechanicFilter && mechanics.length > 0 && (
          <div>
            <label htmlFor="mechanicId" className="block text-sm font-medium text-gray-700 mb-1">
              Mekanik
            </label>
            <select
              id="mechanicId"
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            >
              <option value="">Semua Mekanik</option>
              {mechanics.map((mech) => (
                <option key={mech.id} value={mech.id}>
                  {mech.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Filter */}
        {showPriorityFilter && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioritas
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
