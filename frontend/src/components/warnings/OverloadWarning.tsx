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
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchOverloadData, 5 * 60 * 1000);
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

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Mekanik Overload
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {overloadData.mechanicName} sedang overload ({overloadData.overloadPercentage}% kapasitas).
              </p>
              <p className="mt-1">
                Beban saat ini: {overloadData.currentLoad}/{overloadData.maxCapacity} booking
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // System-wide warning
  if (showSystemWarning && overloadData.systemOverloadPercentage && overloadData.systemOverloadPercentage > 30) {
    const isCritical = overloadData.systemOverloadPercentage > 50;
    const bgColor = isCritical ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400';
    const iconColor = isCritical ? 'text-red-400' : 'text-yellow-400';
    const textColor = isCritical ? 'text-red-800' : 'text-yellow-800';
    const descColor = isCritical ? 'text-red-700' : 'text-yellow-700';

    return (
      <div className={`${bgColor} border-l-4 p-4 mb-6`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${textColor}`}>
              {isCritical ? 'Sistem Overload Kritis' : 'Peringatan Sistem Overload'}
            </h3>
            <div className={`mt-2 text-sm ${descColor}`}>
              <p>
                {overloadData.overloadedCount} dari {overloadData.totalMechanics} mekanik sedang overload 
                ({overloadData.systemOverloadPercentage}% sistem).
              </p>
              {isCritical && (
                <p className="mt-1 font-medium">
                  Pertimbangkan untuk menunda booking baru atau menambah kapasitas mekanik.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}