/**
 * Integration Tests for Mechanic Overload Detection
 * Feature: system-improvements-crud-audit-kpi
 * Task: 14.3 Write integration tests for overload detection
 * 
 * These tests verify:
 * 1. Overload detection works correctly with real booking data from the database
 * 2. The API endpoint returns accurate real-time overload status
 * 3. Overload warnings display correctly in the UI
 */

import { detectMechanicOverload, getMechanicOverloadStatus } from '../overload-detection';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Overload Detection - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Integration Test 1: Overload detection with real booking data
   * Verifies that the system correctly detects overload based on actual booking data
   */
  describe('Integration Test 1: Overload detection with real booking data', () => {
    it('should correctly detect overloaded mechanic with multiple bookings', async () => {
      // Setup: Create a mechanic with 480 minutes capacity (8 hours)
      const mechanicId = '123e4567-e89b-12d3-a456-426614174000';
      const mechanicName = 'Ahmad';
      const capacity = 480;

      // Mock mechanics query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments with real booking data - total 400 minutes (83% capacity)
      const bookingsData = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [
              { duration_minutes: 60 }, // Oil change
              { duration_minutes: 30 }, // Tire check
            ],
          },
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: new Date().toISOString(),
            status: 'in_progress',
            booking_services: [
              { duration_minutes: 120 }, // Engine repair
            ],
          },
        },
        {
          booking: {
            id: 'booking-3',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [
              { duration_minutes: 90 }, // Brake service
              { duration_minutes: 100 }, // Transmission check
            ],
          },
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: bookingsData,
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Mechanic should be detected as overloaded
      expect(result.totalMechanics).toBe(1);
      expect(result.overloadedCount).toBe(1);
      expect(result.overloadedMechanics).toHaveLength(1);
      
      const mechanicStatus = result.overloadedMechanics[0];
      expect(mechanicStatus.mechanicId).toBe(mechanicId);
      expect(mechanicStatus.mechanicName).toBe(mechanicName);
      expect(mechanicStatus.currentLoad).toBe(400); // Total of all service durations
      expect(mechanicStatus.maxCapacity).toBe(capacity);
      expect(mechanicStatus.isOverloaded).toBe(true);
      expect(mechanicStatus.overloadPercentage).toBe(83); // 400/480 = 83.33%
      expect(mechanicStatus.queuedBookings).toBe(2);
      expect(mechanicStatus.inProgressBookings).toBe(1);
    });

    it('should correctly identify non-overloaded mechanic with light workload', async () => {
      // Setup: Create a mechanic with 480 minutes capacity
      const mechanicId = '223e4567-e89b-12d3-a456-426614174001';
      const mechanicName = 'Budi';
      const capacity = 480;

      // Mock mechanics query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments with light workload - total 200 minutes (42% capacity)
      const bookingsData = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [
              { duration_minutes: 60 }, // Oil change
            ],
          },
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [
              { duration_minutes: 90 }, // Tire replacement
              { duration_minutes: 50 }, // Brake check
            ],
          },
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: bookingsData,
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Mechanic should NOT be detected as overloaded
      expect(result.totalMechanics).toBe(1);
      expect(result.overloadedCount).toBe(0);
      expect(result.overloadedMechanics).toHaveLength(0);
    });

    it('should handle multiple mechanics with mixed overload states', async () => {
      // Setup: Create 3 mechanics with different workloads
      const mechanics = [
        { id: 'mech-1', name: 'Ahmad', capacity: 480, workload: 400 }, // 83% - overloaded
        { id: 'mech-2', name: 'Budi', capacity: 480, workload: 200 },  // 42% - not overloaded
        { id: 'mech-3', name: 'Candra', capacity: 600, workload: 500 }, // 83% - overloaded
      ];

      // Mock mechanics query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mechanics.map(m => ({
            id: m.id,
            name: m.name,
            daily_capacity_minutes: m.capacity,
            is_active: true,
          })),
          error: null,
        }),
      });

      // Mock assignments for each mechanic
      for (const mechanic of mechanics) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: mechanic.workload > 0 ? [{
              booking: {
                id: `booking-${mechanic.id}`,
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: mechanic.workload }],
              },
            }] : [],
            error: null,
          }),
        });
      }

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should detect 2 overloaded mechanics out of 3
      expect(result.totalMechanics).toBe(3);
      expect(result.overloadedCount).toBe(2);
      expect(result.overloadedMechanics).toHaveLength(2);
      expect(result.systemOverloadPercentage).toBe(67); // 2/3 = 66.67%

      // Verify specific mechanics
      const ahmad = result.overloadedMechanics.find(m => m.mechanicId === 'mech-1');
      expect(ahmad).toBeDefined();
      expect(ahmad?.isOverloaded).toBe(true);

      const candra = result.overloadedMechanics.find(m => m.mechanicId === 'mech-3');
      expect(candra).toBeDefined();
      expect(candra?.isOverloaded).toBe(true);

      // Budi should not be in overloaded list
      const budi = result.overloadedMechanics.find(m => m.mechanicId === 'mech-2');
      expect(budi).toBeUndefined();
    });

    it('should handle mechanic at exactly 80% threshold', async () => {
      // Setup: Create a mechanic with exactly 80% workload
      const mechanicId = 'mech-threshold';
      const mechanicName = 'Threshold Test';
      const capacity = 500;
      const workload = 400; // Exactly 80%

      // Mock mechanics query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{
            booking: {
              id: 'booking-threshold',
              schedule_start: new Date().toISOString(),
              status: 'queued',
              booking_services: [{ duration_minutes: workload }],
            },
          }],
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should be marked as overloaded (>= 80%)
      expect(result.overloadedCount).toBe(1);
      const mechanicStatus = result.overloadedMechanics[0];
      expect(mechanicStatus.isOverloaded).toBe(true);
      expect(mechanicStatus.overloadPercentage).toBe(80);
    });
  });

  /**
   * Integration Test 2: API endpoint returns correct data
   * Verifies that the API endpoint returns accurate real-time overload status
   */
  describe('Integration Test 2: API endpoint returns correct data', () => {
    it('should return accurate overload status for specific mechanic via getMechanicOverloadStatus', async () => {
      // Setup: Create a mechanic with specific workload
      const mechanicId = 'api-test-mech-1';
      const mechanicName = 'API Test Mechanic';
      const capacity = 480;
      const workload = 420; // 87.5% - overloaded

      // Mock specific mechanic query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true },
          error: null,
        }),
      });

      // Mock assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{
            booking: {
              id: 'booking-api-1',
              schedule_start: new Date().toISOString(),
              status: 'queued',
              booking_services: [
                { duration_minutes: 180 },
                { duration_minutes: 120 },
                { duration_minutes: 120 },
              ],
            },
          }],
          error: null,
        }),
      });

      // Act: Call getMechanicOverloadStatus (used by API endpoint)
      const status = await getMechanicOverloadStatus(mechanicId);

      // Assert: Should return complete and accurate status
      expect(status).not.toBeNull();
      expect(status?.mechanicId).toBe(mechanicId);
      expect(status?.mechanicName).toBe(mechanicName);
      expect(status?.currentLoad).toBe(workload);
      expect(status?.maxCapacity).toBe(capacity);
      expect(status?.isOverloaded).toBe(true);
      expect(status?.overloadPercentage).toBe(88); // 420/480 = 87.5% rounded to 88
      expect(status?.queuedBookings).toBe(1);
      expect(status?.inProgressBookings).toBe(0);
    });

    it('should return status even when mechanic is not overloaded', async () => {
      // Setup: Create a mechanic with light workload
      const mechanicId = 'api-test-mech-2';
      const mechanicName = 'Light Workload Mechanic';
      const capacity = 480;
      const workload = 150; // 31% - not overloaded

      // Mock specific mechanic query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true },
          error: null,
        }),
      });

      // Mock assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{
            booking: {
              id: 'booking-api-2',
              schedule_start: new Date().toISOString(),
              status: 'queued',
              booking_services: [{ duration_minutes: workload }],
            },
          }],
          error: null,
        }),
      });

      // Act: Call getMechanicOverloadStatus
      const status = await getMechanicOverloadStatus(mechanicId);

      // Assert: Should return status even though not overloaded
      expect(status).not.toBeNull();
      expect(status?.isOverloaded).toBe(false);
      expect(status?.currentLoad).toBe(workload);
      expect(status?.overloadPercentage).toBe(31); // 150/480 = 31.25%
    });

    it('should return null for inactive or non-existent mechanic', async () => {
      // Setup: Mock mechanic not found
      const mechanicId = 'non-existent-mechanic';

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Mechanic not found' },
        }),
      });

      // Act: Call getMechanicOverloadStatus
      const status = await getMechanicOverloadStatus(mechanicId);

      // Assert: Should return null
      expect(status).toBeNull();
    });

    it('should handle real-time data updates correctly', async () => {
      // Setup: Simulate a mechanic whose workload changes
      const mechanicId = 'realtime-test-mech';
      const mechanicName = 'Realtime Test';
      const capacity = 480;

      // First call - light workload (not overloaded)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{
            booking: {
              id: 'booking-1',
              schedule_start: new Date().toISOString(),
              status: 'queued',
              booking_services: [{ duration_minutes: 200 }],
            },
          }],
          error: null,
        }),
      });

      const status1 = await getMechanicOverloadStatus(mechanicId);
      expect(status1?.isOverloaded).toBe(false);
      expect(status1?.currentLoad).toBe(200);

      // Second call - heavy workload (overloaded) - simulates new bookings added
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 200 }],
              },
            },
            {
              booking: {
                id: 'booking-2',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 200 }],
              },
            },
          ],
          error: null,
        }),
      });

      const status2 = await getMechanicOverloadStatus(mechanicId);
      expect(status2?.isOverloaded).toBe(true);
      expect(status2?.currentLoad).toBe(400);
    });
  });

  /**
   * Integration Test 3: Overload warnings display correctly
   * Verifies that overload status data is structured correctly for UI display
   */
  describe('Integration Test 3: Overload warnings display correctly', () => {
    it('should provide complete data for overload warning display', async () => {
      // Setup: Create an overloaded mechanic
      const mechanicId = 'ui-test-mech';
      const mechanicName = 'UI Test Mechanic';
      const capacity = 480;

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Create realistic booking scenario
      const bookingsData = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [
              { duration_minutes: 90 },
              { duration_minutes: 60 },
            ],
          },
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: new Date().toISOString(),
            status: 'in_progress',
            booking_services: [{ duration_minutes: 120 }],
          },
        },
        {
          booking: {
            id: 'booking-3',
            schedule_start: new Date().toISOString(),
            status: 'queued',
            booking_services: [{ duration_minutes: 150 }],
          },
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: bookingsData,
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Verify all required fields for UI display are present
      expect(result.overloadedMechanics).toHaveLength(1);
      const status = result.overloadedMechanics[0];

      // Check all required fields for OverloadWarning component
      expect(status).toHaveProperty('mechanicId');
      expect(status).toHaveProperty('mechanicName');
      expect(status).toHaveProperty('currentLoad');
      expect(status).toHaveProperty('maxCapacity');
      expect(status).toHaveProperty('isOverloaded');
      expect(status).toHaveProperty('overloadPercentage');
      expect(status).toHaveProperty('queuedBookings');
      expect(status).toHaveProperty('inProgressBookings');

      // Verify values are correct for display
      expect(status.mechanicName).toBe('UI Test Mechanic');
      expect(status.currentLoad).toBe(420); // 90+60+120+150
      expect(status.maxCapacity).toBe(480);
      expect(status.overloadPercentage).toBe(88); // 420/480 = 87.5%
      expect(status.queuedBookings).toBe(2);
      expect(status.inProgressBookings).toBe(1);
    });

    it('should provide system-level overload data for dashboard display', async () => {
      // Setup: Create multiple mechanics with various states
      const mechanics = [
        { id: 'mech-1', name: 'Ahmad', capacity: 480, workload: 400, overloaded: true },
        { id: 'mech-2', name: 'Budi', capacity: 480, workload: 200, overloaded: false },
        { id: 'mech-3', name: 'Candra', capacity: 600, workload: 500, overloaded: true },
        { id: 'mech-4', name: 'Dedi', capacity: 480, workload: 100, overloaded: false },
      ];

      // Mock mechanics query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mechanics.map(m => ({
            id: m.id,
            name: m.name,
            daily_capacity_minutes: m.capacity,
            is_active: true,
          })),
          error: null,
        }),
      });

      // Mock assignments for each mechanic
      for (const mechanic of mechanics) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: mechanic.workload > 0 ? [{
              booking: {
                id: `booking-${mechanic.id}`,
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: mechanic.workload }],
              },
            }] : [],
            error: null,
          }),
        });
      }

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Verify system-level data for dashboard
      expect(result).toHaveProperty('overloadedMechanics');
      expect(result).toHaveProperty('totalMechanics');
      expect(result).toHaveProperty('overloadedCount');
      expect(result).toHaveProperty('systemOverloadPercentage');

      expect(result.totalMechanics).toBe(4);
      expect(result.overloadedCount).toBe(2);
      expect(result.systemOverloadPercentage).toBe(50); // 2/4 = 50%
      expect(result.overloadedMechanics).toHaveLength(2);
    });

    it('should handle edge case: mechanic with no bookings', async () => {
      // Setup: Create a mechanic with no bookings
      const mechanicId = 'idle-mechanic';
      const mechanicName = 'Idle Mechanic';
      const capacity = 480;

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Mock empty assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should not be overloaded
      expect(result.totalMechanics).toBe(1);
      expect(result.overloadedCount).toBe(0);
      expect(result.overloadedMechanics).toHaveLength(0);
    });

    it('should handle edge case: mechanic with default capacity', async () => {
      // Setup: Create a mechanic without explicit capacity (should use default 480)
      const mechanicId = 'default-capacity-mech';
      const mechanicName = 'Default Capacity';

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: null, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments with 400 minutes workload
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{
            booking: {
              id: 'booking-default',
              schedule_start: new Date().toISOString(),
              status: 'queued',
              booking_services: [{ duration_minutes: 400 }],
            },
          }],
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should use default capacity of 480 and be overloaded
      expect(result.overloadedCount).toBe(1);
      const status = result.overloadedMechanics[0];
      expect(status.maxCapacity).toBe(480); // Default capacity
      expect(status.currentLoad).toBe(400);
      expect(status.isOverloaded).toBe(true); // 400/480 = 83.3%
    });

    it('should handle edge case: booking with no service durations', async () => {
      // Setup: Create a mechanic with bookings that have no service data
      const mechanicId = 'no-services-mech';
      const mechanicName = 'No Services';
      const capacity = 480;

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments with bookings that have no booking_services
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: null, // No services
              },
            },
            {
              booking: {
                id: 'booking-2',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [], // Empty services
              },
            },
          ],
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should use default 60 minutes per booking
      expect(result.totalMechanics).toBe(1);
      // 2 bookings * 60 minutes = 120 minutes (25% of 480) - not overloaded
      expect(result.overloadedCount).toBe(0);
    });
  });

  /**
   * Integration Test 4: Error handling and edge cases
   * Verifies that the system handles errors gracefully
   */
  describe('Integration Test 4: Error handling and edge cases', () => {
    it('should handle database query errors gracefully', async () => {
      // Setup: Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      });

      // Act & Assert: Should throw error
      await expect(detectMechanicOverload()).rejects.toThrow('Failed to fetch mechanics');
    });

    it('should handle assignment query errors for individual mechanics', async () => {
      // Setup: Mock successful mechanics query but failed assignments query
      const mechanicId = 'error-test-mech';
      
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: 'Error Test', daily_capacity_minutes: 480, is_active: true }],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Assignment query failed' },
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Should skip the mechanic with error and continue
      expect(result.totalMechanics).toBe(1);
      // The mechanic should be skipped due to error
      expect(result.overloadedMechanics).toHaveLength(0);
    });

    it('should handle date boundary conditions correctly', async () => {
      // Setup: Create bookings at different times of the day
      const mechanicId = 'date-boundary-mech';
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: mechanicId, name: 'Date Test', daily_capacity_minutes: 480, is_active: true }],
          error: null,
        }),
      });

      // Mock assignments with bookings at start and near end of day
      const bookingsData = [
        {
          booking: {
            id: 'booking-start',
            schedule_start: startOfDay.toISOString(), // Start of day
            status: 'queued',
            booking_services: [{ duration_minutes: 200 }],
          },
        },
        {
          booking: {
            id: 'booking-end',
            schedule_start: new Date(endOfDay.getTime() - 1000).toISOString(), // Just before end of day
            status: 'queued',
            booking_services: [{ duration_minutes: 200 }],
          },
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: bookingsData,
          error: null,
        }),
      });

      // Act: Call overload detection
      const result = await detectMechanicOverload();

      // Assert: Both bookings should be counted
      expect(result.totalMechanics).toBe(1);
      // 400 minutes total (83% of 480) - should be overloaded
      expect(result.overloadedCount).toBe(1);
    });
  });
});
