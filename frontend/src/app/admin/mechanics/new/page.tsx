import { requireRole } from '@/lib/auth/utils';
import { MechanicForm } from '@/components/mechanics/MechanicForm';

export default async function NewMechanicPage() {
  await requireRole(['admin', 'owner']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tambah Mekanik</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <MechanicForm />
      </div>
    </div>
  );
}
