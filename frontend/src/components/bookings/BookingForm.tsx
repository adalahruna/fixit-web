'use client';

import { useActionState, useState, useEffect } from 'react';
import { createBooking } from '@/lib/bookings/actions';
import { localToUTC } from '@/lib/utils/datetime';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  default_duration_minutes: number;
  price: number | null;
}

interface BookingFormProps {
  services: ServiceType[];
}

export function BookingForm({ services }: BookingFormProps) {
  const [state, formAction] = useActionState(createBooking, null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [slotStatus, setSlotStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Calculate estimated duration based on selected services
  const estimatedDuration = selectedServices.length > 0
    ? services
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.default_duration_minutes, 0)
    : 60; // Default 60 minutes if no service selected

  // Check slot availability when date/time/services change
  useEffect(() => {
    const checkSlot = async () => {
      if (!selectedDate || !selectedTime) {
        return;
      }

      setSlotStatus({ checking: true });

      try {
        const scheduleStart = localToUTC(selectedDate, selectedTime);
        
        const response = await fetch('/api/check-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleStart,
            estimatedDurationMinutes: estimatedDuration,
          }),
        });

        const result = await response.json();
        setSlotStatus({
          checking: false,
          available: result.available,
          message: result.message,
        });
      } catch {
        setSlotStatus({
          checking: false,
          available: false,
          message: 'Gagal memeriksa ketersediaan slot',
        });
      }
    };

    // Debounce check
    const timer = setTimeout(checkSlot, 500);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedTime, estimatedDuration]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Jadwal Servis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Jadwal Servis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="scheduled_date"
              name="scheduled_date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-2">
              Jam (WIB) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="scheduled_time"
              name="scheduled_time"
              required
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Waktu Indonesia Barat (WIB)</p>
          </div>
        </div>

        {/* Slot Availability Feedback */}
        {selectedDate && selectedTime && (
          <div className="mt-4">
            {slotStatus.checking ? (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-700">
                🔄 Memeriksa ketersediaan slot...
              </div>
            ) : slotStatus.available === true ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md text-sm text-green-700">
                ✅ {slotStatus.message}
              </div>
            ) : slotStatus.available === false ? (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-700">
                ❌ {slotStatus.message}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Data Motor */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Data Motor</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700 mb-2">
              Merk & Model Motor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vehicle_type"
              name="vehicle_type"
              required
              placeholder="Contoh: Honda Vario 150, Yamaha NMAX, Suzuki Satria FU"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="vehicle_plate" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Plat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vehicle_plate"
              name="vehicle_plate"
              required
              placeholder="Contoh: L 1234 AB"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Jenis Servis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Jenis Servis</h2>
        <p className="text-sm text-gray-600 mb-4">
          Pilih jenis servis yang dibutuhkan (opsional). Jika tidak yakin, lewati dan isi keluhan di bawah.
        </p>
        
        <div className="space-y-3">
          {services.map((service) => (
            <label key={service.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                name="service_ids"
                value={service.id}
                checked={selectedServices.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{service.name}</div>
                {service.description && (
                  <div className="text-sm text-gray-600">{service.description}</div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  Durasi: {service.default_duration_minutes} menit
                  {service.price && ` • Rp ${service.price.toLocaleString('id-ID')}`}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Keluhan/Konsultasi */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Keluhan/Konsultasi</h2>
        <p className="text-sm text-gray-600 mb-4">
          Jelaskan gejala atau masalah yang dialami motor Anda. 
          <span className="text-red-500 font-medium"> Wajib diisi jika tidak memilih jenis servis.</span>
        </p>
        
        <textarea
          id="consultation_text"
          name="consultation_text"
          rows={5}
          placeholder="Contoh: Motor sering mati mendadak saat di lampu merah, suara mesin kasar, dll."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={slotStatus.available === false}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Buat Booking
        </button>
      </div>
    </form>
  );
}
