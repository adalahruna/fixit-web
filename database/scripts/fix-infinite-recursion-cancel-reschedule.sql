-- ============================================
-- FIX: Infinite Recursion on Cancel & Reschedule
-- ============================================
-- Issue: Triggers sync_status_from_bookings and sync_status_from_progress
--        create infinite recursion when updating booking status
-- Root cause: The triggers don't properly handle 'cancelled' status
--             and the sync logic creates a circular update loop
-- Solution: Drop the problematic triggers (manual sync is safer)
-- ============================================

-- Step 1: Check existing triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing,
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
  COUNT(*) as remaining_triggers,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All triggers removed successfully'
    ELSE '⚠️ Some triggers still exist'
  END as status
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

-- Step 5: Show confirmation message
SELECT '✅ Infinite recursion fix completed!' as result,
       'Cancel and reschedule should now work without errors' as note;
