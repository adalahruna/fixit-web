'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Upload complaint photo to Supabase Storage
 * @param file - File to upload (image)
 * @param customerId - Customer ID for organizing files
 * @returns Public URL of uploaded photo or null if failed
 */
export async function uploadComplaintPhoto(
  file: File,
  customerId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Format file tidak valid. Gunakan JPG, PNG, atau WebP'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        url: null,
        error: 'Ukuran file terlalu besar. Maksimal 5MB'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${customerId}/${timestamp}.${fileExt}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('complaint-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: null,
        error: 'Gagal mengupload foto. Silakan coba lagi'
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('complaint-photos')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error uploading photo:', error);
    return {
      url: null,
      error: 'Terjadi kesalahan saat mengupload foto'
    };
  }
}

/**
 * Delete complaint photo from Supabase Storage
 * @param photoUrl - Public URL of photo to delete
 */
export async function deleteComplaintPhoto(photoUrl: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/complaint-photos/{path}
    const urlParts = photoUrl.split('/complaint-photos/');
    if (urlParts.length < 2) {
      console.error('Invalid photo URL format');
      return;
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('complaint-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
    }
  } catch (error) {
    console.error('Unexpected error deleting photo:', error);
  }
}
