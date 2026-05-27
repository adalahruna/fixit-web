-- ============================================================================
-- RESET ALL BOOKINGS - Clean slate for fresh testing
-- ============================================================================
-- WARNING: This will delete ALL booking data!
-- ============================================================================

-- Step 1: Show current data count before deletion
SELECT 
  'BEFORE DELETE' as status,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM assignments) as total_assignments,
  (SELECT COUNT(*) FROM service_progress) as total_service_progress,
  (SELECT COUNT(*) FROM booking_services) as total_booking_services,
  (SELECT COUNT(*) FROM audit_logs) as total_audit_logs;

-- Step 2: Delete all related data (in correct order due to foreign keys)
-- Delete all audit logs (simpler approach - delete all)
DELETE FROM audit_logs;

-- Delete service progress
DELETE FROM service_progress;

-- Delete assignments
DELETE FROM assignments;

-- Delete booking services
DELETE FROM booking_services;

-- Delete bookings
DELETE FROM bookings;

-- Step 3: Verify deletion
SELECT 
  'AFTER DELETE' as status,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM assignments) as total_assignments,
  (SELECT COUNT(*) FROM service_progress) as total_service_progress,
  (SELECT COUNT(*) FROM booking_services) as total_booking_services,
  (SELECT COUNT(*) FROM audit_logs) as total_audit_logs;

-- Step 4: Show remaining data (should keep users, mechanics, services, etc.)
SELECT 
  'REMAINING DATA' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM mechanics) as total_mechanics,
  (SELECT COUNT(*) FROM service_types) as total_service_types;

-- ============================================================================
-- DONE! All booking data has been deleted.
-- You can now start fresh testing by creating new bookings.
-- ============================================================================
