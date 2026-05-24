'use client';

import { useState } from 'react';
import { rescheduleBooking } from '@/lib/bookings/reschedule-actions';

interface RescheduleFormProps {
  bookingId: string;
  currentSchedule: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RescheduleForm({
  bookingId,
  currentSchedule,
  onSuccess,
  onCancel,
}: RescheduleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState('');

  // Validate operational hours
  const validateOperationalHours = (time: string) => {
    if (!time) {
      setTimeError('');
      return true;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startTime = 8 * 60; // 08:00
    const endTime = 17 * 60; // 17:00

    if (timeInMinutes < startTime || timeInMinutes > endTime) {
      setTimeError('Jam operasional: 08:00 - 17:00 WIB');
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newDate = formData.get('newDate') as string;
    const newTime = formData.get('newTime') as string;

    const result = await rescheduleBooking(bookingId, newDate, newTime);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jadwal Saat Ini
        </label>
        <p className="text-gray-600">
          {new Date(currentSchedule).toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div>
        <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 mb-1">
          Tanggal Baru <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="newDate"
          name="newDate"
          min={minDate}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimal H-1 (24 jam sebelum jadwal saat ini)
        </p>
      </div>

      <div>
        <label htmlFor="newTime" className="block text-sm font-medium text-gray-700 mb-1">
          Jam Baru (WIB) <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          id="newTime"
          name="newTime"
          min="08:00"
          max="17:00"
          required
          onChange={(e) => validateOperationalHours(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            timeError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {timeError && (
          <p className="text-xs text-red-600 mt-1">{timeError}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Jam operasional: 08:00 - 17:00 WIB
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !!timeError}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Memproses...' : 'Reschedule'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
