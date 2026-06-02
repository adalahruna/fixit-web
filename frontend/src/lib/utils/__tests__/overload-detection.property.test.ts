/**
 * Property-Based Tests for Mechanic Overload Detection
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that overload detection uses real database data,
 * correctly calculates workload, and properly identifies overloaded mechanics.
 */

import * as fc from 'fast-check';
import { detectMechanicOverload, getMechanicOverloadStatus } from '../overload-detection';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Overload Detection - Property-Based Tests', () => {
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
   * Property 17: Overload detection uses real database data
   * **Validates: Requirements 8.1**
   * 
   * For any call to the overload detection function, it should query the assignments
   * and bookings tables from the database rather than using mock or hardcoded data.
   */
  describe('Property 17: Overload detection uses real database data', () => {
    it('should query mechanics table from database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
              is_active: fc.constant(true),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (mechanics) => {
            // Setup: Mock mechanics query
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: mechanics,
                error: null,
              }),
            });

            // Mock assignments query for each mechanic
            for (let i = 0; i < mechanics.length; i++) {
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
            }

            // Act: Call overload detection
            await detectMechanicOverload();

            // Assert: Should query mechanics table
            expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should query assignments table for each mechanic', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
          }),
          async ({ mechanicId, mechanicName, capacity }) => {
            // Setup: Mock single mechanic
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
                error: null,
              }),
            });

            // Mock assignments query
            const mockAssignmentsQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
            mockSupabase.from.mockReturnValueOnce(mockAssignmentsQuery);

            // Act: Call overload detection
            await detectMechanicOverload();

            // Assert: Should query assignments table
            expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
            // Verify it filters by mechanic_id
            expect(mockAssignmentsQuery.eq).toHaveBeenCalledWith('mechanic_id', mechanicId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should query bookings data through assignments join', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (mechanicId) => {
            // Setup: Mock mechanic
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: 'Test Mechanic', daily_capacity_minutes: 480, is_active: true }],
                error: null,
              }),
            });

            // Mock assignments query with booking join
            const mockAssignmentsQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
            mockSupabase.from.mockReturnValueOnce(mockAssignmentsQuery);

            // Act
            await detectMechanicOverload();

            // Assert: Should select booking data with join
            expect(mockAssignmentsQuery.select).toHaveBeenCalledWith(
              expect.stringContaining('booking:bookings')
            );
            expect(mockAssignmentsQuery.select).toHaveBeenCalledWith(
              expect.stringContaining('booking_services')
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Workload calculation sums service durations
   * **Validates: Requirements 8.2**
   * 
   * For any mechanic with assigned bookings for the current day, the calculated workload
   * should equal the sum of all booking service durations.
   */
  describe('Property 18: Workload calculation sums service durations', () => {
    it('should sum all service durations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
            bookings: fc.array(
              fc.record({
                id: fc.uuid(),
                status: fc.constantFrom('queued', 'in_progress'),
                services: fc.array(
                  fc.record({
                    duration_minutes: fc.integer({ min: 15, max: 240 }),
                  }),
                  { minLength: 1, maxLength: 3 }
                ),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          async ({ mechanicId, mechanicName, capacity, bookings }) => {
            // Calculate expected total workload
            const expectedWorkload = bookings.reduce((total, booking) => {
              const bookingDuration = booking.services.reduce((sum, service) => sum + service.duration_minutes, 0);
              return total + bookingDuration;
            }, 0);

            // Setup: Mock mechanic
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
                error: null,
              }),
            });

            // Mock assignments with bookings
            const assignmentsData = bookings.map(booking => ({
              booking: {
                id: booking.id,
                schedule_start: new Date().toISOString(),
                status: booking.status,
                booking_services: booking.services,
              },
            }));

            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: assignmentsData,
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert: Find the mechanic's status
            const allStatuses = [
              ...result.overloadedMechanics,
              // Need to get all mechanics, not just overloaded ones
              // The function only returns overloaded mechanics in the array
            ];

            // Since the function filters overloadedMechanics, we need to check if this mechanic is in the result
            // If overloaded, it should be in overloadedMechanics
            // If not overloaded, we can't verify from the return value directly
            // So we verify the calculation logic by checking if overloaded status is correct
            const isExpectedOverloaded = (expectedWorkload / capacity) >= 0.8;

            if (isExpectedOverloaded) {
              // Should be in overloadedMechanics array
              const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
              expect(mechanicStatus).toBeDefined();
              expect(mechanicStatus?.currentLoad).toBe(expectedWorkload);
            } else {
              // Should not be in overloadedMechanics array
              const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
              expect(mechanicStatus).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle bookings with multiple services correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            capacity: fc.integer({ min: 240, max: 600 }),
            booking: fc.record({
              id: fc.uuid(),
              services: fc.array(
                fc.record({
                  duration_minutes: fc.integer({ min: 15, max: 120 }),
                }),
                { minLength: 2, maxLength: 5 }
              ),
            }),
          }),
          async ({ mechanicId, capacity, booking }) => {
            // Calculate expected workload for this booking
            const expectedBookingDuration = booking.services.reduce(
              (sum, service) => sum + service.duration_minutes,
              0
            );

            // Setup mocks
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: 'Test', daily_capacity_minutes: capacity, is_active: true }],
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
                    id: booking.id,
                    schedule_start: new Date().toISOString(),
                    status: 'queued',
                    booking_services: booking.services,
                  },
                }],
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert: Workload should equal sum of all service durations
            const isExpectedOverloaded = (expectedBookingDuration / capacity) >= 0.8;
            if (isExpectedOverloaded) {
              const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
              expect(mechanicStatus?.currentLoad).toBe(expectedBookingDuration);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default 60 minutes when booking has no services', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            capacity: fc.integer({ min: 240, max: 600 }),
            bookingCount: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ mechanicId, capacity, bookingCount }) => {
            // Expected workload: 60 minutes per booking
            const expectedWorkload = bookingCount * 60;

            // Setup mocks
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: 'Test', daily_capacity_minutes: capacity, is_active: true }],
                error: null,
              }),
            });

            // Create bookings without booking_services
            const bookingsWithoutServices = Array.from({ length: bookingCount }, (_, i) => ({
              booking: {
                id: `booking-${i}`,
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: null, // No services
              },
            }));

            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: bookingsWithoutServices,
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert
            const isExpectedOverloaded = (expectedWorkload / capacity) >= 0.8;
            if (isExpectedOverloaded) {
              const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
              expect(mechanicStatus?.currentLoad).toBe(expectedWorkload);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 19: Overload threshold correctly identifies overloaded mechanics
   * **Validates: Requirements 8.3**
   * 
   * For any mechanic whose workload is greater than or equal to 80% of their daily capacity,
   * the system should mark them as overloaded.
   */
  describe('Property 19: Overload threshold correctly identifies overloaded mechanics', () => {
    it('should mark mechanic as overloaded when workload >= 80%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
            workloadPercentage: fc.integer({ min: 80, max: 100 }),
          }),
          async ({ mechanicId, mechanicName, capacity, workloadPercentage }) => {
            // Calculate workload to achieve the desired percentage
            // Use Math.ceil to ensure we're at or above the threshold
            const workload = Math.ceil((capacity * workloadPercentage) / 100);

            // Setup mocks
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
                error: null,
              }),
            });

            // Create a single booking with the calculated workload
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
                    booking_services: [{ duration_minutes: workload }],
                  },
                }],
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert: Should be marked as overloaded
            expect(result.overloadedCount).toBeGreaterThan(0);
            const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
            expect(mechanicStatus).toBeDefined();
            expect(mechanicStatus?.isOverloaded).toBe(true);
            expect(mechanicStatus?.currentLoad).toBe(workload);
            expect(mechanicStatus?.maxCapacity).toBe(capacity);
            expect(mechanicStatus?.overloadPercentage).toBeGreaterThanOrEqual(80);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT mark mechanic as overloaded when workload < 80%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
            workloadPercentage: fc.integer({ min: 0, max: 79 }),
          }),
          async ({ mechanicId, mechanicName, capacity, workloadPercentage }) => {
            // Calculate workload to achieve the desired percentage
            const workload = Math.floor((capacity * workloadPercentage) / 100);

            // Setup mocks
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
                error: null,
              }),
            });

            // Create a single booking with the calculated workload
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: workload > 0 ? [{
                  booking: {
                    id: 'booking-1',
                    schedule_start: new Date().toISOString(),
                    status: 'queued',
                    booking_services: [{ duration_minutes: workload }],
                  },
                }] : [],
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert: Should NOT be marked as overloaded
            const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
            expect(mechanicStatus).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify overload at exactly 80% threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
          }),
          async ({ mechanicId, mechanicName, capacity }) => {
            // Calculate exactly 80% workload
            // Use Math.ceil to ensure we're at or above the threshold
            const workload = Math.ceil((capacity * 80) / 100);

            // Setup mocks
            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [{ id: mechanicId, name: mechanicName, daily_capacity_minutes: capacity, is_active: true }],
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
                    booking_services: [{ duration_minutes: workload }],
                  },
                }],
                error: null,
              }),
            });

            // Act
            const result = await detectMechanicOverload();

            // Assert: Should be marked as overloaded (>= 80%)
            const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanicId);
            expect(mechanicStatus).toBeDefined();
            expect(mechanicStatus?.isOverloaded).toBe(true);
            expect(mechanicStatus?.overloadPercentage).toBeGreaterThanOrEqual(80);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple mechanics with different overload states', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              capacity: fc.integer({ min: 240, max: 600 }),
              workloadPercentage: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (mechanics) => {
            // Calculate expected overloaded count
            const expectedOverloadedCount = mechanics.filter(m => m.workloadPercentage >= 80).length;

            // Setup: Mock mechanics query
            const mechanicsData = mechanics.map(m => ({
              id: m.id,
              name: m.name,
              daily_capacity_minutes: m.capacity,
              is_active: true,
            }));

            mockSupabase.from.mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: mechanicsData,
                error: null,
              }),
            });

            // Mock assignments for each mechanic
            for (const mechanic of mechanics) {
              const workload = Math.floor((mechanic.capacity * mechanic.workloadPercentage) / 100);
              
              mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValue({
                  data: workload > 0 ? [{
                    booking: {
                      id: `booking-${mechanic.id}`,
                      schedule_start: new Date().toISOString(),
                      status: 'queued',
                      booking_services: [{ duration_minutes: workload }],
                    },
                  }] : [],
                  error: null,
                }),
              });
            }

            // Act
            const result = await detectMechanicOverload();

            // Assert
            expect(result.totalMechanics).toBe(mechanics.length);
            expect(result.overloadedCount).toBe(expectedOverloadedCount);
            expect(result.overloadedMechanics).toHaveLength(expectedOverloadedCount);

            // Verify each overloaded mechanic is correctly identified
            for (const mechanic of mechanics) {
              const mechanicStatus = result.overloadedMechanics.find(m => m.mechanicId === mechanic.id);
              if (mechanic.workloadPercentage >= 80) {
                expect(mechanicStatus).toBeDefined();
                expect(mechanicStatus?.isOverloaded).toBe(true);
              } else {
                expect(mechanicStatus).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional tests for getMechanicOverloadStatus function
   */
  describe('getMechanicOverloadStatus - Property Tests', () => {
    it('should return correct status for any mechanic workload', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
            workload: fc.integer({ min: 0, max: 600 }),
          }),
          async ({ mechanicId, mechanicName, capacity, workload }) => {
            // Setup: Mock specific mechanic query
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
                data: workload > 0 ? [{
                  booking: {
                    id: 'booking-1',
                    schedule_start: new Date().toISOString(),
                    status: 'queued',
                    booking_services: [{ duration_minutes: workload }],
                  },
                }] : [],
                error: null,
              }),
            });

            // Act
            const status = await getMechanicOverloadStatus(mechanicId);

            // Assert
            expect(status).not.toBeNull();
            expect(status?.mechanicId).toBe(mechanicId);
            expect(status?.mechanicName).toBe(mechanicName);
            expect(status?.currentLoad).toBe(workload);
            expect(status?.maxCapacity).toBe(capacity);

            // Verify overload status
            const expectedOverloaded = (workload / capacity) >= 0.8;
            expect(status?.isOverloaded).toBe(expectedOverloaded);

            // Verify percentage calculation
            const expectedPercentage = Math.round((workload / capacity) * 100);
            expect(status?.overloadPercentage).toBe(expectedPercentage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return status even when mechanic is not overloaded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicId: fc.uuid(),
            mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            capacity: fc.integer({ min: 240, max: 600 }),
            workloadPercentage: fc.integer({ min: 0, max: 79 }),
          }),
          async ({ mechanicId, mechanicName, capacity, workloadPercentage }) => {
            const workload = Math.floor((capacity * workloadPercentage) / 100);

            // Setup mocks
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
                data: workload > 0 ? [{
                  booking: {
                    id: 'booking-1',
                    schedule_start: new Date().toISOString(),
                    status: 'queued',
                    booking_services: [{ duration_minutes: workload }],
                  },
                }] : [],
                error: null,
              }),
            });

            // Act
            const status = await getMechanicOverloadStatus(mechanicId);

            // Assert: Should return status even when not overloaded
            expect(status).not.toBeNull();
            expect(status?.isOverloaded).toBe(false);
            expect(status?.currentLoad).toBe(workload);
            expect(status?.overloadPercentage).toBeLessThan(80);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
