'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface RealtimeBookingStatusProps {
  bookingId: string;
  initialStatus: string;
}

export default function RealtimeBookingStatus({
  bookingId,
  initialStatus,
}: RealtimeBookingStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('[Realtime] Booking updated:', payload);
          if (payload.new && 'status' in payload.new) {
            setStatus(payload.new.status as string);
            setLastUpdate(new Date());
            router.refresh();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_progress',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('[Realtime] Service progress updated:', payload);
          setLastUpdate(new Date());
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    // Fallback polling (every 15 seconds)
    const pollingInterval = setInterval(() => {
      console.log('[Polling] Refreshing booking data...');
      router.refresh();
    }, 15000);

    return () => {
      console.log('[Realtime] Cleaning up subscription');
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      queued: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-green-100 text-green-800',
      done: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      queued: 'Dalam Antrian',
      in_progress: 'Sedang Dikerjakan',
      done: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  return (
    <div>
      <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusBadge(status)}`}>
        {getStatusLabel(status)}
      </span>
      {lastUpdate && (
        <p className="text-xs text-gray-500 mt-1">
          Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
        </p>
      )}
    </div>
  );
}
