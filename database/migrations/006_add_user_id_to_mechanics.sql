-- Migration: Add user_id to mechanics table
-- Created: 2026-05-17
-- Description: Menambahkan kolom user_id ke tabel mechanics untuk relasi yang benar dengan users

-- Add user_id column to mechanics table
ALTER TABLE mechanics 
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_mechanics_user_id ON mechanics(user_id);

-- Update existing mechanics to link with users (if any)
-- This is a manual step that needs to be done based on existing data
-- Example: UPDATE mechanics SET user_id = (SELECT id FROM users WHERE users.name = mechanics.name AND users.role = 'mechanic');

-- Add unique constraint to ensure one mechanic per user
ALTER TABLE mechanics 
ADD CONSTRAINT unique_mechanic_user UNIQUE(user_id);