import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/components/bookings/BookingForm';

export default async function NewBookingPage() {
  await requireRole(['customer']);
  
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('service_types')
    .select('*')
    .order('name');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Buat Booking Baru</h1>
      <BookingForm services={services || []} />
    </div>
  );
}
