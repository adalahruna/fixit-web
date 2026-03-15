import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { ServiceForm } from '@/components/services/ServiceForm';
import { notFound } from 'next/navigation';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'owner']);
  const { id } = await params;

  const supabase = await createClient();
  const { data: service } = await supabase
    .from('service_types')
    .select('*')
    .eq('id', id)
    .single();

  if (!service) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Jenis Servis</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <ServiceForm service={service} />
      </div>
    </div>
  );
}
