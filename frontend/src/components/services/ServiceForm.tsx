'use client';

import { useActionState } from 'react';
import { createService, updateService } from '@/lib/services/actions';
import Link from 'next/link';
import { Input, Textarea, Button, Alert } from '@/components/ui';

interface ServiceFormProps {
  service?: {
    id: string;
    name: string;
    description?: string;
    default_duration_minutes: number;
    price?: number;
  };
}

export function ServiceForm({ service }: ServiceFormProps) {
  const action = service ? updateService : createService;
  const [state, formAction] = useActionState(action, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {service ? 'Edit Jenis Servis' : 'Tambah Jenis Servis Baru'}
              </h1>
              <p className="text-blue-100 mt-1">
                {service 
                  ? 'Perbarui informasi jenis servis yang sudah ada' 
                  : 'Masukkan detail jenis servis yang akan ditambahkan ke sistem'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-lg">
          <form action={formAction} className="p-8 space-y-8">
            {state?.error && (
              <Alert variant="error">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{state.error}</span>
                </div>
              </Alert>
            )}

            {service && (
              <input type="hidden" name="id" value={service.id} />
            )}

            {/* Informasi Dasar Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Informasi Dasar</h2>
              </div>
              
              <Input
                id="name"
                name="name"
                type="text"
                label="Nama Servis"
                required
                defaultValue={service?.name}
                placeholder="Contoh: Ganti Oli, Service Rutin, Tune Up"
                helperText="Nama jenis servis yang akan ditampilkan ke pelanggan"
              />

              <Textarea
                id="description"
                name="description"
                label="Deskripsi"
                rows={5}
                defaultValue={service?.description}
                placeholder="Jelaskan detail servis ini, pekerjaan apa saja yang dilakukan, dll."
                helperText="Deskripsi detail untuk membantu pelanggan memahami servis ini (opsional)"
              />
            </div>

            {/* Durasi dan Harga Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-green-200">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Durasi & Harga</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Durasi Card */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Durasi Pengerjaan</h3>
                  </div>
                  <Input
                    id="default_duration_minutes"
                    name="default_duration_minutes"
                    type="number"
                    label="Durasi Standar (menit)"
                    required
                    min={1}
                    max={960}
                    defaultValue={service?.default_duration_minutes}
                    placeholder="30"
                    helperText="Estimasi waktu pengerjaan standar"
                  />
                </div>

                {/* Harga Card */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Biaya Servis</h3>
                  </div>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    label="Harga (Rp)"
                    min={0}
                    step={1000}
                    defaultValue={service?.price}
                    placeholder="75000"
                    helperText="Harga standar servis (opsional)"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2 text-lg font-bold">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {service ? 'Update Servis' : 'Simpan Servis'}
                </span>
              </Button>
              <Link
                href="/admin/services"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border-2 border-gray-300 transition-all font-semibold text-lg shadow-md hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
