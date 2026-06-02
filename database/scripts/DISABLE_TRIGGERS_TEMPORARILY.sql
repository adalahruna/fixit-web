-- DISABLE TRIGGERS TEMPORARILY
-- Run this to disable the triggers and test if button works

-- Disable the triggers
DROP TRIGGER IF EXISTS sync_status_from_progress ON service_progress;
DROP TRIGGER IF EXISTS sync_status_from_bookings ON bookings;

-- Verify triggers are gone
SELECT 
  'Triggers Disabled' as status,
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

-- Expected: remaining_triggers = 0
