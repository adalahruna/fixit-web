'use client';

import { useActionState, useEffect } from 'react';
import { createMechanic, updateMechanic } from '@/lib/mechanics/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  // Redirect after successful update
  useEffect(() => {
    if (state?.success && mechanic) {
      const timer = setTimeout(() => {
        router.push('/admin/mechanics');
      }, 2000); // Redirect after 2 seconds to show success message

      return () => clearTimeout(timer);
    }
  }, [state?.success, mechanic, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md">
          <div className="font-medium text-green-800 mb-2">{state.success}</div>
          {state.accountInfo && (
            <div className="bg-white p-3 rounded border border-green-200 mt-3">
              <p className="text-sm font-medium text-gray-900 mb-2">📧 Informasi Akun Login:</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Email:</span> {state.accountInfo.email}</p>
                <p><span className="font-medium">Password:</span> {state.accountInfo.password}</p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ⚠️ Simpan informasi ini dan berikan ke mekanik untuk login pertama kali.
              </p>
            </div>
          )}
          {mechanic && (
            <div className="text-xs mt-2 text-green-700">
              Akan kembali ke daftar mekanik dalam 2 detik...
            </div>
          )}
        </div>
      )}

      {mechanic && (
        <input type="hidden" name="id" value={mechanic.id} />
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nama Mekanik *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={mechanic?.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contoh: Budi Santoso"
        />
      </div>

      {!mechanic && (
        <>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Akun Login</h3>
            <p className="text-xs text-gray-600 mb-3">
              Akun ini akan digunakan mekanik untuk login dan melihat tiket mereka.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contoh@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">Email untuk login mekanik</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimal 6 karakter"
            />
            <p className="text-xs text-gray-500 mt-1">Password untuk login (minimal 6 karakter)</p>
          </div>
        </>
      )}

      <div>
        <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select
          id="is_active"
          name="is_active"
          defaultValue={mechanic?.is_active ? 'true' : 'false'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      <div>
        <label htmlFor="daily_capacity_minutes" className="block text-sm font-medium text-gray-700 mb-1">
          Kapasitas Harian (menit)
        </label>
        <input
          id="daily_capacity_minutes"
          name="daily_capacity_minutes"
          type="number"
          min="0"
          defaultValue={mechanic?.daily_capacity_minutes}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="480 (8 jam)"
        />
        <p className="text-xs text-gray-500 mt-1">Opsional. Contoh: 480 menit = 8 jam kerja</p>
      </div>

      <div>
        <label htmlFor="skill_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Catatan Skill/Keahlian
        </label>
        <textarea
          id="skill_notes"
          name="skill_notes"
          rows={3}
          defaultValue={mechanic?.skill_notes}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contoh: Spesialis mesin, kelistrikan"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          {mechanic ? 'Update' : 'Simpan'}
        </button>
        <Link
          href="/admin/mechanics"
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
