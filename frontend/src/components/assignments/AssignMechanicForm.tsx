'use client';

import { useState, useEffect } from 'react';
import { assignMechanic, unassignMechanic } from '@/lib/assignments/actions';
import { Toast } from '@/components/ui';

interface Mechanic {
  id: string;
  name: string;
}

interface MechanicWithWorkload extends Mechanic {
  activeBookings?: number;
  workloadPercentage?: number;
}

interface AssignMechanicFormProps {
  bookingId: string;
  currentMechanicId?: string;
  mechanics: Mechanic[];
  isAssigned: boolean;
}

export function AssignMechanicForm({ 
  bookingId, 
  currentMechanicId,
  mechanics, 
  isAssigned 
}: AssignMechanicFormProps) {
  const [selectedMechanicId, setSelectedMechanicId] = useState(currentMechanicId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mechanicsWithWorkload, setMechanicsWithWorkload] = useState<MechanicWithWorkload[]>(mechanics);
  const [loadingWorkload, setLoadingWorkload] = useState(true);

  useEffect(() => {
    async function fetchWorkloadData() {
      try {
        // Fetch workload for all mechanics
        const workloadPromises = mechanics.map(async (mechanic) => {
          try {
            const response = await fetch(`/api/overload/mechanic/${mechanic.id}`);
            if (response.ok) {
              const data = await response.json();
              return {
                ...mechanic,
                activeBookings: data.currentLoad || 0,
                workloadPercentage: data.overloadPercentage || 0,
              };
            }
          } catch (error) {
            console.error(`Error fetching workload for mechanic ${mechanic.id}:`, error);
          }
          return {
            ...mechanic,
            activeBookings: 0,
            workloadPercentage: 0,
          };
        });

        const results = await Promise.all(workloadPromises);
        // Sort by workload percentage (ascending) - show least loaded first
        results.sort((a, b) => (a.workloadPercentage || 0) - (b.workloadPercentage || 0));
        setMechanicsWithWorkload(results);
      } catch (error) {
        console.error('Error fetching workload data:', error);
        setMechanicsWithWorkload(mechanics);
      } finally {
        setLoadingWorkload(false);
      }
    }

    fetchWorkloadData();
  }, [mechanics]);

  const handleAssign = async () => {
    if (!selectedMechanicId) {
      setError('Pilih mekanik terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await assignMechanic(bookingId, selectedMechanicId);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccessMessage('Mekanik berhasil di-assign!');
      setShowSuccessToast(true);
      setTimeout(() => {
        // Force hard reload to clear all cache
        window.location.href = window.location.href;
      }, 1500);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Yakin ingin unassign mekanik dari booking ini?')) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await unassignMechanic(bookingId);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccessMessage('Mekanik berhasil di-unassign!');
      setShowSuccessToast(true);
      setTimeout(() => {
        // Force hard reload to clear all cache
        window.location.href = window.location.href;
      }, 1500);
    }
  };

  const getWorkloadBadge = (percentage: number) => {
    if (percentage >= 100) {
      return { 
        label: '🔥 OVERLOAD', 
        className: 'bg-red-500 text-white',
        barColor: 'bg-red-500'
      };
    } else if (percentage >= 80) {
      return { 
        label: '⚠️ HIGH', 
        className: 'bg-orange-500 text-white',
        barColor: 'bg-orange-500'
      };
    } else if (percentage >= 50) {
      return { 
        label: '📊 MEDIUM', 
        className: 'bg-yellow-500 text-white',
        barColor: 'bg-yellow-500'
      };
    } else {
      return { 
        label: '✅ LOW', 
        className: 'bg-green-500 text-white',
        barColor: 'bg-green-500'
      };
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="mechanic" className="block text-sm font-bold text-gray-700 mb-3">
          {isAssigned ? 'Ganti Mekanik' : 'Pilih Mekanik'}
        </label>
        
        {loadingWorkload ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Loading workload data...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mechanicsWithWorkload.map((mechanic) => {
              const workloadInfo = getWorkloadBadge(mechanic.workloadPercentage || 0);
              const isSelected = selectedMechanicId === mechanic.id;
              const isOverloaded = (mechanic.workloadPercentage || 0) >= 100;

              return (
                <div
                  key={mechanic.id}
                  onClick={() => !loading && setSelectedMechanicId(mechanic.id)}
                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : isOverloaded
                      ? 'border-red-200 bg-red-50 hover:border-red-300'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="mechanic"
                        value={mechanic.id}
                        checked={isSelected}
                        onChange={() => setSelectedMechanicId(mechanic.id)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-bold text-gray-900">{mechanic.name}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${workloadInfo.className}`}>
                      {workloadInfo.label}
                    </span>
                  </div>

                  {/* Workload Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-semibold">
                        {mechanic.activeBookings || 0} active bookings
                      </span>
                      <span className="font-bold text-gray-900">
                        {Math.round(mechanic.workloadPercentage || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${workloadInfo.barColor}`}
                        style={{ width: `${Math.min(mechanic.workloadPercentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {isOverloaded && (
                    <div className="mt-2 text-xs text-red-700 font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Mekanik overload - pertimbangkan pilihan lain
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleAssign}
          disabled={loading || !selectedMechanicId || loadingWorkload}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : isAssigned ? 'Ganti Mekanik' : 'Assign Mekanik'}
        </button>
        
        {isAssigned && (
          <button
            onClick={handleUnassign}
            disabled={loading || loadingWorkload}
            className="px-4 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-semibold transition-all"
          >
            Unassign
          </button>
        )}
      </div>

      {showSuccessToast && (
        <Toast
          message={successMessage}
          variant="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
}
