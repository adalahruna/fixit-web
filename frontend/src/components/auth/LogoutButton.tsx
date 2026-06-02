'use client';

import { logout } from '@/lib/auth/actions';
import { useTransition } from 'react';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Logging out...' : 'Logout'}
    </button>
  );
}
