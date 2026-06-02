'use client';

import { useState } from 'react';
import { Modal, Button, Alert } from '@/components/ui';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ error?: string; success?: boolean }>;
  itemName: string;
  itemType: string;
  title?: string;
  message?: string;
}

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  title,
  message
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await onConfirm();
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(`${itemType} berhasil dihapus`);
        // Close dialog after showing success message briefly
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title || `Hapus ${itemType}?`}
    >
      <div className="space-y-5">
        {/* Warning Icon & Message - Enhanced */}
        <div className="relative bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-6 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-extrabold text-red-900 mb-2 uppercase tracking-wide">
                ⚠️ Tindakan Permanen
              </h4>
              <p className="text-sm text-red-800 leading-relaxed font-medium">
                {message || `Apakah Anda yakin ingin menghapus ${itemType} ini?`}
              </p>
            </div>
          </div>
        </div>

        {/* Item Info - Enhanced */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-6 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gray-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-2">
                {itemType} yang akan dihapus:
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                {itemName}
              </p>
            </div>
          </div>
        </div>

        {/* Consequences Warning - Enhanced */}
        <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-5 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 text-sm text-yellow-900">
              <p className="font-extrabold mb-2 uppercase tracking-wide text-xs">📌 Perhatian Penting:</p>
              <p className="leading-relaxed font-medium">Data yang sudah dihapus <span className="font-extrabold underline">tidak dapat dikembalikan</span>. Pastikan Anda yakin sebelum melanjutkan.</p>
            </div>
          </div>
        </div>

        {/* Error Alert - Enhanced */}
        {error && (
          <Alert variant="error" className="mb-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs font-extrabold text-red-900 uppercase tracking-wide mb-1">Error</p>
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            </div>
          </Alert>
        )}

        {/* Success Alert - Enhanced */}
        {success && (
          <Alert variant="success" className="mb-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs font-extrabold text-green-900 uppercase tracking-wide mb-1">Berhasil</p>
                <p className="text-sm font-semibold text-green-800">{success}</p>
              </div>
            </div>
          </Alert>
        )}

        {/* Action Buttons - Enhanced */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 pt-3">
          <Button
            onClick={handleCancel}
            disabled={isDeleting || !!success}
            variant="secondary"
            size="lg"
            fullWidth
            className="sm:flex-1 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2.5 font-extrabold">
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </span>
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting || !!success}
            variant="danger"
            size="lg"
            fullWidth
            className="sm:flex-1 group relative overflow-hidden"
          >
            {isDeleting ? (
              <span className="relative z-10 flex items-center justify-center gap-2.5 font-extrabold">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menghapus...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2.5 font-extrabold">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Ya, Hapus Sekarang
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
