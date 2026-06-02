-- Setup Complaint Photos Storage Bucket and RLS Policies
-- Run this script in Supabase SQL Editor after running migration 011

-- 1. Create storage bucket for complaint photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'complaint-photos', 
  'complaint-photos', 
  true,  -- Public bucket so photos can be viewed
  5242880,  -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Authenticated users can upload complaint photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload complaint photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload complaint photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'complaint-photos');
  END IF;
END $$;

-- 3. RLS Policy: Anyone can view complaint photos (public bucket)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can view complaint photos'
  ) THEN
    CREATE POLICY "Anyone can view complaint photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'complaint-photos');
  END IF;
END $$;

-- 4. RLS Policy: Users can delete their own photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete own complaint photos'
  ) THEN
    CREATE POLICY "Users can delete own complaint photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'complaint-photos' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- 5. RLS Policy: Users can update their own photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update own complaint photos'
  ) THEN
    CREATE POLICY "Users can update own complaint photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'complaint-photos' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Verify bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'complaint-photos';

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%complaint photos%';
