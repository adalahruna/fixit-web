-- ============================================
-- FIX: Infinite Recursion on Cancel & Reschedule
-- ============================================
-- Issue: Triggers sync_status_from_bookings and sync_status_from_progress
--        create infinite recursion when updating booking status
-- Solution: Remove the problematic triggers
-- ============================================

-- Step 1: Check existing triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings')
ORDER BY event_object_table;

-- Step 2: Drop the problematic triggers
DROP TRIGGER IF EXISTS sync_status_from_progress ON service_progress;
DROP TRIGGER IF EXISTS sync_status_from_bookings ON bookings;

-- Step 3: Drop the trigger function if exists
DROP FUNCTION IF EXISTS sync_booking_status() CASCADE;

-- Step 4: Verify triggers are removed
SELECT 
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

-- Expected: remaining_triggers = 0

SELECT '✅ Infinite recursion triggers removed successfully!' as status;
