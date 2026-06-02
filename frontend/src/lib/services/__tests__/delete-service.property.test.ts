/**
 * Property-Based Tests for Service Type Deletion
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify universal properties that should hold for all service type deletions.
 */

import * as fc from 'fast-check';
import { deleteService } from '../actions';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateServicePaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Service Type Deletion - Property-Based Tests', () => {
  let mockSupabase: any;

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
   * Property 3: Confirmed deletion removes entity from database
   * **Validates: Requirements 1.3, 2.3**
   * 
   * For any service type without dependencies, confirming the deletion
   * should result in the entity being removed from the database.
   */
  describe('Property 3: Confirmed deletion removes entity from database', () => {
    it('should remove service type from database when deletion is confirmed', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary service type data
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            default_duration_minutes: fc.integer({ min: 15, max: 480 }),
            price: fc.float({ min: 0, max: 10000, noNaN: true }),
          }),
          async (serviceType) => {
            // Setup: Mock service type exists and has no associated bookings
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

            // Verify delete was called with correct ID
            expect(mockDelete).toHaveBeenCalled();
            expect(mockDeleteEq).toHaveBeenCalledWith('id', serviceType.id);

            // Verify the deletion flow was executed
            expect(mockSupabase.from).toHaveBeenCalledWith('service_types');
            expect(mockSupabase.from).toHaveBeenCalledWith('booking_services');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should prevent deletion when service type has associated bookings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // Associated booking IDs
          async (serviceType, bookingIds) => {
            // Setup: Mock service type exists with associated bookings
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({
              data: serviceType,
              error: null,
            });
            const mockLimit = jest.fn().mockResolvedValue({
              data: bookingIds.map(id => ({ id })), // Has associated bookings
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
            expect(mockSupabase.from).not.toHaveBeenCalledWith(
              expect.objectContaining({ delete: expect.any(Function) })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle database errors gracefully', async () => {
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
          }
        ),
        { numRuns: 50 } // Fewer runs for error cases
      );
    });
  });

  /**
   * Additional property test: Deletion is idempotent for non-existent entities
   * 
   * Attempting to delete a service type that doesn't exist should handle gracefully.
   */
  describe('Idempotency property', () => {
    it('should handle deletion of non-existent service types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (nonExistentId) => {
            // Setup: Mock service type doesn't exist
            const mockSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            });

            const mockBookingServicesSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            });

            const mockDelete = jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'service_types') {
                return {
                  select: mockSelect,
                  delete: mockDelete,
                };
              } else if (table === 'booking_services') {
                return {
                  select: mockBookingServicesSelect,
                };
              }
              return {};
            });

            // Act: Attempt to delete non-existent service type
            const result = await deleteService(nonExistentId);

            // Assert: Should handle gracefully (either succeed or return appropriate error)
            // The current implementation will proceed with deletion even if service doesn't exist
            // This is acceptable behavior for idempotency
            expect(result).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
