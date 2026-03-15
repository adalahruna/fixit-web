import { requireRole } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { MechanicForm } from '@/components/mechanics/MechanicForm';
import { notFound } from 'next/navigation';

export default async function EditMechanicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'owner']);
  const { id } = await params;

  const supabase = await createClient();
  const { data: mechanic } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', id)
    .single();

  if (!mechanic) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Mekanik</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <MechanicForm mechanic={mechanic} />
      </div>
    </div>
  );
}
