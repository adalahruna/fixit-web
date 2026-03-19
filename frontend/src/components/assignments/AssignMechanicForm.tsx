'use client';

import { useState } from 'react';
import { assignMechanic, unassignMechanic } from '@/lib/assignments/actions';

interface Mechanic {
  id: string;
  name: string;
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
    } else {
      window.location.reload();
    }
    
    setLoading(false);
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
    } else {
      window.location.reload();
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="mechanic" className="block text-sm font-medium text-gray-700 mb-2">
          {isAssigned ? 'Ganti Mekanik' : 'Pilih Mekanik'}
        </label>
        <select
          id="mechanic"
          value={selectedMechanicId}
          onChange={(e) => setSelectedMechanicId(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih Mekanik --</option>
          {mechanics.map((mechanic) => (
            <option key={mechanic.id} value={mechanic.id}>
              {mechanic.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAssign}
          disabled={loading || !selectedMechanicId}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : isAssigned ? 'Ganti Mekanik' : 'Assign Mekanik'}
        </button>
        
        {isAssigned && (
          <button
            onClick={handleUnassign}
            disabled={loading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Unassign
          </button>
        )}
      </div>
    </div>
  );
}
