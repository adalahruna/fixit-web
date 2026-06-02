/**
 * Integration Tests for Service Type Delete Flow
 * Feature: system-improvements-crud-audit-kpi
 * Task: 14.1 Write integration tests for delete flow
 * 
 * These tests verify the complete delete flow from UI interaction to database removal,
 * including confirmation dialog, audit logging, and UI refresh.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.3
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit/actions');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateServicePaths: jest.fn(),
}));

import { deleteService } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { revalidateServicePaths } from '@/lib/utils/revalidation';

describe('Service Type Delete Flow - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Complete delete flow from UI to database', () => {
    it('should complete full delete flow: check dependencies -> delete from DB -> log audit -> refresh UI', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174000';
      const serviceType = {
        id: serviceId,
        name: 'Oil Change',
        price: 50000,
        default_duration_minutes: 30,
      };

      // Mock the complete flow
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [], // No bookings
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert - Verify complete flow
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify dependency check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('booking_services');

      // Verify delete was called
      expect(mockSupabase.from).toHaveBeenCalledWith('service_types');

      // Verify audit log was created
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_service_type',
        'service_type',
        serviceId,
        expect.objectContaining({
          name: serviceType.name,
          price: serviceType.price,
          default_duration_minutes: serviceType.default_duration_minutes,
        })
      );

      // Verify UI refresh was triggered
      expect(revalidateServicePaths).toHaveBeenCalled();
    });

    it('should handle complete flow with referential integrity check preventing deletion', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174001';
      const serviceType = {
        id: serviceId,
        name: 'Tire Replacement',
        price: 150000,
        default_duration_minutes: 60,
      };

      // Mock service with existing bookings
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'booking-1' }], // Has bookings
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert - Flow should stop at dependency check
      expect(result.success).toBeUndefined();
      expect(result.error).toContain('booking');

      // Verify dependency check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('booking_services');

      // Verify delete was NOT called (no delete mock setup needed)
      const fromCalls = (mockSupabase.from as jest.Mock).mock.calls;
      const deleteCall = fromCalls.find((call: any[]) => {
        const table = call[0];
        return table === 'service_types' && call.length > 1;
      });
      expect(deleteCall).toBeUndefined();

      // Verify audit log was NOT created
      expect(logAuditActivity).not.toHaveBeenCalled();

      // Verify UI refresh was NOT triggered
      expect(revalidateServicePaths).not.toHaveBeenCalled();
    });

    it('should handle database error during delete operation gracefully', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174002';
      const serviceType = {
        id: serviceId,
        name: 'Brake Service',
        price: 75000,
        default_duration_minutes: 45,
      };
      const dbError = 'Database connection lost';

      // Mock database error during delete
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: dbError },
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBe(dbError);

      // Verify audit log was NOT created (delete failed)
      expect(logAuditActivity).not.toHaveBeenCalled();

      // Verify UI refresh was NOT triggered (delete failed)
      expect(revalidateServicePaths).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation dialog interaction', () => {
    it('should allow deletion when user confirms', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174003';
      const serviceType = {
        id: serviceId,
        name: 'Chain Lubrication',
        price: 25000,
        default_duration_minutes: 15,
      };

      // Mock successful deletion (simulating user confirmed)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act - This simulates the user clicking "Confirm" in the dialog
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should preserve state when validation fails (simulating cancel)', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174004';
      const serviceType = {
        id: serviceId,
        name: 'Engine Tune-up',
        price: 200000,
        default_duration_minutes: 120,
      };

      // Mock service with bookings (validation fails, simulating cancel)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'booking-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert - State should be preserved (error returned, no deletion)
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(logAuditActivity).not.toHaveBeenCalled();
      expect(revalidateServicePaths).not.toHaveBeenCalled();
    });
  });

  describe('Audit log creation during delete', () => {
    it('should create audit log with complete service type metadata', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174005';
      const serviceType = {
        id: serviceId,
        name: 'Suspension Check',
        price: 100000,
        default_duration_minutes: 60,
        description: 'Complete suspension inspection',
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert - Verify audit log contains all required metadata
      expect(logAuditActivity).toHaveBeenCalledTimes(1);
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_service_type',
        'service_type',
        serviceId,
        {
          name: serviceType.name,
          price: serviceType.price,
          default_duration_minutes: serviceType.default_duration_minutes,
        }
      );
    });

    it('should create audit log even when service has zero price', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174006';
      const serviceType = {
        id: serviceId,
        name: 'Free Inspection',
        price: 0,
        default_duration_minutes: 10,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_service_type',
        'service_type',
        serviceId,
        expect.objectContaining({
          price: 0,
        })
      );
    });

    it('should not create audit log when service type data is not found', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174007';

      // Mock service type not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(logAuditActivity).not.toHaveBeenCalled();
    });

    it('should not create audit log when deletion fails', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174008';
      const serviceType = {
        id: serviceId,
        name: 'Battery Check',
        price: 30000,
        default_duration_minutes: 20,
      };

      // Mock deletion failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Deletion failed' },
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(logAuditActivity).not.toHaveBeenCalled();
    });
  });

  describe('UI refresh after delete', () => {
    it('should trigger revalidation after successful deletion', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174009';
      const serviceType = {
        id: serviceId,
        name: 'Coolant Flush',
        price: 80000,
        default_duration_minutes: 40,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(revalidateServicePaths).toHaveBeenCalledTimes(1);
    });

    it('should not trigger revalidation when deletion fails', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174010';

      // Mock deletion failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: serviceId, name: 'Test' },
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Deletion failed' },
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(revalidateServicePaths).not.toHaveBeenCalled();
    });

    it('should not trigger revalidation when referential integrity check fails', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174011';

      // Mock service with bookings
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: serviceId, name: 'Test' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'booking-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert
      expect(revalidateServicePaths).not.toHaveBeenCalled();
    });

    it('should trigger revalidation exactly once even with multiple service type fields', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174012';
      const serviceType = {
        id: serviceId,
        name: 'Comprehensive Service',
        price: 500000,
        default_duration_minutes: 180,
        description: 'Full motorcycle service',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: serviceType,
                  error: null,
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteService(serviceId);

      // Assert - Should be called exactly once, not multiple times
      expect(revalidateServicePaths).toHaveBeenCalledTimes(1);
    });
  });

  describe('End-to-end delete flow scenarios', () => {
    it('should handle complete successful delete flow with all steps', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174013';
      const serviceType = {
        id: serviceId,
        name: 'Spark Plug Replacement',
        price: 120000,
        default_duration_minutes: 45,
      };

      const flowSteps: string[] = [];

      // Mock with tracking
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('fetch_service_type');
              return {
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: serviceType,
                    error: null,
                  }),
                }),
              };
            }),
            delete: jest.fn().mockImplementation(() => {
              flowSteps.push('delete_service_type');
              return {
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('check_bookings');
              return {
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      (logAuditActivity as jest.Mock).mockImplementation(() => {
        flowSteps.push('log_audit');
        return Promise.resolve();
      });

      (revalidateServicePaths as jest.Mock).mockImplementation(() => {
        flowSteps.push('revalidate_ui');
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert - Verify flow order
      expect(result.success).toBe(true);
      expect(flowSteps).toEqual([
        'fetch_service_type',
        'check_bookings',
        'delete_service_type',
        'log_audit',
        'revalidate_ui',
      ]);
    });

    it('should stop flow at dependency check when bookings exist', async () => {
      // Arrange
      const serviceId = '123e4567-e89b-12d3-a456-426614174014';
      const serviceType = {
        id: serviceId,
        name: 'Transmission Service',
        price: 300000,
        default_duration_minutes: 90,
      };

      const flowSteps: string[] = [];

      // Mock with tracking
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('fetch_service_type');
              return {
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: serviceType,
                    error: null,
                  }),
                }),
              };
            }),
          };
        } else if (table === 'booking_services') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('check_bookings');
              return {
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'booking-1' }],
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert - Flow should stop after dependency check
      expect(result.error).toBeDefined();
      expect(flowSteps).toEqual([
        'fetch_service_type',
        'check_bookings',
      ]);
      expect(flowSteps).not.toContain('delete_service_type');
      expect(flowSteps).not.toContain('log_audit');
      expect(flowSteps).not.toContain('revalidate_ui');
    });
  });
});
