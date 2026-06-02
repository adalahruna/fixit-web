-- Migration: Add Booking Priority
-- Created: 2026-03-15
-- Description: Tambah kolom priority di bookings untuk sorting antrian

-- Add priority column to bookings
-- Priority levels: urgent (1), high (2), normal (3), low (4)
-- Lower number = higher priority
ALTER TABLE bookings 
ADD COLUMN priority INTEGER DEFAULT 3 CHECK (priority IN (1, 2, 3, 4));

-- Add index for efficient sorting
CREATE INDEX idx_bookings_priority ON bookings(priority);

-- Comment on column
COMMENT ON COLUMN bookings.priority IS 'Priority level: 1=Urgent, 2=High, 3=Normal, 4=Low';
