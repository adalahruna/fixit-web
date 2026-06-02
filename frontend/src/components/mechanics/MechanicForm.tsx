'use client';

import { useActionState, useEffect } from 'react';
import { createMechanic, updateMechanic } from '@/lib/mechanics/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea, Button, Alert } from '@/components/ui';

interface MechanicFormProps {
  mechanic?: {
    id: string;
    name: string;
    is_active: boolean;
    daily_capacity_minutes?: number;
    skill_notes?: string;
  };
}

type FormState = 
  | {
      error: string;
      success?: never;
      accountInfo?: never;
    }
  | {
      error?: never;
      success: string;
      accountInfo?: {
        email: string;
        password: string;
      };
    }
  | null;

export function MechanicForm({ mechanic }: MechanicFormProps) {
  const action = mechanic ? updateMechanic : createMechanic;
  const [state, formAction] = useActionState<FormState, FormData>(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && mechanic) {
      const timer = setTimeout(() => {
        router.push('/admin/mechanics');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, mechanic, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {mechanic ? 'Edit Data Mekanik' : 'Tambah Mekanik Baru'}
              </h1>
              <p className="text-blue-100 mt-1">
                {mechanic 
                  ? 'Perbarui informasi mekanik yang sudah ada' 
                  : 'Daftarkan mekanik baru dan buat akun login untuk mereka'}
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

            {state?.success && (
              <Alert variant="success">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900 mb-3">{state.success}</div>
                    {state.accountInfo && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-300 shadow-md">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-lg font-bold text-gray-900">Informasi Akun Login</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl text-gray-900 space-y-3 font-mono border-2 border-gray-200 shadow-sm">
                          <div className="flex items-start gap-4">
                            <span className="font-bold w-28 text-blue-700">Email:</span>
                            <span className="flex-1 break-all font-semibold">{state.accountInfo.email}</span>
                          </div>
                          <div className="flex items-start gap-4">
                            <span className="font-bold w-28 text-blue-700">Password:</span>
                            <span className="flex-1 font-semibold">{state.accountInfo.password}</span>
                          </div>
                        </div>
                        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-4 shadow-md">
                          <p className="text-sm text-gray-800 flex items-start gap-2 font-semibold">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Penting: Simpan dan berikan informasi ini ke mekanik untuk login pertama kali!</span>
                          </p>
                        </div>
                      </div>
                    )}
                    {mechanic && (
                      <div className="text-sm mt-3 text-green-700 font-semibold">
                        Akan kembali ke daftar mekanik dalam 2 detik...
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {mechanic && <input type="hidden" name="id" value={mechanic.id} />}

            {/* Informasi Pribadi */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Informasi Pribadi</h2>
              </div>
              <Input
                id="name" name="name" type="text" label="Nama Mekanik" required
                defaultValue={mechanic?.name} placeholder="Contoh: Budi Santoso"
                helperText="Nama lengkap mekanik yang akan ditampilkan di sistem"
              />
            </div>

            {/* Akun Login */}
            {!mechanic && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Akun Login</h2>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-gray-700 mb-5 font-semibold">
                    Buat akun login yang akan digunakan mekanik untuk mengakses dashboard mereka.
                  </p>
                  <div className="space-y-5">
                    <Input id="email" name="email" type="email" label="Email" required
                      placeholder="contoh@email.com" helperText="Email untuk login ke sistem" />
                    <Input id="password" name="password" type="password" label="Password" required minLength={6}
                      placeholder="Minimal 6 karakter" helperText="Buat password yang mudah diingat (minimal 6 karakter)" />
                  </div>
                </div>
              </div>
            )}

            {/* Status & Kapasitas */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-green-200">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Status & Kapasitas Kerja</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Status Ketersediaan</h3>
                  </div>
                  <Select id="is_active" name="is_active" label="Status" defaultValue={mechanic?.is_active ? 'true' : 'false'}>
                    <option value="true">Aktif (Bisa menerima pekerjaan)</option>
                    <option value="false">Nonaktif (Tidak menerima pekerjaan)</option>
                  </Select>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Kapasitas Harian</h3>
                  </div>
                  <Input id="daily_capacity_minutes" name="daily_capacity_minutes" type="number" label="Kapasitas Harian (menit)"
                    min={0} max={960} defaultValue={mechanic?.daily_capacity_minutes} placeholder="480 (8 jam)"
                    helperText="Contoh: 480 menit = 8 jam kerja per hari" />
                </div>
              </div>
            </div>

            {/* Keahlian */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Keahlian & Catatan</h2>
              </div>
              <Textarea id="skill_notes" name="skill_notes" label="Catatan Skill/Keahlian" rows={5}
                defaultValue={mechanic?.skill_notes}
                placeholder="Contoh: Spesialis mesin Honda & Yamaha, ahli kelistrikan motor"
                helperText="Jelaskan keahlian khusus atau catatan penting tentang mekanik ini" />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
              <Button type="submit" variant="primary" size="lg" className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="flex items-center justify-center gap-2 text-lg font-bold">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {mechanic ? 'Update Mekanik' : 'Simpan Mekanik'}
                </span>
              </Button>
              <Link href="/admin/mechanics"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border-2 border-gray-300 transition-all font-semibold text-lg shadow-md hover:shadow-lg">
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
