'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui';

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
      <Alert variant="warning" className="mb-4">
        <h3 className="font-medium mb-1">
          Mekanik Overload
        </h3>
        <div>
          <p>
            {overloadData.mechanicName} sedang overload ({overloadData.overloadPercentage}% kapasitas).
          </p>
          <p className="mt-1">
            Beban saat ini: {overloadData.currentLoad}/{overloadData.maxCapacity} booking
          </p>
        </div>
      </Alert>
    );
  }

  // System-wide warning
  if (showSystemWarning && overloadData.systemOverloadPercentage && overloadData.systemOverloadPercentage > 30) {
    const isCritical = overloadData.systemOverloadPercentage > 50;

    return (
      <Alert variant={isCritical ? "error" : "warning"} className="mb-6">
        <h3 className="font-medium mb-1">
          {isCritical ? 'Sistem Overload Kritis' : 'Peringatan Sistem Overload'}
        </h3>
        <div>
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
      </Alert>
    );
  }

  return null;
}