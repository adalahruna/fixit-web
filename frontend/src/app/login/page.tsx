'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30 transform group-hover:scale-110 transition-transform duration-200">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path d="M17.5 4.5c-1.95-1.95-5.05-1.95-7 0l-1.5 1.5 7 7 1.5-1.5c1.95-1.95 1.95-5.05 0-7z"/>
                  <path d="M4 12c0-2.21.9-4.21 2.35-5.65L8 8l2-2-1.65-1.65C9.79 3.9 11.79 3 14 3c1.87 0 3.62.64 5 1.71L17 7l2-2 2.29 2.29C22.36 8.38 23 10.13 23 12c0 2.21-.9 4.21-2.35 5.65L19 16l-2 2 1.65 1.65C17.21 20.1 15.21 21 13 21c-1.87 0-3.62-.64-5-1.71L10 17l-2 2-2.29-2.29C4.64 15.62 4 13.87 4 12z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="mb-2">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Fixit
            </h1>
            <p className="text-sm text-gray-500 font-medium">Servis Motor</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-6">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk melanjutkan ke dashboard Anda
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/80 backdrop-blur-xl py-8 px-8 shadow-2xl rounded-2xl border border-gray-200/50 hover:shadow-blue-100 transition-shadow duration-300">
          <LoginForm />
        </div>

        {/* Register Link */}
        <div className="text-center bg-white/60 backdrop-blur-sm py-4 px-6 rounded-xl border border-gray-200/50">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
              Daftar Sekarang
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2026 Fixit. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
