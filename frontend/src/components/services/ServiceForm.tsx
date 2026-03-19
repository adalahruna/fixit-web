'use client';

import { useActionState } from 'react';
import { createService, updateService } from '@/lib/services/actions';
import Link from 'next/link';

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
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      {service && (
        <input type="hidden" name="id" value={service.id} />
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nama Servis *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={service?.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contoh: Ganti Oli"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={service?.description}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Deskripsi servis (opsional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="default_duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
            Durasi Standar (menit) *
          </label>
          <input
            id="default_duration_minutes"
            name="default_duration_minutes"
            type="number"
            required
            min="1"
            defaultValue={service?.default_duration_minutes}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Harga (Rp)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1000"
            defaultValue={service?.price}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="75000"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          {service ? 'Update' : 'Simpan'}
        </button>
        <Link
          href="/admin/services"
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
