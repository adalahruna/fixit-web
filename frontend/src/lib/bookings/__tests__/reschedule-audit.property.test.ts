/**
 * Property-Based Tests for Booking Reschedule Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that booking reschedule operations generate appropriate audit logs
 * with original and new schedule information in metadata.
 */

import * as fc from 'fast-check';
import { rescheduleBooking } from '../reschedule-actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateBookingPaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));
jest.mock('@/lib/utils/slot-availability', () => ({
  checkSlotAvailability: jest.fn().mockResolvedValue({
    available: true,
    message: 'Slot tersedia',
  }),
}));

describe('Booking Reschedule Audit Logging - Property-Based Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
  });

  /**
   * Property 10: Reschedule operations generate audit logs
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any booking reschedule operation, an audit log entry with action "reschedule_booking"
   * should be inserted with original and new schedule information in metadata.
   */
  describe('Property 10: Reschedule operations generate audit logs', () => {
    it('should generate audit log for every booking reschedule', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            userId: fc.uuid(),
            originalScheduleStart: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            originalScheduleEnd: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            newDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2025-12-31') }),
            newTimeHour: fc.integer({ min: 8, max: 16 }), // 08:00 - 16:00 to allow for service duration
            newTimeMinute: fc.constantFrom(0, 15, 30, 45),
            serviceDuration: fc.integer({ min: 30, max: 120 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
            
            // Format new time
            const newTime = `${testData.newTimeHour.toString().padStart(2, '0')}:${testData.newTimeMinute.toString().padStart(2, '0')}`;
            const newDate = testData.newDate.toISOString().split('T')[0];
            
            // Calculate original schedule that's at least 25 hours in the future (H-1 rule)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2); // 2 days in future to satisfy H-1 rule
            const originalScheduleStart = futureDate.toISOString();
            const originalScheduleEnd = new Date(futureDate.getTime() + testData.serviceDuration * 60000).toISOString();

            // Setup: Mock authenticated user
            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.userId } },
              error: null,
            });

            // Setup: Mock booking exists and belongs to user
            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.userId,
              status: 'pending',
              schedule_start: originalScheduleStart,
              schedule_end: originalScheduleEnd,
              booking_services: [
                {
                  service_type: {
                    default_duration_minutes: testData.serviceDuration,
                  },
                },
              ],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            const mockUpdate = jest.fn().mockReturnThis();
            const mockUpdateEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'bookings') {
                return {
                  select: mockSelect,
                  update: mockUpdate,
                };
              }
              return {};
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            mockUpdate.mockReturnValue({
              eq: mockUpdateEq,
            });

            // Act: Reschedule booking
            await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Audit log should be created
            expect(logAuditActivity).toHaveBeenCalledWith(
              AUDIT_ACTIONS.RESCHEDULE_BOOKING,
              AUDIT_ENTITIES.BOOKING,
              testData.bookingId,
              expect.objectContaining({
                original_schedule_start: originalScheduleStart,
                original_schedule_end: originalScheduleEnd,
                new_schedule_start: expect.any(String),
                new_schedule_end: expect.any(String),
              })
            );

            // Verify audit log was called exactly once
            expect(logAuditActivity).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include complete schedule information in reschedule audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            userId: fc.uuid(),
            newTimeHour: fc.integer({ min: 8, max: 16 }),
            newTimeMinute: fc.constantFrom(0, 15, 30, 45),
            serviceDuration: fc.integer({ min: 30, max: 120 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
            
            const newTime = `${testData.newTimeHour.toString().padStart(2, '0')}:${testData.newTimeMinute.toString().padStart(2, '0')}`;
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);
            const newDate = futureDate.toISOString().split('T')[0];
            
            const originalScheduleStart = new Date();
            originalScheduleStart.setDate(originalScheduleStart.getDate() + 2);
            const originalScheduleEnd = new Date(originalScheduleStart.getTime() + testData.serviceDuration * 60000);

            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.userId } },
              error: null,
            });

            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.userId,
              status: 'pending',
              schedule_start: originalScheduleStart.toISOString(),
              schedule_end: originalScheduleEnd.toISOString(),
              booking_services: [
                {
                  service_type: {
                    default_duration_minutes: testData.serviceDuration,
                  },
                },
              ],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            const mockUpdate = jest.fn().mockReturnThis();
            const mockUpdateEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'bookings') {
                return {
                  select: mockSelect,
                  update: mockUpdate,
                };
              }
              return {};
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            mockUpdate.mockReturnValue({
              eq: mockUpdateEq,
            });

            await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Metadata should contain all required schedule fields
            const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
            const metadata = auditCall[3];

            expect(metadata).toHaveProperty('original_schedule_start');
            expect(metadata).toHaveProperty('original_schedule_end');
            expect(metadata).toHaveProperty('new_schedule_start');
            expect(metadata).toHaveProperty('new_schedule_end');

            // Verify the original schedule is from the booking (use string comparison)
            expect(metadata.original_schedule_start).toEqual(mockBooking.schedule_start);
            expect(metadata.original_schedule_end).toEqual(mockBooking.schedule_end);

            // Verify new schedule is different from original
            expect(metadata.new_schedule_start).not.toBe(metadata.original_schedule_start);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not generate audit log when reschedule fails due to invalid status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            userId: fc.uuid(),
            invalidStatus: fc.constantFrom('in_progress', 'done', 'cancelled'),
          }),
          async (testData) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2);
            const newDate = futureDate.toISOString().split('T')[0];
            const newTime = '10:00';

            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.userId } },
              error: null,
            });

            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.userId,
              status: testData.invalidStatus,
              schedule_start: futureDate.toISOString(),
              schedule_end: new Date(futureDate.getTime() + 60 * 60000).toISOString(),
              booking_services: [],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            mockSupabase.from.mockReturnValue({
              select: mockSelect,
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            // Act: Attempt to reschedule booking with invalid status
            const result = await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Should return error
            expect(result.error).toBeDefined();

            // Assert: Audit log should NOT be created
            expect(logAuditActivity).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not generate audit log when reschedule fails due to H-1 rule', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            userId: fc.uuid(),
            hoursUntilSchedule: fc.integer({ min: 1, max: 23 }), // Less than 24 hours
          }),
          async (testData) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2);
            const newDate = futureDate.toISOString().split('T')[0];
            const newTime = '10:00';

            // Schedule is less than 24 hours away
            const nearFutureSchedule = new Date();
            nearFutureSchedule.setHours(nearFutureSchedule.getHours() + testData.hoursUntilSchedule);

            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.userId } },
              error: null,
            });

            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.userId,
              status: 'pending',
              schedule_start: nearFutureSchedule.toISOString(),
              schedule_end: new Date(nearFutureSchedule.getTime() + 60 * 60000).toISOString(),
              booking_services: [],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            mockSupabase.from.mockReturnValue({
              select: mockSelect,
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            // Act: Attempt to reschedule booking within H-1 window
            const result = await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Should return error about H-1 rule
            expect(result.error).toBeDefined();
            expect(result.error).toContain('H-1');

            // Assert: Audit log should NOT be created
            expect(logAuditActivity).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not generate audit log when user is unauthorized', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            ownerId: fc.uuid(),
            unauthorizedUserId: fc.uuid(),
          }),
          async (testData) => {
            // Ensure the two user IDs are different
            if (testData.ownerId === testData.unauthorizedUserId) {
              return; // Skip this iteration
            }

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2);
            const newDate = futureDate.toISOString().split('T')[0];
            const newTime = '10:00';

            // User is authenticated but not the owner
            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.unauthorizedUserId } },
              error: null,
            });

            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.ownerId, // Different from authenticated user
              status: 'pending',
              schedule_start: futureDate.toISOString(),
              schedule_end: new Date(futureDate.getTime() + 60 * 60000).toISOString(),
              booking_services: [],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            mockSupabase.from.mockReturnValue({
              select: mockSelect,
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            // Act: Attempt to reschedule booking as unauthorized user
            const result = await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Should return authorization error
            expect(result.error).toBeDefined();

            // Assert: Audit log should NOT be created
            expect(logAuditActivity).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Audit logging doesn't block reschedule operation on failure
   * 
   * Even if audit logging fails, the reschedule operation should succeed.
   */
  describe('Audit failure handling', () => {
    it('should not block reschedule operation when audit logging fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bookingId: fc.uuid(),
            userId: fc.uuid(),
            serviceDuration: fc.integer({ min: 30, max: 120 }),
          }),
          async (testData) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            
            // Setup: Mock audit logging to fail
            (logAuditActivity as jest.Mock).mockRejectedValue(new Error('Audit system unavailable'));
            
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);
            const newDate = futureDate.toISOString().split('T')[0];
            const newTime = '10:00';

            const originalScheduleStart = new Date();
            originalScheduleStart.setDate(originalScheduleStart.getDate() + 2);
            const originalScheduleEnd = new Date(originalScheduleStart.getTime() + testData.serviceDuration * 60000);

            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: { id: testData.userId } },
              error: null,
            });

            const mockBooking = {
              id: testData.bookingId,
              customer_id: testData.userId,
              status: 'pending',
              schedule_start: originalScheduleStart.toISOString(),
              schedule_end: originalScheduleEnd.toISOString(),
              booking_services: [
                {
                  service_type: {
                    default_duration_minutes: testData.serviceDuration,
                  },
                },
              ],
            };

            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            });

            const mockUpdate = jest.fn().mockReturnThis();
            const mockUpdateEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'bookings') {
                return {
                  select: mockSelect,
                  update: mockUpdate,
                };
              }
              return {};
            });

            mockSelect.mockReturnValue({
              eq: mockEq,
            });

            mockEq.mockReturnValue({
              single: mockSingle,
            });

            mockUpdate.mockReturnValue({
              eq: mockUpdateEq,
            });

            // Act: Reschedule booking
            const result = await rescheduleBooking(testData.bookingId, newDate, newTime);

            // Assert: Operation should succeed despite audit failure
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();

            // Verify audit was attempted
            expect(logAuditActivity).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
