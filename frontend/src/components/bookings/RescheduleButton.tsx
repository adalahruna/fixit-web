'use client';

import { useState } from 'react';
import RescheduleForm from './RescheduleForm';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui';

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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
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
    setShowSuccessToast(true);
    // Delay refresh to allow user to see the toast
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  return (
    <div className="w-full sm:w-auto">
      {!showForm ? (
        <div>
          <button
            onClick={() => setShowForm(true)}
            disabled={isWithin24Hours}
            className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reschedule Booking
          </button>
          {isWithin24Hours && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              Reschedule hanya dapat dilakukan minimal H-1 (24 jam sebelum jadwal)
            </p>
          )}
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50 w-full">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Reschedule Booking</h3>
          <RescheduleForm
            bookingId={bookingId}
            currentSchedule={currentSchedule}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {showSuccessToast && (
        <Toast
          message="Booking berhasil di-reschedule!"
          variant="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
}
