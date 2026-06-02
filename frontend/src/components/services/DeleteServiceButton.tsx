'use client';

import { useState } from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { deleteService } from '@/lib/services/actions';
import { useRouter } from 'next/navigation';

interface DeleteServiceButtonProps {
  serviceId: string;
  serviceName: string;
}

export default function DeleteServiceButton({ serviceId, serviceName }: DeleteServiceButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteService(serviceId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Refresh the page to show updated list
    router.refresh();
    return { success: true };
  };

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title="Hapus jenis servis ini"
      >
        <svg 
          className="w-4 h-4 group-hover:scale-110 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          />
        </svg>
        <span>Hapus</span>
      </button>

      <DeleteConfirmation
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={serviceName}
        itemType="jenis servis"
      />
    </>
  );
}
