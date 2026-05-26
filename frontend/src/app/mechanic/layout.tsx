import { requireRole } from '@/lib/auth/utils';
import Link from 'next/link';
import LogoutButton from '@/components/auth/LogoutButton';

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
              <LogoutButton />
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
