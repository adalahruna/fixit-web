-- Run migration 012: Add Booking Priority
-- Execute this in Supabase SQL Editor

\i database/migrations/012_add_booking_priority.sql;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'priority';

-- Show sample data with priority
SELECT id, vehicle_plate, status, priority, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
