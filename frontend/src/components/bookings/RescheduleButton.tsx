'use client';

import { useState } from 'react';
import RescheduleForm from './RescheduleForm';
import { useRouter } from 'next/navigation';

interface RescheduleButtonProps {
  bookingId: string;
  currentSchedule: string;
  status: string;
}

export default function RescheduleButton({
  bookingId,
  currentSchedule,
  status,
}: RescheduleButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Check if reschedule is allowed based on status
  const canReschedule = !['in_progress', 'done', 'cancelled'].includes(status);

  // Check H-1 rule
  const scheduleDate = new Date(currentSchedule);
  const now = new Date();
  const hoursDiff = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithin24Hours = hoursDiff < 24;

  if (!canReschedule) {
    return null;
  }

  const handleSuccess = () => {
    setShowForm(false);
    router.refresh();
  };

  return (
    <div>
      {!showForm ? (
        <div>
          <button
            onClick={() => setShowForm(true)}
            disabled={isWithin24Hours}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reschedule Booking
          </button>
          {isWithin24Hours && (
            <p className="text-xs text-red-600 mt-1">
              Reschedule hanya dapat dilakukan minimal H-1 (24 jam sebelum jadwal)
            </p>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">Reschedule Booking</h3>
          <RescheduleForm
            bookingId={bookingId}
            currentSchedule={currentSchedule}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
