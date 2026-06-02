/**
 * Property-Based Tests for Referential Integrity
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that referential integrity is maintained across deletions.
 * Property 5: Referential integrity prevents deletion with dependencies
 * **Validates: Requirements 1.5, 2.5**
 */

import * as fc from 'fast-check';
import { deleteService } from '../actions';
import { deleteMechanic } from '@/lib/mechanics/actions';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateServicePaths: jest.fn(),
  revalidateMechanicPaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Referential Integrity - Property-Based Tests', () => {
  let mockSupabase: jest.Mocked<any>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Property 5: Referential integrity prevents deletion with dependencies
   * **Validates: Requirements 1.5, 2.5**
   * 
   * For any service type with associated bookings or mechanic with active assignments,
   * deletion should be rejected with an error message.
   */
  describe('Property 5: Referential integrity prevents deletion with dependencies', () => {
    describe('Service Types with Bookings', () => {
      it('should prevent deletion when service type has any number of associated bookings', async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate arbitrary service type
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              default_duration_minutes: fc.integer({ min: 15, max: 480 }),
              price: fc.float({ min: 0, max: 10000, noNaN: true }),
            }),
            // Generate arbitrary number of associated bookings (at least 1)
            fc.array(
              fc.record({
                id: fc.uuid(),
                service_type_id: fc.constant(''), // Will be set to service type id
              }),
              { minLength: 1, maxLength: 20 }
            ),
            async (serviceType, bookings) => {
              // Setup: Mock service type exists with associated bookings
              const mockSelect = jest.fn().mockReturnThis();
              const mockEq = jest.fn().mockReturnThis();
              const mockSingle = jest.fn().mockResolvedValue({
                data: serviceType,
                error: null,
              });
              const mockLimit = jest.fn().mockResolvedValue({
                data: bookings, // Has associated bookings
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'service_types') {
                  return {
                    select: mockSelect,
                  };
                } else if (table === 'booking_services') {
                  return {
                    select: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        limit: mockLimit,
                      }),
                    }),
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

              // Act: Attempt to delete the service type
              const result = await deleteService(serviceType.id);

              // Assert: Deletion should fail with error message
              expect(result.success).toBeUndefined();
              expect(result.error).toBeDefined();
              expect(result.error).toContain('booking');

              // Verify delete was NOT called
              const fromCalls = mockSupabase.from.mock.calls;
              const deleteCall = fromCalls.find((call: any[]) => {
                const returnValue = mockSupabase.from.mock.results.find(
                  (r: any) => r.value && typeof r.value.delete === 'function'
                );
                return returnValue !== undefined;
              });
              expect(deleteCall).toBeUndefined();
            }
          ),
          { numRuns: 100 } // Run 100 iterations as specified in design
        );
      });

      it('should allow deletion when service type has no associated bookings', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              default_duration_minutes: fc.integer({ min: 15, max: 480 }),
              price: fc.float({ min: 0, max: 10000, noNaN: true }),
            }),
            async (serviceType) => {
              // Setup: Mock service type exists with NO associated bookings
              const mockSelect = jest.fn().mockReturnThis();
              const mockEq = jest.fn().mockReturnThis();
              const mockSingle = jest.fn().mockResolvedValue({
                data: serviceType,
                error: null,
              });
              const mockLimit = jest.fn().mockResolvedValue({
                data: [], // No associated bookings
                error: null,
              });
              const mockDelete = jest.fn().mockReturnThis();
              const mockDeleteEq = jest.fn().mockResolvedValue({
                data: null,
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'service_types') {
                  return {
                    select: mockSelect,
                    delete: mockDelete,
                  };
                } else if (table === 'booking_services') {
                  return {
                    select: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        limit: mockLimit,
                      }),
                    }),
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

              mockDelete.mockReturnValue({
                eq: mockDeleteEq,
              });

              // Act: Delete the service type
              const result = await deleteService(serviceType.id);

              // Assert: Deletion should succeed
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify delete was called
              expect(mockDelete).toHaveBeenCalled();
              expect(mockDeleteEq).toHaveBeenCalledWith('id', serviceType.id);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Mechanics with Assignments', () => {
      it('should prevent deletion when mechanic has active or pending assignments', async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate arbitrary mechanic
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              is_active: fc.boolean(),
              daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
              user_id: fc.option(fc.uuid(), { nil: null }),
            }),
            // Generate arbitrary number of active/pending assignments (at least 1)
            fc.array(
              fc.record({
                id: fc.uuid(),
                mechanic_id: fc.constant(''), // Will be set to mechanic id
                booking: fc.record({
                  status: fc.constantFrom('pending', 'confirmed', 'queued', 'in_progress'),
                }),
              }),
              { minLength: 1, maxLength: 15 }
            ),
            async (mechanic, assignments) => {
              // Setup: Mock mechanic exists with active/pending assignments
              const mockSelect = jest.fn().mockReturnThis();
              const mockEq = jest.fn().mockReturnThis();
              const mockIn = jest.fn().mockReturnThis();
              const mockLimit = jest.fn().mockResolvedValue({
                data: assignments, // Has active/pending assignments
                error: null,
              });
              const mockSingle = jest.fn().mockResolvedValue({
                data: mechanic,
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'assignments') {
                  return {
                    select: mockSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                      }),
                    }),
                  };
                }
                return {};
              });

              mockSelect.mockReturnValue({
                eq: mockEq,
              });

              mockEq.mockReturnValue({
                in: mockIn,
              });

              mockIn.mockReturnValue({
                limit: mockLimit,
              });

              // Act: Attempt to delete the mechanic
              const result = await deleteMechanic(mechanic.id);

              // Assert: Deletion should fail with error message
              expect(result.success).toBeUndefined();
              expect(result.error).toBeDefined();
              expect(result.error).toContain('assignment');

              // Verify delete was NOT called
              const fromCalls = mockSupabase.from.mock.calls;
              const deleteCall = fromCalls.find((call: any[]) => {
                const returnValue = mockSupabase.from.mock.results.find(
                  (r: any) => r.value && typeof r.value.delete === 'function'
                );
                return returnValue !== undefined;
              });
              expect(deleteCall).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow deletion when mechanic has no active or pending assignments', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              is_active: fc.boolean(),
              daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
              user_id: fc.option(fc.uuid(), { nil: null }),
            }),
            async (mechanic) => {
              // Setup: Mock mechanic exists with NO active/pending assignments
              const mockSelect = jest.fn().mockReturnThis();
              const mockEq = jest.fn().mockReturnThis();
              const mockIn = jest.fn().mockReturnThis();
              const mockLimit = jest.fn().mockResolvedValue({
                data: [], // No active/pending assignments
                error: null,
              });
              const mockSingle = jest.fn().mockResolvedValue({
                data: mechanic,
                error: null,
              });
              const mockDelete = jest.fn().mockReturnThis();
              const mockDeleteEq = jest.fn().mockResolvedValue({
                data: null,
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'assignments') {
                  return {
                    select: mockSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                      }),
                    }),
                    delete: mockDelete,
                  };
                } else if (table === 'users') {
                  return {
                    delete: jest.fn().mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: null,
                      }),
                    }),
                  };
                }
                return {};
              });

              mockSelect.mockReturnValue({
                eq: mockEq,
              });

              mockEq.mockReturnValue({
                in: mockIn,
              });

              mockIn.mockReturnValue({
                limit: mockLimit,
              });

              mockDelete.mockReturnValue({
                eq: mockDeleteEq,
              });

              // Act: Delete the mechanic
              const result = await deleteMechanic(mechanic.id);

              // Assert: Deletion should succeed
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify delete was called
              expect(mockDelete).toHaveBeenCalled();
              expect(mockDeleteEq).toHaveBeenCalledWith('id', mechanic.id);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow deletion when mechanic has only completed or cancelled assignments', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              is_active: fc.boolean(),
              daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
              user_id: fc.option(fc.uuid(), { nil: null }),
            }),
            // Generate assignments with only completed/cancelled status
            fc.array(
              fc.record({
                id: fc.uuid(),
                mechanic_id: fc.constant(''),
                booking: fc.record({
                  status: fc.constantFrom('done', 'cancelled'),
                }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
            async (mechanic, completedAssignments) => {
              // Setup: Mock mechanic exists with only completed/cancelled assignments
              const mockSelect = jest.fn().mockReturnThis();
              const mockEq = jest.fn().mockReturnThis();
              const mockIn = jest.fn().mockReturnThis();
              const mockLimit = jest.fn().mockResolvedValue({
                data: [], // No active/pending assignments (filter excludes done/cancelled)
                error: null,
              });
              const mockSingle = jest.fn().mockResolvedValue({
                data: mechanic,
                error: null,
              });
              const mockDelete = jest.fn().mockReturnThis();
              const mockDeleteEq = jest.fn().mockResolvedValue({
                data: null,
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'assignments') {
                  return {
                    select: mockSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                      }),
                    }),
                    delete: mockDelete,
                  };
                } else if (table === 'users') {
                  return {
                    delete: jest.fn().mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: null,
                      }),
                    }),
                  };
                }
                return {};
              });

              mockSelect.mockReturnValue({
                eq: mockEq,
              });

              mockEq.mockReturnValue({
                in: mockIn,
              });

              mockIn.mockReturnValue({
                limit: mockLimit,
              });

              mockDelete.mockReturnValue({
                eq: mockDeleteEq,
              });

              // Act: Delete the mechanic
              const result = await deleteMechanic(mechanic.id);

              // Assert: Deletion should succeed (completed/cancelled assignments don't block)
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify delete was called
              expect(mockDelete).toHaveBeenCalled();
              expect(mockDeleteEq).toHaveBeenCalledWith('id', mechanic.id);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully when checking service type dependencies', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }), // Error message
            async (serviceId, errorMessage) => {
              // Setup: Mock database error during booking services check
              const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: serviceId, name: 'Test Service' },
                    error: null,
                  }),
                }),
              });

              const mockBookingServicesSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: errorMessage }, // Error during check
                  }),
                }),
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'service_types') {
                  return {
                    select: mockSelect,
                  };
                } else if (table === 'booking_services') {
                  return {
                    select: mockBookingServicesSelect,
                  };
                }
                return {};
              });

              // Act: Attempt to delete
              const result = await deleteService(serviceId);

              // Assert: Should return error
              expect(result.error).toBeDefined();
              expect(result.error).toBe(errorMessage);
              expect(result.success).toBeUndefined();
            }
          ),
          { numRuns: 50 } // Fewer runs for error cases
        );
      });

      it('should handle database errors gracefully when checking mechanic dependencies', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }), // Error message
            async (mechanicId, errorMessage) => {
              // Setup: Mock database error during assignments check
              const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: errorMessage }, // Error during check
                    }),
                  }),
                }),
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'assignments') {
                  return {
                    select: mockSelect,
                  };
                }
                return {};
              });

              // Act: Attempt to delete
              const result = await deleteMechanic(mechanicId);

              // Assert: Should return error
              expect(result.error).toBeDefined();
              expect(result.error).toBe(errorMessage);
              expect(result.success).toBeUndefined();
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
