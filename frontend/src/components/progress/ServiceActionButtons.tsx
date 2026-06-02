'use client';

import { useFormStatus } from 'react-dom';
import { startService, completeService } from '@/lib/progress/actions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

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

  async function handleStart(_formData: FormData) {
    const result = await startService(bookingId);
    
    // Log result for debugging
    console.log('Start service result:', result);
    
    if (result.error) {
      // Show error to user
      alert(`Error: ${result.error}`);
      return;
    }
    
    if (result.success) {
      // Force refresh current page
      router.refresh();
      // Small delay then refresh again to ensure cache is cleared
      setTimeout(() => {
        router.refresh();
      }, 100);
    }
  }

  return (
    <form action={handleStart}>
      <StartButton />
    </form>
  );
}

function StartButton() {
  const { pending } = useFormStatus();
  return <SubmitButton label="🚀 Mulai Servis" pending={pending} />;
}

export function CompleteServiceButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  async function handleComplete(_formData: FormData) {
    const result = await completeService(bookingId);
    
    // Log result for debugging
    console.log('Complete service result:', result);
    
    if (result.error) {
      // Show error to user
      alert(`Error: ${result.error}`);
      return;
    }
    
    if (result.success) {
      // Force refresh current page
      router.refresh();
      // Small delay then refresh again to ensure cache is cleared
      setTimeout(() => {
        router.refresh();
      }, 100);
    }
  }

  return (
    <form action={handleComplete}>
      <CompleteButtonInner />
    </form>
  );
}

function CompleteButtonInner() {
  const { pending } = useFormStatus();
  return <CompleteButton pending={pending} />;
}
