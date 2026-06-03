-- ============================================
-- FIX: Cancel & Reschedule Without Triggers
-- ============================================
-- Simple solution: Just drop the problematic triggers
-- Code will handle sync manually
-- ============================================

-- Step 1: Drop problematic triggers
DROP TRIGGER IF EXISTS sync_status_from_progress ON service_progress;
DROP TRIGGER IF EXISTS sync_status_from_bookings ON bookings;

-- Step 2: Drop the trigger function
DROP FUNCTION IF EXISTS sync_booking_status() CASCADE;

-- Step 3: Verify triggers are removed
SELECT 
  COUNT(*) as remaining_triggers,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All triggers removed successfully'
    ELSE '⚠️ Some triggers still exist'
  END as status
FROM information_schema.triggers
WHERE trigger_name IN ('sync_status_from_progress', 'sync_status_from_bookings');

SELECT '✅ Done! Cancel and reschedule will now work without infinite recursion.' as result;
