import { requireRole } from '@/lib/auth/utils';
import { getUnlinkedData } from '@/lib/mechanics/actions';
import { LinkMechanicForm } from '../../../../components/mechanics/LinkMechanicForm';

export default async function LinkMechanicPage() {
  await requireRole(['admin', 'owner']);
  
  const { unlinkedMechanics, unlinkedUsers } = await getUnlinkedData();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hubungkan Mekanik dengan User</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Informasi</h2>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800 text-sm">
            Halaman ini digunakan untuk menghubungkan data mekanik dengan akun user. 
            Setelah dihubungkan, mekanik dapat login dan melihat history/riwayat mereka dengan benar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Mekanik Belum Terhubung</h3>
          {unlinkedMechanics.length === 0 ? (
            <p className="text-gray-500 text-sm">Semua mekanik sudah terhubung dengan user</p>
          ) : (
            <div className="space-y-2">
              {unlinkedMechanics.map((mechanic) => (
                <div key={mechanic.id} className="p-3 bg-gray-50 rounded border">
                  <p className="font-medium">{mechanic.name}</p>
                  <p className="text-xs text-gray-500">ID: {mechanic.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Mekanik Belum Terhubung</h3>
          {unlinkedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Semua user mekanik sudah terhubung</p>
          ) : (
            <div className="space-y-2">
              {unlinkedUsers.map((user) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded border">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-500">ID: {user.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(unlinkedMechanics.length > 0 && unlinkedUsers.length > 0) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Hubungkan Mekanik dengan User</h3>
          <LinkMechanicForm 
            mechanics={unlinkedMechanics}
            users={unlinkedUsers}
          />
        </div>
      )}
    </div>
  );
}