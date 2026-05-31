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
        className="text-red-600 hover:text-red-900"
      >
        Hapus
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
