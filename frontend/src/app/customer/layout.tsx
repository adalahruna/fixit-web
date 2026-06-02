import { requireRole } from '@/lib/auth/utils';
import { logout } from '@/lib/auth/actions';
import Link from 'next/link';
import Script from 'next/script';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['customer']);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Navbar with Gradient */}
        <nav className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              {/* Logo & Navigation */}
              <div className="flex items-center space-x-12">
                {/* Logo with Icon */}
                <Link href="/customer" className="flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
                      <path d="M4 12c0-2.21.9-4.21 2.35-5.65L8 8l2-2-1.65-1.65C9.79 3.9 11.79 3 14 3c1.87 0 3.62.64 5 1.71L17 7l2-2 2.29 2.29C22.36 8.38 23 10.13 23 12c0 2.21-.9 4.21-2.35 5.65L19 16l-2 2 1.65 1.65C17.21 20.1 15.21 21 13 21c-1.87 0-3.62-.64-5-1.71L10 17l-2 2-2.29-2.29C4.64 15.62 4 13.87 4 12z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Fixit
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Servis Motor</p>
                  </div>
                </Link>
                
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link 
                    href="/customer" 
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link 
                    href="/customer/bookings" 
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Booking Saya
                  </Link>
                  <Link 
                    href="/customer/bookings/new" 
                    className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:scale-105 transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Booking
                  </Link>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 font-medium">Halo,</p>
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-xl transition-all duration-200 hover:scale-105 transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Mobile Navigation - Bottom Bar */}
          <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur-xl">
            <div className="flex justify-around py-3">
              <Link 
                href="/customer" 
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs font-semibold">Home</span>
              </Link>
              <Link 
                href="/customer/bookings" 
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-semibold">Booking</span>
              </Link>
              <Link 
                href="/customer/bookings/new" 
                className="flex flex-col items-center gap-1 text-blue-600 transition-colors"
              >
                <div className="w-12 h-12 -mt-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Buat</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content with Better Spacing */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </>
  );
}
