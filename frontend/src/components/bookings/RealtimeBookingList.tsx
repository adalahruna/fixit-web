'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RealtimeBookingList() {
  const router = useRouter();

  useEffect(() => {
    // Subscribe to realtime changes on bookings table
    const channel = supabase
      .channel('bookings-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('[Realtime] Bookings list updated:', payload);
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_progress',
        },
        (payload) => {
          console.log('[Realtime] Service progress updated:', payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Bookings list subscription status:', status);
      });

    // Fallback polling (every 15 seconds)
    const pollingInterval = setInterval(() => {
      console.log('[Polling] Refreshing bookings list...');
      router.refresh();
    }, 15000);

    return () => {
      console.log('[Realtime] Cleaning up bookings list subscription');
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This component only handles subscriptions
}
