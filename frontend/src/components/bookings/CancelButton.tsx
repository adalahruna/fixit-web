'use client';

import { useState } from 'react';
import { cancelBooking } from '@/lib/bookings/cancel-actions';
import { useRouter } from 'next/navigation';

interface CancelButtonProps {
  bookingId: string;
  currentSchedule: string;
  status: string;
}

export default function CancelButton({ 
  bookingId, 
  currentSchedule, 
  status 
}: CancelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const cancellableStatuses = ['pending', 'confirmed', 'queued'];
  const isCancellableStatus = cancellableStatuses.includes(status);
  
  const scheduleDate = new Date(currentSchedule);
  const now = new Date();
  const hoursDiff = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = hoursDiff >= 24;

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    const result = await cancelBooking(bookingId);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.refresh();
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canCancel || !isCancellableStatus}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
          (canCancel && isCancellableStatus)
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {!isCancellableStatus ? `Status ${status} tidak bisa dibatalkan` :
         !canCancel ? 'Tidak Bisa Dibatalkan (H-1)' : 
         'Batalkan Booking'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Konfirmasi Pembatalan
            </h3>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
