'use client';

import { useFormStatus } from 'react-dom';
import { startService, completeService } from '@/lib/progress/actions';
import { useRouter } from 'next/navigation';

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Memproses...' : label}
    </button>
  );
}

function CompleteButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Memproses...' : '✅ Selesai'}
    </button>
  );
}

export function StartServiceButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  async function handleStart(formData: FormData) {
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

  async function handleComplete(formData: FormData) {
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
