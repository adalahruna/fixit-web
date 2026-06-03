'use client';

import { useEffect, useState } from 'react';

interface OverloadWarningProps {
  mechanicId?: string;
  showSystemWarning?: boolean;
}

interface OverloadData {
  mechanicName?: string;
  currentLoad: number;
  maxCapacity: number;
  overloadPercentage: number;
  queuedBookings?: number;
  inProgressBookings?: number;
  systemOverloadPercentage?: number;
  overloadedCount?: number;
  totalMechanics?: number;
}

export default function OverloadWarning({ mechanicId, showSystemWarning = false }: OverloadWarningProps) {
  const [overloadData, setOverloadData] = useState<OverloadData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverloadData() {
      try {
        const endpoint = mechanicId 
          ? `/api/overload/mechanic/${mechanicId}`
          : '/api/overload/system';
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setOverloadData(data);
        }
      } catch (error) {
        console.error('Error fetching overload data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOverloadData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchOverloadData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mechanicId]);

  if (loading || !overloadData) {
    return null;
  }

  // Individual mechanic warning
  if (mechanicId && !showSystemWarning) {
    if (overloadData.overloadPercentage < 80) {
      return null; // No warning needed
    }

    const isCritical = overloadData.overloadPercentage >= 100;

    return (
      <div className={`rounded-2xl border-2 p-6 mb-6 shadow-lg ${
        isCritical 
          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' 
          : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            isCritical ? 'bg-red-600' : 'bg-orange-600'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-2 ${isCritical ? 'text-red-900' : 'text-orange-900'}`}>
              {isCritical ? '🔥 Mekanik Overload Kritis!' : '⚠️ Mekanik High Workload'}
            </h3>
            <p className={`text-sm mb-3 ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
              <span className="font-bold">{overloadData.mechanicName}</span> sedang {isCritical ? 'overload' : 'mendekati overload'} dengan workload{' '}
              <span className="font-bold">{overloadData.overloadPercentage}%</span> dari kapasitas.
            </p>
            
            {/* Workload Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700">Workload</span>
                <span className="font-bold text-gray-900">
                  {overloadData.currentLoad}/{overloadData.maxCapacity} menit
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all ${
                    isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                  style={{ width: `${Math.min(overloadData.overloadPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Dalam Antrian</div>
                <div className="text-lg font-bold text-gray-900">{overloadData.queuedBookings || 0}</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Sedang Dikerjakan</div>
                <div className="text-lg font-bold text-gray-900">{overloadData.inProgressBookings || 0}</div>
              </div>
            </div>

            {isCritical && (
              <div className="mt-4 bg-white/70 rounded-lg p-3 border-2 border-red-200">
                <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pertimbangkan untuk memilih mekanik lain atau menunda booking ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // System-wide warning
  if (showSystemWarning && overloadData.systemOverloadPercentage && overloadData.systemOverloadPercentage > 30) {
    const isCritical = overloadData.systemOverloadPercentage > 50;

    return (
      <div className={`rounded-2xl border-2 p-6 mb-6 shadow-lg ${
        isCritical 
          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' 
          : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            isCritical ? 'bg-red-600' : 'bg-yellow-600'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-2 ${isCritical ? 'text-red-900' : 'text-yellow-900'}`}>
              {isCritical ? '🚨 Sistem Overload Kritis!' : '⚠️ Peringatan Sistem Overload'}
            </h3>
            <p className={`text-sm mb-3 ${isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
              <span className="font-bold">{overloadData.overloadedCount}</span> dari{' '}
              <span className="font-bold">{overloadData.totalMechanics}</span> mekanik sedang overload 
              ({overloadData.systemOverloadPercentage}% sistem).
            </p>

            {/* System Overload Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700">System Overload</span>
                <span className="font-bold text-gray-900">{overloadData.systemOverloadPercentage}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all ${
                    isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  }`}
                  style={{ width: `${Math.min(overloadData.systemOverloadPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {isCritical && (
              <div className="mt-4 bg-white/70 rounded-lg p-3 border-2 border-red-200">
                <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Pertimbangkan untuk menunda booking baru atau menambah kapasitas mekanik.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}