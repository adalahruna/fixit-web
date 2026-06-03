-- ============================================
-- TEMPORARY: Disable RLS for Testing
-- ============================================
-- WARNING: This disables security! Only for testing recursion issue
-- REMEMBER TO RE-ENABLE RLS AFTER TESTING!
-- ============================================

-- Disable RLS on bookings table temporarily
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Check if disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'bookings';

-- Expected: rls_enabled = false

SELECT '⚠️ RLS DISABLED FOR TESTING!' as warning,
       'Test cancel/reschedule now. Then re-enable RLS!' as note;

-- ============================================
-- TO RE-ENABLE RLS (run after testing):
-- ============================================
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
