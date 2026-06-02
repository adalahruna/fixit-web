'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface PrioritySelectorProps {
  bookingId: string;
  currentPriority: number;
}

export default function PrioritySelector({ bookingId, currentPriority }: PrioritySelectorProps) {
  const [priority, setPriority] = useState(currentPriority);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const priorityOptions = [
    { value: 1, label: 'Urgent', icon: '🔥', bg: 'from-red-500 to-red-600', hover: 'hover:from-red-600 hover:to-red-700' },
    { value: 2, label: 'High', icon: '⚡', bg: 'from-orange-500 to-orange-600', hover: 'hover:from-orange-600 hover:to-orange-700' },
    { value: 3, label: 'Normal', icon: '📋', bg: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700' },
    { value: 4, label: 'Low', icon: '📌', bg: 'from-gray-500 to-gray-600', hover: 'hover:from-gray-600 hover:to-gray-700' },
  ];

  const handlePriorityChange = async (newPriority: number) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ priority: newPriority })
        .eq('id', bookingId);

      if (error) throw error;

      setPriority(newPriority);
      setMessage({ type: 'success', text: 'Prioritas berhasil diperbarui!' });
      router.refresh();
    } catch (error) {
      console.error('Error updating priority:', error);
      setMessage({ type: 'error', text: 'Gagal memperbarui prioritas. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Prioritas Booking</h3>
        {message && (
          <span className={`text-xs font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {priorityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePriorityChange(option.value)}
            disabled={isLoading || priority === option.value}
            className={`
              relative p-4 rounded-xl font-bold text-white shadow-lg transition-all transform
              ${priority === option.value 
                ? `bg-gradient-to-br ${option.bg} ring-4 ring-offset-2 ring-${option.value === 1 ? 'red' : option.value === 2 ? 'orange' : option.value === 3 ? 'blue' : 'gray'}-300 scale-105` 
                : `bg-gradient-to-br ${option.bg} opacity-60 ${option.hover}`
              }
              ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              disabled:opacity-40
            `}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">{option.icon}</span>
              <span className="text-xs uppercase tracking-wider">{option.label}</span>
            </div>
            {priority === option.value && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1">
              Prioritas mempengaruhi urutan antrian mekanik
            </p>
            <p className="text-xs text-blue-700">
              Booking dengan prioritas lebih tinggi akan muncul di atas antrian
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
