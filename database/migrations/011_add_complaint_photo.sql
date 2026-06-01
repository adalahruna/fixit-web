-- Migration: Add complaint photo URL to bookings table
-- This allows customers to upload photos of their vehicle issues when creating a booking

-- Add complaint_photo_url column to bookings table
ALTER TABLE bookings 
ADD COLUMN complaint_photo_url TEXT;

COMMENT ON COLUMN bookings.complaint_photo_url IS 'URL to photo of vehicle complaint/issue uploaded by customer';

-- Create storage bucket for complaint photos (run this in Supabase Dashboard > Storage)
-- Bucket name: complaint-photos
-- Public: true (so photos can be viewed)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Note: You need to create the bucket manually in Supabase Dashboard or run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-photos', 'complaint-photos', true);

-- RLS Policy for complaint-photos bucket (allow authenticated users to upload)
-- CREATE POLICY "Authenticated users can upload complaint photos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'complaint-photos');

-- CREATE POLICY "Anyone can view complaint photos"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'complaint-photos');
