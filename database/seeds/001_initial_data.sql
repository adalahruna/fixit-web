-- Seed: Initial Data
-- Created: 2026-03-14
-- Description: Data awal untuk testing dan demo

-- Insert Service Types
INSERT INTO service_types (id, name, default_duration_minutes, price, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ganti Oli', 30, 75000, 'Ganti oli mesin standar'),
('550e8400-e29b-41d4-a716-446655440002', 'Tune Up', 60, 150000, 'Tune up lengkap mesin'),
('550e8400-e29b-41d4-a716-446655440003', 'Servis Berkala', 90, 200000, 'Servis berkala rutin'),
('550e8400-e29b-41d4-a716-446655440004', 'Ganti Ban', 45, 100000, 'Ganti ban depan/belakang'),
('550e8400-e29b-41d4-a716-446655440005', 'Perbaikan Rem', 60, 120000, 'Perbaikan sistem rem');

-- Insert Mechanics
INSERT INTO mechanics (id, name, is_active, daily_capacity_minutes, skill_notes) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Budi Santoso', true, 480, 'Spesialis mesin'),
('650e8400-e29b-41d4-a716-446655440002', 'Andi Wijaya', true, 480, 'Spesialis kelistrikan'),
('650e8400-e29b-41d4-a716-446655440003', 'Rudi Hermawan', true, 420, 'General mechanic');

-- Insert Sample Users (Password akan di-handle oleh Supabase Auth)
-- Note: User ini hanya untuk referensi, actual auth user dibuat via Supabase Auth
INSERT INTO users (id, name, email, role, status) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Admin Bengkel', 'admin@bengkel.com', 'admin', 'active'),
('750e8400-e29b-41d4-a716-446655440002', 'Owner Bengkel', 'owner@bengkel.com', 'owner', 'active'),
('750e8400-e29b-41d4-a716-446655440003', 'Customer Demo', 'customer@demo.com', 'customer', 'active');

-- Note: Mekanik user akan di-link ke tabel mechanics setelah Auth setup
