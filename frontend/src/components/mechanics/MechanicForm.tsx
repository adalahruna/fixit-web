'use client';

import { useActionState } from 'react';
import { createMechanic, updateMechanic } from '@/lib/mechanics/actions';
import Link from 'next/link';

interface MechanicFormProps {
  mechanic?: {
    id: string;
    name: string;
    is_active: boolean;
    daily_capacity_minutes?: number;
    skill_notes?: string;
  };
}

export function MechanicForm({ mechanic }: MechanicFormProps) {
  const action = mechanic ? updateMechanic : createMechanic;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {state.error}
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
