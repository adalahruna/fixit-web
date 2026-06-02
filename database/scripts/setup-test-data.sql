-- FixIt QA Test Data Setup Script
-- Run this script to populate database with test data for QA testing

-- =====================================================
-- 1. CLEAN UP EXISTING TEST DATA (Optional)
-- =====================================================

-- Uncomment lines below if you want to clean existing test data
-- DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM service_progress WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%test%'));
-- DELETE FROM assignments WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%test%'));
-- DELETE FROM booking_services WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%test%'));
-- DELETE FROM booking_consultations WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%test%'));
-- DELETE FROM bookings WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM users WHERE email LIKE '%test%';

-- =====================================================
-- 2. CREATE TEST USERS
-- =====================================================

-- Test Customers
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('test-customer-1', 'customer@test.com', 'Test Customer 1', 'customer', NOW(), NOW()),
('test-customer-2', 'customer2@test.com', 'Test Customer 2', 'customer', NOW(), NOW()),
('test-customer-3', 'customer3@test.com', 'Test Customer 3', 'customer', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Test Admin (if not exists)
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('test-admin-1', 'admin@bengkel.com', 'Test Admin', 'admin', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Test Mechanic (if not exists)  
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('test-mechanic-1', 'mechanic@bengkel.com', 'Test Mechanic', 'mechanic', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Test Owner (if not exists)
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('test-owner-1', 'owner@bengkel.com', 'Test Owner', 'owner', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 3. CREATE TEST SERVICE TYPES (if not exists)
-- =====================================================

INSERT INTO service_types (id, name, description, price, default_duration_minutes, is_active, created_at, updated_at) VALUES
('service-ganti-oli', 'Ganti Oli', 'Ganti oli mesin motor', 50000, 30, true, NOW(), NOW()),
('service-tune-up', 'Tune Up', 'Service berkala motor', 150000, 90, true, NOW(), NOW()),
('service-berkala', 'Service Berkala', 'Service rutin bulanan', 100000, 60, true, NOW(), NOW()),
('service-rem', 'Service Rem', 'Perbaikan sistem rem', 75000, 45, true, NOW(), NOW()),
('service-rantai', 'Service Rantai', 'Pembersihan dan pelumasan rantai', 25000, 20, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. CREATE TEST MECHANICS (if not exists)
-- =====================================================

INSERT INTO mechanics (id, name, phone, email, is_active, daily_capacity_minutes, created_at, updated_at) VALUES
('mechanic-ahmad', 'Ahmad', '081234567890', 'ahmad@bengkel.com', true, 480, NOW(), NOW()),
('mechanic-budi', 'Budi', '081234567891', 'budi@bengkel.com', true, 480, NOW(), NOW()),
('mechanic-candra', 'Candra', '081234567892', 'candra@bengkel.com', true, 480, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. CREATE TEST BOOKINGS - VARIOUS SCENARIOS
-- =====================================================

-- Scenario 1: Pending Booking (for assignment testing)
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-pending-1',
    'test-customer-1',
    'B1234TEST',
    'Motor Matic',
    (CURRENT_DATE + INTERVAL '1 day') + TIME '09:00:00',
    (CURRENT_DATE + INTERVAL '1 day') + TIME '09:30:00',
    30,
    'pending',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add services to pending booking
INSERT INTO booking_services (booking_id, service_type_id, created_at) VALUES
('booking-pending-1', 'service-ganti-oli', NOW())
ON CONFLICT (booking_id, service_type_id) DO NOTHING;

-- Scenario 2: Confirmed Booking (assigned to mechanic)
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-confirmed-1',
    'test-customer-2',
    'B5678TEST',
    'Motor Sport',
    (CURRENT_DATE + INTERVAL '1 day') + TIME '10:00:00',
    (CURRENT_DATE + INTERVAL '1 day') + TIME '11:30:00',
    90,
    'confirmed',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add services to confirmed booking
INSERT INTO booking_services (booking_id, service_type_id, created_at) VALUES
('booking-confirmed-1', 'service-tune-up', NOW())
ON CONFLICT (booking_id, service_type_id) DO NOTHING;

-- Assign mechanic to confirmed booking
INSERT INTO assignments (id, booking_id, mechanic_id, assigned_at, queue_position, created_at, updated_at) VALUES
('assignment-1', 'booking-confirmed-1', 'mechanic-ahmad', NOW(), 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Scenario 3: In Progress Booking
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-inprogress-1',
    'test-customer-3',
    'B9012TEST',
    'Motor Bebek',
    CURRENT_DATE + TIME '14:00:00',
    CURRENT_DATE + TIME '15:00:00',
    60,
    'in_progress',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add services to in-progress booking
INSERT INTO booking_services (booking_id, service_type_id, created_at) VALUES
('booking-inprogress-1', 'service-berkala', NOW())
ON CONFLICT (booking_id, service_type_id) DO NOTHING;

-- Assign mechanic and start service
INSERT INTO assignments (id, booking_id, mechanic_id, assigned_at, queue_position, created_at, updated_at) VALUES
('assignment-2', 'booking-inprogress-1', 'mechanic-budi', NOW() - INTERVAL '1 hour', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_progress (id, booking_id, start_time, created_at, updated_at) VALUES
('progress-1', 'booking-inprogress-1', NOW() - INTERVAL '30 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Scenario 4: Completed Booking
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-done-1',
    'test-customer-1',
    'B1111DONE',
    'Motor Matic',
    CURRENT_DATE - INTERVAL '1 day' + TIME '09:00:00',
    CURRENT_DATE - INTERVAL '1 day' + TIME '09:45:00',
    45,
    'done',
    NOW() - INTERVAL '1 day',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add services to completed booking
INSERT INTO booking_services (booking_id, service_type_id, created_at) VALUES
('booking-done-1', 'service-rem', NOW())
ON CONFLICT (booking_id, service_type_id) DO NOTHING;

-- Complete assignment and service
INSERT INTO assignments (id, booking_id, mechanic_id, assigned_at, queue_position, created_at, updated_at) VALUES
('assignment-3', 'booking-done-1', 'mechanic-candra', NOW() - INTERVAL '1 day', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_progress (
    id, booking_id, start_time, end_time, actual_duration, created_at, updated_at
) VALUES (
    'progress-2', 
    'booking-done-1', 
    CURRENT_DATE - INTERVAL '1 day' + TIME '09:00:00',
    CURRENT_DATE - INTERVAL '1 day' + TIME '09:40:00',
    40,
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Scenario 5: Consultation Only Booking
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-consultation-1',
    'test-customer-2',
    'B2222CONS',
    'Motor Sport',
    (CURRENT_DATE + INTERVAL '2 days') + TIME '15:00:00',
    (CURRENT_DATE + INTERVAL '2 days') + TIME '15:30:00',
    30,
    'pending',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add consultation to booking
INSERT INTO booking_consultations (booking_id, consultation_text, created_at, updated_at) VALUES
('booking-consultation-1', 'Motor susah hidup pagi hari, perlu konsultasi mekanik', NOW(), NOW())
ON CONFLICT (booking_id) DO NOTHING;

-- Scenario 6: Cancelled Booking (for testing reschedule rules)
INSERT INTO bookings (
    id, customer_id, vehicle_plate, vehicle_type, 
    schedule_start, schedule_end, estimated_duration, 
    status, created_at, updated_at
) VALUES (
    'booking-cancelled-1',
    'test-customer-3',
    'B3333CANC',
    'Motor Bebek',
    (CURRENT_DATE + INTERVAL '3 days') + TIME '11:00:00',
    (CURRENT_DATE + INTERVAL '3 days') + TIME '11:20:00',
    20,
    'cancelled',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add services to cancelled booking
INSERT INTO booking_services (booking_id, service_type_id, created_at) VALUES
('booking-cancelled-1', 'service-rantai', NOW())
ON CONFLICT (booking_id, service_type_id) DO NOTHING;

-- =====================================================
-- 6. CREATE SAMPLE AUDIT LOGS
-- =====================================================

INSERT INTO audit_logs (
    id, actor_id, action, entity_type, entity_id, 
    metadata, timestamp_log, created_at
) VALUES 
(
    'audit-1',
    'test-customer-1',
    'CREATE',
    'booking',
    'booking-pending-1',
    '{"vehicle_plate": "B1234TEST", "services": ["Ganti Oli"]}',
    NOW(),
    NOW()
),
(
    'audit-2',
    'test-admin-1',
    'ASSIGN',
    'booking',
    'booking-confirmed-1',
    '{"mechanic_id": "mechanic-ahmad", "mechanic_name": "Ahmad"}',
    NOW(),
    NOW()
),
(
    'audit-3',
    'test-mechanic-1',
    'START_SERVICE',
    'booking',
    'booking-inprogress-1',
    '{"start_time": "' || (NOW() - INTERVAL '30 minutes')::text || '"}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify test data creation
DO $$
BEGIN
    RAISE NOTICE 'Test Data Setup Complete!';
    RAISE NOTICE 'Test Users Created: %', (SELECT COUNT(*) FROM users WHERE email LIKE '%test%' OR email LIKE '%bengkel.com');
    RAISE NOTICE 'Test Bookings Created: %', (SELECT COUNT(*) FROM bookings WHERE id LIKE 'booking-%');
    RAISE NOTICE 'Test Service Types: %', (SELECT COUNT(*) FROM service_types WHERE id LIKE 'service-%');
    RAISE NOTICE 'Test Mechanics: %', (SELECT COUNT(*) FROM mechanics WHERE id LIKE 'mechanic-%');
    RAISE NOTICE 'Test Assignments: %', (SELECT COUNT(*) FROM assignments WHERE id LIKE 'assignment-%');
    RAISE NOTICE 'Test Audit Logs: %', (SELECT COUNT(*) FROM audit_logs WHERE id LIKE 'audit-%');
END $$;

-- =====================================================
-- 8. QUICK TEST QUERIES FOR QA
-- =====================================================

-- Check booking statuses
SELECT 
    'Booking Status Distribution' as info,
    status,
    COUNT(*) as count
FROM bookings 
WHERE id LIKE 'booking-%'
GROUP BY status
ORDER BY status;

-- Check mechanic assignments
SELECT 
    'Mechanic Workload' as info,
    m.name as mechanic_name,
    COUNT(a.id) as assigned_bookings
FROM mechanics m
LEFT JOIN assignments a ON m.id = a.mechanic_id
WHERE m.id LIKE 'mechanic-%'
GROUP BY m.id, m.name
ORDER BY m.name;

-- Check customer bookings
SELECT 
    'Customer Bookings' as info,
    u.name as customer_name,
    COUNT(b.id) as total_bookings
FROM users u
LEFT JOIN bookings b ON u.id = b.customer_id
WHERE u.email LIKE '%test%'
GROUP BY u.id, u.name
ORDER BY u.name;

COMMIT;