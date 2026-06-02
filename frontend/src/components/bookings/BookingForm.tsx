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

// Service icon mapping
const serviceIcons: Record<string, string> = {
  'Ganti Oli': 'fa-oil-can',
  'Ganti Ban': 'fa-truck-monster',
  'Servis Rutin': 'fa-gear',
  'Cek Kelistrikan': 'fa-bolt',
  'Kampas Rem': 'fa-dharmachakra',
  'Servis CVT/Rantai': 'fa-link',
};

export function BookingForm({ services }: BookingFormProps) {
  const [state, formAction] = useActionState(createBooking, null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [timeError, setTimeError] = useState('');
  const [slotStatus, setSlotStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [consultationText, setConsultationText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  // Validate operational hours and check if time is in the past
  const validateOperationalHours = (time: string, date: string) => {
    if (!time) {
      setTimeError('');
      return true;
    }

    // Check if datetime is in the past
    if (date && time) {
      const scheduleDateTime = new Date(`${date}T${time}:00+07:00`);
      const now = new Date();
      
      if (scheduleDateTime <= now) {
        setTimeError('Tidak dapat booking di waktu yang sudah lewat');
        return false;
      }
    }

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startTime = 8 * 60;
    const endTime = 17 * 60;

    if (timeInMinutes < startTime || timeInMinutes > endTime) {
      setTimeError('Jam operasional: 08:00 - 17:00 WIB');
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setSelectedTime(time);
    validateOperationalHours(time, selectedDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (selectedTime) {
      validateOperationalHours(selectedTime, date);
    }
  };

  // Calculate estimated duration based on selected services
  const estimatedDuration = selectedServices.length > 0
    ? services
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.default_duration_minutes, 0)
    : 60;

  // Calculate total price
  const totalPrice = selectedServices.length > 0
    ? services
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + (s.price || 0), 0)
    : 0;

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

  const getServiceIcon = (serviceName: string) => {
    return serviceIcons[serviceName] || 'fa-wrench';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      setPhotoError('');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Format file tidak valid. Gunakan JPG, PNG, atau WebP');
      setPhotoPreview(null);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError('Ukuran file terlalu besar. Maksimal 5MB');
      setPhotoPreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setPhotoError('');
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoError('');
  };

  return (
    <div className="flex gap-8 items-start">
      <form action={formAction} className="flex-1 space-y-8">
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
            {state.error}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <i className="fa-solid fa-motorcycle text-blue-600 text-xl"></i>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Detail Kendaraan</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label htmlFor="vehicle_type" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Merk & Model
              </label>
              <input
                type="text"
                id="vehicle_type"
                name="vehicle_type"
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="Honda Vario 150"
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="vehicle_plate" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Nomor Polisi
              </label>
              <input
                type="text"
                id="vehicle_plate"
                name="vehicle_plate"
                required
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="L 1234 AB"
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <i className="fa-solid fa-screwdriver-wrench text-blue-600 text-xl"></i>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Jenis Servis</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-5">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={`bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-600 shadow-md' : 'shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="service_ids"
                    value={service.id}
                    checked={isSelected}
                    onChange={() => handleServiceToggle(service.id)}
                    className="hidden"
                  />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <i className={`fa-solid ${getServiceIcon(service.name)} text-lg`}></i>
                  </div>
                  <h3 className="text-base font-bold mb-2">{service.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-5 min-h-[40px]">
                    {service.description || 'Layanan servis profesional'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600">
                      {service.default_duration_minutes} Menit
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {service.price ? `Rp ${service.price.toLocaleString('id-ID')}` : 'Gratis'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <i className="fa-regular fa-calendar-days text-blue-600 text-xl"></i>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Jadwal Service</h2>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label htmlFor="scheduled_date" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Tanggal
              </label>
              <input
                type="date"
                id="scheduled_date"
                name="scheduled_date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full px-4 py-3 bg-white border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Jam (WIB)
              </label>
              <input
                type="time"
                id="scheduled_time"
                name="scheduled_time"
                required
                min="08:00"
                max="17:00"
                value={selectedTime}
                onChange={handleTimeChange}
                className={`w-full px-4 py-3 bg-white border-none rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  timeError ? 'ring-2 ring-red-500' : 'focus:ring-blue-600'
                }`}
              />
              {timeError && (
                <p className="text-xs text-red-600 mt-2">{timeError}</p>
              )}
            </div>
          </div>

          {selectedDate && selectedTime && (
            <div className="mt-4">
              {slotStatus.checking ? (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm text-blue-700">
                  🔄 Memeriksa ketersediaan slot...
                </div>
              ) : slotStatus.available === true ? (
                <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-sm text-green-700">
                  ✅ {slotStatus.message}
                </div>
              ) : slotStatus.available === false ? (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm text-red-700">
                  ❌ {slotStatus.message}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <i className="fa-regular fa-file-lines text-blue-600 text-xl"></i>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Keluhan / Konsultasi</h2>
          </div>
          
          <textarea
            id="consultation_text"
            name="consultation_text"
            rows={5}
            value={consultationText}
            onChange={(e) => setConsultationText(e.target.value)}
            placeholder="Wajib diisi jika anda tidak memilih jenis servis"
            className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />

          {/* Photo Upload Section */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Foto Keluhan (Opsional)
            </label>
            
            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-3"></i>
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, atau WebP (Max. 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full h-64 bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Preview foto keluhan"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {photoError && (
              <p className="text-xs text-red-600 mt-2">{photoError}</p>
            )}

            {/* Hidden input to store base64 photo data */}
            {photoPreview && (
              <input type="hidden" name="complaint_photo" value={photoPreview} />
            )}
          </div>
        </div>
      </form>

      <div className="w-[380px] sticky top-6 space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold mb-6">Ringkasan Pesanan</h2>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Layanan Terpilih
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>{selectedServices.length > 0 ? `${selectedServices.length} layanan` : '-'}</span>
                <span className="text-blue-600">
                  {totalPrice > 0 ? `Rp ${totalPrice.toLocaleString('id-ID')}` : 'Rp -'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Keluhan / Konsultasi
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>{consultationText ? 'Ada keluhan' : '-'}</span>
                <span className="text-blue-600">Rp -</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Tanggal & Waktu
              </div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <i className="fa-regular fa-calendar text-gray-500"></i>
                <span>{selectedDate && selectedTime ? `${selectedDate} • ${selectedTime}` : '-'}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Kendaraan
              </div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <i className="fa-solid fa-motorcycle text-gray-500"></i>
                <span>{vehicleType || vehiclePlate ? `${vehicleType} ${vehiclePlate}` : '-'}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-5"></div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold">Estimasi Total</span>
            <span className="text-2xl font-extrabold text-blue-600">
              {totalPrice > 0 ? `Rp ${totalPrice.toLocaleString('id-ID')}` : 'Rp -'}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-3.5 bg-white text-gray-900 border-2 border-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={slotStatus.available === false || !!timeError}
              className="flex-[2.5] px-4 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Konfirmasi Pesanan
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <i className="fa-solid fa-shield-check text-blue-600 text-lg mt-0.5"></i>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">Mekanik Bersertifikat</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Teknisi kami bersertifikat untuk motor performa tinggi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
