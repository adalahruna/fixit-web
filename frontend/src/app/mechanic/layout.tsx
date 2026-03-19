import { requireRole } from '@/lib/auth/utils';
import { logout } from '@/lib/auth/actions';
import Link from 'next/link';

export default async function MechanicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['mechanic']);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Panel Mekanik</h1>
              <div className="flex space-x-4">
                <Link href="/mechanic" className="text-gray-700 hover:text-blue-600">
                  Antrian Saya
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
