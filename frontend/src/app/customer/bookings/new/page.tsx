import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import BookingFormClient from './BookingFormClient';

export default async function NewBookingPage() {
  await requireRole(['customer']);
  
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('service_types')
    .select('*')
    .order('name');

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Buat Booking Baru</h1>
        <p className="text-gray-600">Pilih layanan dan jadwal servis motor Anda</p>
      </div>
      <BookingFormClient services={services || []} />
    </div>
  );
}
