'use client';

import { useState } from 'react';
import { cancelBooking } from '@/lib/bookings/cancel-actions';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@/components/ui';

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
    <div className="w-full sm:w-auto">
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!canCancel || !isCancellableStatus}
        variant="danger"
        fullWidth
      >
        {!isCancellableStatus ? `Tidak Bisa Dibatalkan (${status})` :
         !canCancel ? 'Tidak Bisa Dibatalkan (H-1)' : 
         'Batalkan Booking'}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError(null);
        }}
        title="Konfirmasi Pembatalan"
      >
        <p className="text-gray-700 mb-6">
          Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setIsOpen(false);
              setError(null);
            }}
            disabled={isLoading}
            variant="secondary"
            fullWidth
          >
            Batal
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="danger"
            fullWidth
          >
            {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
