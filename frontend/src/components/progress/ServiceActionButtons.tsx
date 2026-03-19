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
    if (result.success) {
      router.refresh();
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
    if (result.success) {
      router.refresh();
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
