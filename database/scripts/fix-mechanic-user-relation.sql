-- Script untuk memperbaiki relasi mechanic-user yang sudah ada
-- Jalankan setelah migration 006_add_user_id_to_mechanics.sql

-- 1. Update mechanics yang namanya sama dengan user mechanic
UPDATE mechanics 
SET user_id = users.id
FROM users 
WHERE mechanics.name = users.name 
  AND users.role = 'mechanic' 
  AND mechanics.user_id IS NULL;

-- 2. Tampilkan mechanics yang belum terhubung
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  m.user_id,
  'Mechanic belum terhubung dengan user' as status
FROM mechanics m
WHERE m.user_id IS NULL;

-- 3. Tampilkan users mechanic yang belum terhubung
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  'User mechanic belum terhubung dengan mechanic' as status
FROM users u
WHERE u.role = 'mechanic'
  AND u.id NOT IN (
    SELECT user_id 
    FROM mechanics 
    WHERE user_id IS NOT NULL
  );

-- 4. Tampilkan relasi yang sudah terhubung
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  u.id as user_id,
  u.name as user_name,
  u.email,
  'Sudah terhubung' as status
FROM mechanics m
JOIN users u ON m.user_id = u.id
WHERE u.role = 'mechanic';