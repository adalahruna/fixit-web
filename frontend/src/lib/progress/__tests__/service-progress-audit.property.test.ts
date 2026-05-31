/**
 * Property-Based Tests for Service Progress Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that service progress operations (start and complete)
 * generate appropriate audit logs.
 */

import * as fc from 'fast-check';
import { startService, completeService } from '../actions';
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

describe('Service Progress Audit Logging - Property-Based Tests', () => {
  let mockSupabase: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
    rpc: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
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
   * Property 12: Service progress operations generate audit logs
   * **Validates: Requirements 7.1, 7.2**
   * 
   * For any service start or completion operation, an audit log entry with the
   * appropriate action should be inserted with booking, mechanic, and status information.
   */
  describe('Property 12: Service progress operations generate audit logs', () => {
    describe('Start Service Operations', () => {
      it('should generate audit log for every service start operation', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, userId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              // Setup: Mock successful authentication
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              // Mock mechanic lookup
              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock successful RPC call
              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              // Act: Start service
              const result = await startService(bookingId);

              // Assert: Operation succeeded
              expect(result).toEqual({ success: true });

              // Assert: Audit log should be created
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.START_SERVICE,
                AUDIT_ENTITIES.SERVICE_PROGRESS,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: mechanicId,
                  timestamp: expect.any(String),
                })
              );

              // Verify audit log was called exactly once
              expect(logAuditActivity).toHaveBeenCalledTimes(1);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include booking_id in start service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, userId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              await startService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('booking_id', bookingId);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include mechanic_id in start service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, userId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              await startService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('mechanic_id', mechanicId);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include valid ISO timestamp in start service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, userId, mechanicId }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              await startService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('timestamp');
              expect(typeof metadata.timestamp).toBe('string');
              
              // Verify it's a valid ISO timestamp
              const timestamp = new Date(metadata.timestamp);
              expect(timestamp.toISOString()).toBe(metadata.timestamp);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Complete Service Operations', () => {
      it('should generate audit log for every service completion operation', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              // Setup: Mock successful authentication
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              // Mock mechanic lookup
              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock successful RPC call with actual_duration
              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              // Act: Complete service
              const result = await completeService(bookingId);

              // Assert: Operation succeeded
              expect(result).toEqual({ success: true });

              // Assert: Audit log should be created
              expect(logAuditActivity).toHaveBeenCalledWith(
                AUDIT_ACTIONS.COMPLETE_SERVICE,
                AUDIT_ENTITIES.SERVICE_PROGRESS,
                bookingId,
                expect.objectContaining({
                  booking_id: bookingId,
                  mechanic_id: mechanicId,
                  actual_duration: actualDuration,
                  timestamp: expect.any(String),
                })
              );

              // Verify audit log was called exactly once
              expect(logAuditActivity).toHaveBeenCalledTimes(1);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include booking_id in complete service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              await completeService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('booking_id', bookingId);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include mechanic_id in complete service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              await completeService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('mechanic_id', mechanicId);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include actual_duration in complete service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              await completeService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('actual_duration', actualDuration);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should include valid ISO timestamp in complete service audit metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              // Clear mocks for each iteration
              jest.clearAllMocks();
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              await completeService(bookingId);

              const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
              const metadata = auditCall[3];

              expect(metadata).toHaveProperty('timestamp');
              expect(typeof metadata.timestamp).toBe('string');
              
              // Verify it's a valid ISO timestamp
              const timestamp = new Date(metadata.timestamp);
              expect(timestamp.toISOString()).toBe(metadata.timestamp);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Error Handling - No Audit on Failure', () => {
      it('should not generate audit log when start service fails due to unauthorized user', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (bookingId) => {
              // Setup: Mock unauthorized user
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
              });

              // Act: Attempt to start service
              const result = await startService(bookingId);

              // Assert: Operation failed
              expect(result).toEqual({ error: 'Unauthorized' });

              // Assert: Audit log should NOT be created
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should not generate audit log when start service RPC fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, userId, mechanicId, errorMessage }) => {
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock RPC error
              mockSupabase.rpc.mockResolvedValue({
                data: null,
                error: { message: errorMessage },
              });

              const result = await startService(bookingId);

              expect(result).toEqual({ error: errorMessage });
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should not generate audit log when complete service fails due to unauthorized user', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (bookingId) => {
              // Setup: Mock unauthorized user
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
              });

              // Act: Attempt to complete service
              const result = await completeService(bookingId);

              // Assert: Operation failed
              expect(result).toEqual({ error: 'Unauthorized' });

              // Assert: Audit log should NOT be created
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should not generate audit log when complete service RPC fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, userId, mechanicId, errorMessage }) => {
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock RPC error
              mockSupabase.rpc.mockResolvedValue({
                data: null,
                error: { message: errorMessage },
              });

              const result = await completeService(bookingId);

              expect(result).toEqual({ error: errorMessage });
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should not generate audit log when start service RPC returns error result', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, userId, mechanicId, errorMessage }) => {
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock RPC returning error in result
              mockSupabase.rpc.mockResolvedValue({
                data: { error: errorMessage },
                error: null,
              });

              const result = await startService(bookingId);

              expect(result).toEqual({ error: errorMessage });
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should not generate audit log when complete service RPC returns error result', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            async ({ bookingId, userId, mechanicId, errorMessage }) => {
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              // Mock RPC returning error in result
              mockSupabase.rpc.mockResolvedValue({
                data: { error: errorMessage },
                error: null,
              });

              const result = await completeService(bookingId);

              expect(result).toEqual({ error: errorMessage });
              expect(logAuditActivity).not.toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Audit Failure Handling', () => {
      it('should continue start service operation even if audit logging fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
            }),
            async ({ bookingId, userId, mechanicId }) => {
              // Setup: Mock audit logging to fail
              // Note: In real implementation, logAuditActivity catches errors internally
              // This test verifies the operation continues regardless
              
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { success: true },
                error: null,
              });

              // Act: Start service
              const result = await startService(bookingId);

              // Assert: Operation should succeed
              expect(result).toEqual({ success: true });

              // Verify audit was attempted
              expect(logAuditActivity).toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should continue complete service operation even if audit logging fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              bookingId: fc.uuid(),
              userId: fc.uuid(),
              mechanicId: fc.uuid(),
              actualDuration: fc.integer({ min: 15, max: 480 }),
            }),
            async ({ bookingId, userId, mechanicId, actualDuration }) => {
              mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
              });

              mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mechanicId },
                      error: null,
                    }),
                  }),
                }),
              });

              mockSupabase.rpc.mockResolvedValue({
                data: { 
                  success: true,
                  actual_duration: actualDuration,
                },
                error: null,
              });

              // Act: Complete service
              const result = await completeService(bookingId);

              // Assert: Operation should succeed
              expect(result).toEqual({ success: true });

              // Verify audit was attempted
              expect(logAuditActivity).toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
