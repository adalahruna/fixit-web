'use client';

import { Alert } from '@/components/ui';

interface SLAWarningProps {
  bookingId: string;
  isLate?: boolean;
  isAtRisk?: boolean;
  delayMinutes?: number;
  estimatedEnd?: string;
  className?: string;
}

export default function SLAWarning({ 
  bookingId, 
  isLate = false, 
  isAtRisk = false, 
  delayMinutes = 0,
  estimatedEnd,
  className = ""
}: SLAWarningProps) {
  if (!isLate && !isAtRisk) {
    return null;
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  if (isLate) {
    return (
      <Alert variant="error" className={className}>
        <h3 className="font-medium mb-1">
          Terlambat dari SLA
        </h3>
        <div>
          <p>Booking ini terlambat {delayMinutes} menit dari estimasi.</p>
          {estimatedEnd && (
            <p className="text-xs mt-1">
              Target selesai: {formatTime(estimatedEnd)} WIB
            </p>
          )}
        </div>
      </Alert>
    );
  }

  if (isAtRisk) {
    return (
      <Alert variant="warning" className={className}>
        <h3 className="font-medium mb-1">
          Berisiko Terlambat
        </h3>
        <div>
          <p>Booking ini berisiko melewati SLA target.</p>
          {estimatedEnd && (
            <p className="text-xs mt-1">
              Target selesai: {formatTime(estimatedEnd)} WIB
            </p>
          )}
        </div>
      </Alert>
    );
  }

  return null;
}