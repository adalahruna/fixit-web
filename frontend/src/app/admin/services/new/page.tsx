import { requireRole } from '@/lib/auth/utils';
import { ServiceForm } from '@/components/services/ServiceForm';

export default async function NewServicePage() {
  await requireRole(['admin', 'owner']);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tambah Jenis Servis</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <ServiceForm />
      </div>
    </div>
  );
}
