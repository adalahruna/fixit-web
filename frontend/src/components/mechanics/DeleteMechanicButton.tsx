'use client';

import { useState } from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { deleteMechanic } from '@/lib/mechanics/actions';
import { useRouter } from 'next/navigation';

interface DeleteMechanicButtonProps {
  mechanicId: string;
  mechanicName: string;
}

export default function DeleteMechanicButton({ mechanicId, mechanicName }: DeleteMechanicButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteMechanic(mechanicId);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Refresh the page to show updated list
    router.refresh();
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
        itemName={mechanicName}
        itemType="mekanik"
      />
    </>
  );
}
