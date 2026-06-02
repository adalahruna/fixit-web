'use client';

import { useActionState } from 'react';
import { linkMechanicWithUser } from '@/lib/mechanics/actions';

interface LinkMechanicFormProps {
  mechanics: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email: string }>;
}

export function LinkMechanicForm({ mechanics, users }: LinkMechanicFormProps) {
  const [state, formAction] = useActionState(linkMechanicWithUser, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="mechanic_id" className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Mekanik *
        </label>
        <select
          id="mechanic_id"
          name="mechanic_id"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih Mekanik --</option>
          {mechanics.map((mechanic) => (
            <option key={mechanic.id} value={mechanic.id}>
              {mechanic.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
          Pilih User *
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih User --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Hubungkan
        </button>
      </div>
    </form>
  );
}