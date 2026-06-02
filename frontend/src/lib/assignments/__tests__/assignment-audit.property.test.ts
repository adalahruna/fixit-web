/**
 * Property-Based Tests for Assignment Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that mechanic assignment and unassignment operations generate appropriate audit logs.
 */

import * as fc from 'fast-check';
import { assignMechanic, unassignMechanic } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateAssignmentPaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Assignment Audit Logging - Property-Based Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      rpc: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
  });

  /**
   * Property 11: Assignment operations generate audit logs
   * **Validates: Requirements 6.1, 6.2**
   * 
   * For any mechanic assignment or unassignment operation, an audit log entry with the
   * appropriate action should be inserted with booking and mechanic information.
   */
  describe('Property 11: Assignment operations generate audit logs', () => {
    describe('Assign Mechanic', () => {
      it('should generate audit log for every mechanic assignment', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
              mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, mechanicId, mechanicName }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
              
              // Setup: Mock authenticated admin user
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              // Mock user role check
              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              // Mock mechanic name fetch
              const mockMechanicSelect = jest.fn().mockReturnThis();
              const mockMechanicEq = jest.fn().mockReturnThis();
              const mockMechanicSingle = jest.fn().mockResolvedValue({
                data: { name: mechanicName },
                error: null,
              });

              // Mock RPC call for assignment
              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              let callCount = 0;
              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: mockMechanicSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockMechanicSelect.mockReturnValue({
                eq: mockMechanicEq,
              });

              mockMechanicEq.mockReturnValue({
                single: mockMechanicSingle,
              });

              // Act: Assign mechanic
              await assignMechanic(bookingId, mechanicId);

              // Assert: Audit log should be created
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.ASSIGN_MECHANIC,
                AUDIT_ENTITIES.ASSIGNMENT,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: mechanicId,
                  mechanic_name: mechanicName,
                })
              );

              // Verify audit log was called exactly once
              expect(logAuditActivity).toHaveBeenCalledTimes(1);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include complete metadata in assignment audit logs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
              mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, mechanicId, mechanicName }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
              
              // Setup
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockMechanicSelect = jest.fn().mockReturnThis();
              const mockMechanicEq = jest.fn().mockReturnThis();
              const mockMechanicSingle = jest.fn().mockResolvedValue({
                data: { name: mechanicName },
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: mockMechanicSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockMechanicSelect.mockReturnValue({
                eq: mockMechanicEq,
              });

              mockMechanicEq.mockReturnValue({
                single: mockMechanicSingle,
              });

              // Act
              await assignMechanic(bookingId, mechanicId);

              // Assert: Metadata should contain all required fields
              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('booking_id', bookingId);
              expect(metadata).toHaveProperty('mechanic_id', mechanicId);
              expect(metadata).toHaveProperty('mechanic_name', mechanicName);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle missing mechanic name gracefully in audit logs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, mechanicId }) => {
              // Setup: Mock mechanic name fetch fails
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockMechanicSelect = jest.fn().mockReturnThis();
              const mockMechanicEq = jest.fn().mockReturnThis();
              const mockMechanicSingle = jest.fn().mockResolvedValue({
                data: null, // Mechanic not found
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: mockMechanicSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockMechanicSelect.mockReturnValue({
                eq: mockMechanicEq,
              });

              mockMechanicEq.mockReturnValue({
                single: mockMechanicSingle,
              });

              // Act
              await assignMechanic(bookingId, mechanicId);

              // Assert: Should use 'Unknown' as fallback
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.ASSIGN_MECHANIC,
                AUDIT_ENTITIES.ASSIGNMENT,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: mechanicId,
                  mechanic_name: 'Unknown',
                })
              );
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Unassign Mechanic', () => {
      it('should generate audit log for every mechanic unassignment', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
              
              // Setup: Mock authenticated admin user
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              // Mock user role check
              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              // Mock assignment fetch (to get mechanic_id before unassignment)
              const mockAssignmentSelect = jest.fn().mockReturnThis();
              const mockAssignmentEq = jest.fn().mockReturnThis();
              const mockAssignmentSingle = jest.fn().mockResolvedValue({
                data: { mechanic_id: mechanicId },
                error: null,
              });

              // Mock RPC call for unassignment
              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'assignments') {
                  return {
                    select: mockAssignmentSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockAssignmentSelect.mockReturnValue({
                eq: mockAssignmentEq,
              });

              mockAssignmentEq.mockReturnValue({
                single: mockAssignmentSingle,
              });

              // Act: Unassign mechanic
              await unassignMechanic(bookingId);

              // Assert: Audit log should be created
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.UNASSIGN_MECHANIC,
                AUDIT_ENTITIES.ASSIGNMENT,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: mechanicId,
                })
              );

              // Verify audit log was called exactly once
              expect(logAuditActivity).toHaveBeenCalledTimes(1);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include booking and mechanic IDs in unassignment audit logs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
              
              // Setup
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockAssignmentSelect = jest.fn().mockReturnThis();
              const mockAssignmentEq = jest.fn().mockReturnThis();
              const mockAssignmentSingle = jest.fn().mockResolvedValue({
                data: { mechanic_id: mechanicId },
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'assignments') {
                  return {
                    select: mockAssignmentSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockAssignmentSelect.mockReturnValue({
                eq: mockAssignmentEq,
              });

              mockAssignmentEq.mockReturnValue({
                single: mockAssignmentSingle,
              });

              // Act
              await unassignMechanic(bookingId);

              // Assert: Metadata should contain required fields
              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('booking_id', bookingId);
              expect(metadata).toHaveProperty('mechanic_id', mechanicId);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle missing assignment gracefully in audit logs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (bookingId) => {
              // Setup: Mock no existing assignment
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockAssignmentSelect = jest.fn().mockReturnThis();
              const mockAssignmentEq = jest.fn().mockReturnThis();
              const mockAssignmentSingle = jest.fn().mockResolvedValue({
                data: null, // No assignment found
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'assignments') {
                  return {
                    select: mockAssignmentSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockAssignmentSelect.mockReturnValue({
                eq: mockAssignmentEq,
              });

              mockAssignmentEq.mockReturnValue({
                single: mockAssignmentSingle,
              });

              // Act
              await unassignMechanic(bookingId);

              // Assert: Should use 'Unknown' as fallback for mechanic_id
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.UNASSIGN_MECHANIC,
                AUDIT_ENTITIES.ASSIGNMENT,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: 'Unknown',
                })
              );
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Audit failure handling', () => {
      it('should attempt audit logging for assignment operations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
              mechanicName: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, mechanicId, mechanicName }) => {
              // Setup: Mock successful operation
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockMechanicSelect = jest.fn().mockReturnThis();
              const mockMechanicEq = jest.fn().mockReturnThis();
              const mockMechanicSingle = jest.fn().mockResolvedValue({
                data: { name: mechanicName },
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'mechanics') {
                  return {
                    select: mockMechanicSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockMechanicSelect.mockReturnValue({
                eq: mockMechanicEq,
              });

              mockMechanicEq.mockReturnValue({
                single: mockMechanicSingle,
              });

              // Act
              await assignMechanic(bookingId, mechanicId);

              // Assert: Audit logging should be attempted
              expect(logAuditActivity).toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should attempt audit logging for unassignment operations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, mechanicId }) => {
              // Setup
              mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
                error: null,
              });

              const mockUserSelect = jest.fn().mockReturnThis();
              const mockUserEq = jest.fn().mockReturnThis();
              const mockUserSingle = jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              });

              const mockAssignmentSelect = jest.fn().mockReturnThis();
              const mockAssignmentEq = jest.fn().mockReturnThis();
              const mockAssignmentSingle = jest.fn().mockResolvedValue({
                data: { mechanic_id: mechanicId },
                error: null,
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                  return {
                    select: mockUserSelect,
                  };
                } else if (table === 'assignments') {
                  return {
                    select: mockAssignmentSelect,
                  };
                }
                return {};
              });

              mockUserSelect.mockReturnValue({
                eq: mockUserEq,
              });

              mockUserEq.mockReturnValue({
                single: mockUserSingle,
              });

              mockAssignmentSelect.mockReturnValue({
                eq: mockAssignmentEq,
              });

              mockAssignmentEq.mockReturnValue({
                single: mockAssignmentSingle,
              });

              // Act
              await unassignMechanic(bookingId);

              // Assert: Audit logging should be attempted
              expect(logAuditActivity).toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
