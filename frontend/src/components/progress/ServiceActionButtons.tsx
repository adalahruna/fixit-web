'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { startService, completeService } from '@/lib/progress/actions';
import { useRouter } from 'next/navigation';
import { Button, Toast } from '@/components/ui';

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="success"
      fullWidth
    >
      {pending ? 'Memproses...' : label}
    </Button>
  );
}

function CompleteButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="primary"
      fullWidth
    >
      {pending ? 'Memproses...' : '✅ Selesai'}
    </Button>
  );
}

export function StartServiceButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleStart(_formData: FormData) {
    const result = await startService(bookingId);
    
    if (result.error) {
      setErrorMessage(result.error);
      setShowErrorToast(true);
      return;
    }
    
    if (result.success) {
      setShowSuccessToast(true);
      // Delay refresh to show toast
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  }

  return (
    <>
      <form action={handleStart}>
        <StartButton />
      </form>
      
      {showSuccessToast && (
        <Toast
          message="Servis dimulai! Status diupdate."
          variant="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      {showErrorToast && (
        <Toast
          message={errorMessage}
          variant="error"
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </>
  );
}

function StartButton() {
  const { pending } = useFormStatus();
  return <SubmitButton label="🚀 Mulai Servis" pending={pending} />;
}

export function CompleteServiceButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleComplete(_formData: FormData) {
    const result = await completeService(bookingId);
    
    if (result.error) {
      setErrorMessage(result.error);
      setShowErrorToast(true);
      return;
    }
    
    if (result.success) {
      setShowSuccessToast(true);
      // Delay refresh to show toast
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  }

  return (
    <>
      <form action={handleComplete}>
        <CompleteButtonInner />
      </form>
      
      {showSuccessToast && (
        <Toast
          message="Servis selesai! Booking telah diselesaikan."
          variant="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      {showErrorToast && (
        <Toast
          message={errorMessage}
          variant="error"
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </>
  );
}

function CompleteButtonInner() {
  const { pending } = useFormStatus();
  return <CompleteButton pending={pending} />;
}
