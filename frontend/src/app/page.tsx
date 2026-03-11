import { supabase } from '../lib/supabase';

export default async function Home() {
  const { data: services, error } = await supabase.from('service_types').select('*');

  return (
    <main className="p-10 font-sans max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Daftar Layanan Bengkel Kelompok 9 🛠️</h1>
      
      {error && <p className="text-red-500 text-center">Error: {error.message}</p>}
      
      {/* Mengubah JSON menjadi Card UI yang rapi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services?.map((service) => (
          <div key={service.service_type_id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{service.name}</h2>
            <p className="text-gray-600 mt-2">{service.description || "Tidak ada deskripsi."}</p>
            <div className="mt-4 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
              Rp {service.price.toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}