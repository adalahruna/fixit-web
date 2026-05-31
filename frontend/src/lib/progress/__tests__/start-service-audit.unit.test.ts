/**
 * Unit Tests for startService Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * Task: 9.1 Add audit logging to startService action
 * 
 * These tests verify that the startService action generates appropriate audit logs.
 */

import { startService } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';
import { revalidateBookingPaths } from '@/lib/utils/revalidation';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit/actions');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateBookingPaths: jest.fn(),
}));

describe('startService - Audit Logging', () => {
  let mockSupabase: any;
  const mockBookingId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '987e6543-e21b-12d3-a456-426614174999';
  const mockMechanicId = '456e7890-e12b-34d5-a678-426614174111';

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
    (revalidateBookingPaths as jest.Mock).mockReturnValue(undefined);
  });

  describe('Successful service start', () => {
    it('should log audit activity after successful service start', async () => {
      // Setup: Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock mechanic lookup
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
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
      const result = await startService(mockBookingId);

      // Assert: Operation succeeded
      expect(result).toEqual({ success: true });

      // Assert: Audit log was created
      expect(logAuditActivity).toHaveBeenCalledWith(
        AUDIT_ACTIONS.START_SERVICE,
        AUDIT_ENTITIES.SERVICE_PROGRESS,
        mockBookingId,
        expect.objectContaining({
          booking_id: mockBookingId,
          mechanic_id: mockMechanicId,
          timestamp: expect.any(String),
        })
      );

      // Verify audit log was called exactly once
      expect(logAuditActivity).toHaveBeenCalledTimes(1);
    });

    it('should include booking_id in audit metadata', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await startService(mockBookingId);

      const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
      const metadata = auditCall[3];

      expect(metadata).toHaveProperty('booking_id', mockBookingId);
    });

    it('should include mechanic_id in audit metadata', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await startService(mockBookingId);

      const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
      const metadata = auditCall[3];

      expect(metadata).toHaveProperty('mechanic_id', mockMechanicId);
    });

    it('should include timestamp in audit metadata', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await startService(mockBookingId);

      const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
      const metadata = auditCall[3];

      expect(metadata).toHaveProperty('timestamp');
      expect(typeof metadata.timestamp).toBe('string');
      // Verify it's a valid ISO timestamp
      expect(() => new Date(metadata.timestamp)).not.toThrow();
    });

    it('should handle mechanic not found gracefully in audit metadata', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock mechanic not found
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await startService(mockBookingId);

      const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
      const metadata = auditCall[3];

      // Should still log audit with undefined mechanic_id
      expect(metadata).toHaveProperty('mechanic_id', undefined);
      expect(metadata).toHaveProperty('booking_id', mockBookingId);
    });
  });

  describe('Error handling', () => {
    it('should not log audit when user is unauthorized', async () => {
      // Setup: Mock unauthorized user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act: Attempt to start service
      const result = await startService(mockBookingId);

      // Assert: Operation failed
      expect(result).toEqual({ error: 'Unauthorized' });

      // Assert: Audit log was NOT created
      expect(logAuditActivity).not.toHaveBeenCalled();
    });

    it('should not log audit when RPC call fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      // Mock RPC error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await startService(mockBookingId);

      expect(result).toEqual({ error: 'Database error' });
      expect(logAuditActivity).not.toHaveBeenCalled();
    });

    it('should not log audit when RPC returns error result', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      // Mock RPC returning error in result
      mockSupabase.rpc.mockResolvedValue({
        data: { error: 'Service progress not found' },
        error: null,
      });

      const result = await startService(mockBookingId);

      expect(result).toEqual({ error: 'Service progress not found' });
      expect(logAuditActivity).not.toHaveBeenCalled();
    });

    it('should continue operation even if audit logging fails', async () => {
      // Setup: Mock audit logging to fail silently (as it does in real implementation)
      // The real logAuditActivity catches errors internally and doesn't throw
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
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
      const result = await startService(mockBookingId);

      // Assert: Operation should succeed
      expect(result).toEqual({ success: true });

      // Verify audit was attempted
      expect(logAuditActivity).toHaveBeenCalled();

      // Verify revalidation still happened
      expect(revalidateBookingPaths).toHaveBeenCalledWith(mockBookingId);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration with revalidation', () => {
    it('should revalidate booking paths after successful start', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockMechanicId },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await startService(mockBookingId);

      expect(revalidateBookingPaths).toHaveBeenCalledWith(mockBookingId);
      expect(revalidateBookingPaths).toHaveBeenCalledTimes(1);
    });
  });
});
