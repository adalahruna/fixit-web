/**
 * Integration Tests for Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * Task: 14.2 Write integration tests for audit logging
 * 
 * These tests verify that:
 * 1. Audit logs are created for all operations (service types, mechanics, bookings, assignments, service progress)
 * 2. Audit logs can be viewed in the admin interface
 * 3. Audit log filtering works correctly (by entity type, action type, actor, date range)
 */

import { createClient } from '@/lib/supabase/server';
import { logAuditActivity, getAuditLogs } from '../actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../constants';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/utils', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 'test-user-id', role: 'admin' }),
}));

describe('Audit Logging Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  // Helper function to mock getAuditLogs table check
  const mockTableCheck = () => {
    const mockTestSelect = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 'test' }],
        error: null,
      }),
    });
    return mockTestSelect;
  };

  // Helper to setup audit logs query with table check
  const setupAuditLogsQuery = (mockAuditLogs: any[], totalCount: number) => {
    const mockTestSelect = mockTableCheck();
    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: mockAuditLogs,
      error: null,
      count: totalCount,
    });

    const mockUsersSelect = jest.fn().mockReturnThis();
    const mockIn = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        callCount++;
        if (callCount === 1) {
          return { select: mockTestSelect };
        } else {
          return { select: mockSelect };
        }
      } else if (table === 'users') {
        return { select: mockUsersSelect };
      }
      return {};
    });

    // Create a chainable mock that always returns itself with all methods
    const chainableMock = {
      order: mockOrder,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      range: mockRange,
    };

    mockSelect.mockReturnValue(chainableMock);
    mockOrder.mockReturnValue(chainableMock);
    mockEq.mockReturnValue(chainableMock);
    mockGte.mockReturnValue(chainableMock);
    mockLte.mockReturnValue(chainableMock);

    mockUsersSelect.mockReturnValue({
      in: mockIn,
    });

    return { mockEq, mockGte, mockLte, mockOrder, mockRange };
  };

  /**
   * Test Suite 1: Audit logs created for all operations
   * Validates: Requirements 3.1-3.3, 4.1-4.3, 5.1-5.2, 6.1-6.3, 7.1-7.3
   */
  describe('Audit logs created for all operations', () => {
    
    describe('Service Type Operations', () => {
      it('should create audit log for service type creation', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const serviceTypeId = 'service-type-123';
        const metadata = {
          name: 'Oil Change',
          price: 50000,
          default_duration_minutes: 30,
        };

        await logAuditActivity(
          AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
          AUDIT_ENTITIES.SERVICE_TYPE,
          serviceTypeId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            actor_id: 'test-user-id',
            action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
            entity: AUDIT_ENTITIES.SERVICE_TYPE,
            entity_id: serviceTypeId,
            metadata,
          })
        );
      });

      it('should create audit log for service type update', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const serviceTypeId = 'service-type-123';
        const metadata = {
          name: 'Oil Change Premium',
          price: 75000,
          default_duration_minutes: 45,
        };

        await logAuditActivity(
          AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
          AUDIT_ENTITIES.SERVICE_TYPE,
          serviceTypeId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
            entity: AUDIT_ENTITIES.SERVICE_TYPE,
            entity_id: serviceTypeId,
            metadata,
          })
        );
      });

      it('should create audit log for service type deletion', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const serviceTypeId = 'service-type-123';
        const metadata = {
          name: 'Oil Change',
          price: 50000,
          default_duration_minutes: 30,
        };

        await logAuditActivity(
          AUDIT_ACTIONS.DELETE_SERVICE_TYPE,
          AUDIT_ENTITIES.SERVICE_TYPE,
          serviceTypeId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.DELETE_SERVICE_TYPE,
            entity: AUDIT_ENTITIES.SERVICE_TYPE,
            entity_id: serviceTypeId,
            metadata,
          })
        );
      });
    });

    describe('Mechanic Operations', () => {
      it('should create audit log for mechanic creation', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const mechanicId = 'mechanic-123';
        const metadata = {
          name: 'Ahmad',
          is_active: true,
          daily_capacity_minutes: 480,
          user_id: 'user-123',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.CREATE_MECHANIC,
          AUDIT_ENTITIES.MECHANIC,
          mechanicId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.CREATE_MECHANIC,
            entity: AUDIT_ENTITIES.MECHANIC,
            entity_id: mechanicId,
            metadata,
          })
        );
      });

      it('should create audit log for mechanic update', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const mechanicId = 'mechanic-123';
        const metadata = {
          name: 'Ahmad Updated',
          is_active: false,
          daily_capacity_minutes: 360,
        };

        await logAuditActivity(
          AUDIT_ACTIONS.UPDATE_MECHANIC,
          AUDIT_ENTITIES.MECHANIC,
          mechanicId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.UPDATE_MECHANIC,
            entity: AUDIT_ENTITIES.MECHANIC,
            entity_id: mechanicId,
            metadata,
          })
        );
      });

      it('should create audit log for mechanic deletion', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const mechanicId = 'mechanic-123';
        const metadata = {
          name: 'Ahmad',
          is_active: true,
          daily_capacity_minutes: 480,
          user_id: 'user-123',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.DELETE_MECHANIC,
          AUDIT_ENTITIES.MECHANIC,
          mechanicId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.DELETE_MECHANIC,
            entity: AUDIT_ENTITIES.MECHANIC,
            entity_id: mechanicId,
            metadata,
          })
        );
      });
    });

    describe('Booking Operations', () => {
      it('should create audit log for booking reschedule', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const bookingId = 'booking-123';
        const metadata = {
          original_schedule_start: '2024-01-15T09:00:00Z',
          original_schedule_end: '2024-01-15T10:00:00Z',
          new_schedule_start: '2024-01-16T14:00:00Z',
          new_schedule_end: '2024-01-16T15:00:00Z',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.RESCHEDULE_BOOKING,
          AUDIT_ENTITIES.BOOKING,
          bookingId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.RESCHEDULE_BOOKING,
            entity: AUDIT_ENTITIES.BOOKING,
            entity_id: bookingId,
            metadata,
          })
        );
      });
    });

    describe('Assignment Operations', () => {
      it('should create audit log for mechanic assignment', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const assignmentId = 'assignment-123';
        const metadata = {
          booking_id: 'booking-123',
          mechanic_id: 'mechanic-123',
          mechanic_name: 'Ahmad',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.ASSIGN_MECHANIC,
          AUDIT_ENTITIES.ASSIGNMENT,
          assignmentId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.ASSIGN_MECHANIC,
            entity: AUDIT_ENTITIES.ASSIGNMENT,
            entity_id: assignmentId,
            metadata,
          })
        );
      });

      it('should create audit log for mechanic unassignment', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const assignmentId = 'assignment-123';
        const metadata = {
          booking_id: 'booking-123',
          mechanic_id: 'mechanic-123',
          mechanic_name: 'Ahmad',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.UNASSIGN_MECHANIC,
          AUDIT_ENTITIES.ASSIGNMENT,
          assignmentId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.UNASSIGN_MECHANIC,
            entity: AUDIT_ENTITIES.ASSIGNMENT,
            entity_id: assignmentId,
            metadata,
          })
        );
      });
    });

    describe('Service Progress Operations', () => {
      it('should create audit log for service start', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const progressId = 'progress-123';
        const metadata = {
          booking_id: 'booking-123',
          mechanic_id: 'mechanic-123',
          status: 'in_progress',
          timestamp: '2024-01-15T09:00:00Z',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.START_SERVICE,
          AUDIT_ENTITIES.SERVICE_PROGRESS,
          progressId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.START_SERVICE,
            entity: AUDIT_ENTITIES.SERVICE_PROGRESS,
            entity_id: progressId,
            metadata,
          })
        );
      });

      it('should create audit log for service completion', async () => {
        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: mockInsert,
        });

        const progressId = 'progress-123';
        const metadata = {
          booking_id: 'booking-123',
          mechanic_id: 'mechanic-123',
          status: 'done',
          timestamp: '2024-01-15T10:00:00Z',
        };

        await logAuditActivity(
          AUDIT_ACTIONS.COMPLETE_SERVICE,
          AUDIT_ENTITIES.SERVICE_PROGRESS,
          progressId,
          metadata
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AUDIT_ACTIONS.COMPLETE_SERVICE,
            entity: AUDIT_ENTITIES.SERVICE_PROGRESS,
            entity_id: progressId,
            metadata,
          })
        );
      });
    });
  });

  /**
   * Test Suite 2: Audit logs can be viewed in admin interface
   * Validates: Requirements 10.3
   */
  describe('Audit logs can be viewed in admin interface', () => {
    it('should retrieve audit logs with pagination', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: AUDIT_ACTIONS.CREATE_BOOKING,
          entity: AUDIT_ENTITIES.BOOKING,
          entity_id: 'booking-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: { vehicle_plate: 'B1234XYZ' },
        },
        {
          id: 'log-2',
          actor_id: 'user-2',
          action: AUDIT_ACTIONS.ASSIGN_MECHANIC,
          entity: AUDIT_ENTITIES.ASSIGNMENT,
          entity_id: 'assignment-1',
          timestamp_log: '2024-01-15T09:30:00Z',
          metadata: { mechanic_name: 'Ahmad' },
        },
      ];

      const mockUsers = [
        { id: 'user-1', name: 'Customer 1', email: 'customer@test.com', role: 'customer' },
        { id: 'user-2', name: 'Admin 1', email: 'admin@test.com', role: 'admin' },
      ];

      // Mock initial table check
      const mockTestSelect = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: [{ id: 'test' }],
        error: null,
      });

      // Mock audit logs query
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAuditLogs,
        error: null,
        count: 2,
      });

      // Mock users query
      const mockUsersSelect = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'audit_logs') {
          callCount++;
          if (callCount === 1) {
            // First call is the table check
            return {
              select: mockTestSelect,
            };
          } else {
            // Second call is the actual query
            return {
              select: mockSelect,
            };
          }
        } else if (table === 'users') {
          return {
            select: mockUsersSelect,
          };
        }
        return {};
      });

      mockTestSelect.mockReturnValue({
        limit: mockLimit,
      });

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      mockUsersSelect.mockReturnValue({
        in: mockIn,
      });

      const result = await getAuditLogs(1, 50);

      expect(result.logs).toHaveLength(2);
      expect(result.logs[0]).toHaveProperty('actor');
      expect(result.logs[0].actor).toEqual(mockUsers[0]);
      expect(result.logs[1].actor).toEqual(mockUsers[1]);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
    });

    it('should display complete audit log information', async () => {
      const mockAuditLog = {
        id: 'log-1',
        actor_id: 'user-1',
        action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
        entity: AUDIT_ENTITIES.SERVICE_TYPE,
        entity_id: 'service-1',
        timestamp_log: '2024-01-15T09:00:00Z',
        metadata: {
          name: 'Oil Change',
          price: 50000,
          default_duration_minutes: 30,
        },
      };

      const mockUser = {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
      };

      // Mock initial table check
      const mockTestSelect = mockTableCheck();

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [mockAuditLog],
        error: null,
        count: 1,
      });

      const mockUsersSelect = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({
        data: [mockUser],
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'audit_logs') {
          callCount++;
          if (callCount === 1) {
            return {
              select: mockTestSelect,
            };
          } else {
            return {
              select: mockSelect,
            };
          }
        } else if (table === 'users') {
          return {
            select: mockUsersSelect,
          };
        }
        return {};
      });

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        range: mockRange,
      });

      mockUsersSelect.mockReturnValue({
        in: mockIn,
      });

      const result = await getAuditLogs(1, 50);

      expect(result.logs).toHaveLength(1);
      const log = result.logs[0];
      
      // Verify all required fields are present
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('actor_id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('entity');
      expect(log).toHaveProperty('entity_id');
      expect(log).toHaveProperty('timestamp_log');
      expect(log).toHaveProperty('metadata');
      expect(log).toHaveProperty('actor');
      
      // Verify actor information
      expect(log.actor).toEqual(mockUser);
    });
  });

  /**
   * Test Suite 3: Audit log filtering works correctly
   * Validates: Requirements 10.4
   */
  describe('Audit log filtering works correctly', () => {
    
    it('should filter audit logs by entity type', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: AUDIT_ACTIONS.CREATE_BOOKING,
          entity: AUDIT_ENTITIES.BOOKING,
          entity_id: 'booking-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: {},
        },
      ];

      const { mockEq } = setupAuditLogsQuery(mockAuditLogs, 1);

      const result = await getAuditLogs(1, 50, { entity: AUDIT_ENTITIES.BOOKING });

      expect(mockEq).toHaveBeenCalledWith('entity', AUDIT_ENTITIES.BOOKING);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].entity).toBe(AUDIT_ENTITIES.BOOKING);
    });

    it('should filter audit logs by action type', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
          entity: AUDIT_ENTITIES.SERVICE_TYPE,
          entity_id: 'service-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: {},
        },
      ];

      const { mockEq } = setupAuditLogsQuery(mockAuditLogs, 1);

      const result = await getAuditLogs(1, 50, { action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE });

      expect(mockEq).toHaveBeenCalledWith('action', AUDIT_ACTIONS.CREATE_SERVICE_TYPE);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe(AUDIT_ACTIONS.CREATE_SERVICE_TYPE);
    });

    it('should filter audit logs by actor', async () => {
      const actorId = 'user-123';
      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: actorId,
          action: AUDIT_ACTIONS.CREATE_BOOKING,
          entity: AUDIT_ENTITIES.BOOKING,
          entity_id: 'booking-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: {},
        },
      ];

      const { mockEq } = setupAuditLogsQuery(mockAuditLogs, 1);

      const result = await getAuditLogs(1, 50, { actor_id: actorId });

      expect(mockEq).toHaveBeenCalledWith('actor_id', actorId);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].actor_id).toBe(actorId);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-15T23:59:59Z';
      
      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: AUDIT_ACTIONS.CREATE_BOOKING,
          entity: AUDIT_ENTITIES.BOOKING,
          entity_id: 'booking-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: {},
        },
      ];

      const { mockGte, mockLte } = setupAuditLogsQuery(mockAuditLogs, 1);

      const result = await getAuditLogs(1, 50, { 
        start_date: startDate, 
        end_date: endDate 
      });

      expect(mockGte).toHaveBeenCalledWith('timestamp_log', startDate);
      expect(mockLte).toHaveBeenCalledWith('timestamp_log', endDate);
      expect(result.logs).toHaveLength(1);
    });

    it('should filter audit logs by multiple criteria', async () => {
      const filters = {
        entity: AUDIT_ENTITIES.SERVICE_TYPE,
        action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2024-01-15T23:59:59Z',
      };

      const mockAuditLogs = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
          entity: AUDIT_ENTITIES.SERVICE_TYPE,
          entity_id: 'service-1',
          timestamp_log: '2024-01-15T09:00:00Z',
          metadata: {},
        },
      ];

      const { mockEq, mockGte, mockLte } = setupAuditLogsQuery(mockAuditLogs, 1);

      const result = await getAuditLogs(1, 50, filters);

      expect(mockEq).toHaveBeenCalledWith('entity', filters.entity);
      expect(mockEq).toHaveBeenCalledWith('action', filters.action);
      expect(mockGte).toHaveBeenCalledWith('timestamp_log', filters.start_date);
      expect(mockLte).toHaveBeenCalledWith('timestamp_log', filters.end_date);
      expect(result.logs).toHaveLength(1);
    });
  });

  /**
   * Test Suite 4: Error handling and edge cases
   */
  describe('Error handling and edge cases', () => {
    it('should handle empty audit logs gracefully', async () => {
      setupAuditLogsQuery([], 0);

      const result = await getAuditLogs(1, 50);

      expect(result.logs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle audit table not accessible', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Table does not exist' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getAuditLogs(1, 50);

      expect(result.logs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle audit logging failure silently', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      // Should not throw error
      await expect(
        logAuditActivity(
          AUDIT_ACTIONS.CREATE_BOOKING,
          AUDIT_ENTITIES.BOOKING,
          'booking-123',
          { test: 'data' }
        )
      ).resolves.not.toThrow();
    });

    it('should handle missing actor information', async () => {
      const mockAuditLog = {
        id: 'log-1',
        actor_id: null, // No actor
        action: AUDIT_ACTIONS.CREATE_BOOKING,
        entity: AUDIT_ENTITIES.BOOKING,
        entity_id: 'booking-1',
        timestamp_log: '2024-01-15T09:00:00Z',
        metadata: {},
      };

      setupAuditLogsQuery([mockAuditLog], 1);

      const result = await getAuditLogs(1, 50);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].actor).toBeNull();
    });

    it('should handle pagination correctly', async () => {
      const mockAuditLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i + 1}`,
        actor_id: 'user-1',
        action: AUDIT_ACTIONS.CREATE_BOOKING,
        entity: AUDIT_ENTITIES.BOOKING,
        entity_id: `booking-${i + 1}`,
        timestamp_log: '2024-01-15T09:00:00Z',
        metadata: {},
      }));

      const { mockRange } = setupAuditLogsQuery(mockAuditLogs, 150);

      const result = await getAuditLogs(2, 50); // Page 2

      expect(mockRange).toHaveBeenCalledWith(50, 99); // Offset 50, limit 50
      expect(result.logs).toHaveLength(50);
      expect(result.totalCount).toBe(150);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3); // 150 / 50 = 3 pages
    });
  });

  /**
   * Test Suite 5: Complete workflow integration
   */
  describe('Complete workflow integration', () => {
    it('should track complete CRUD lifecycle with audit logs', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const serviceTypeId = 'service-type-123';

      // Create
      await logAuditActivity(
        AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
        AUDIT_ENTITIES.SERVICE_TYPE,
        serviceTypeId,
        { name: 'Oil Change', price: 50000 }
      );

      // Update
      await logAuditActivity(
        AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
        AUDIT_ENTITIES.SERVICE_TYPE,
        serviceTypeId,
        { name: 'Oil Change Premium', price: 75000 }
      );

      // Delete
      await logAuditActivity(
        AUDIT_ACTIONS.DELETE_SERVICE_TYPE,
        AUDIT_ENTITIES.SERVICE_TYPE,
        serviceTypeId,
        { name: 'Oil Change Premium', price: 75000 }
      );

      // Verify all three operations were logged
      expect(mockInsert).toHaveBeenCalledTimes(3);
      
      // Verify each call had correct action
      expect(mockInsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
      }));
      expect(mockInsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
        action: AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
      }));
      expect(mockInsert).toHaveBeenNthCalledWith(3, expect.objectContaining({
        action: AUDIT_ACTIONS.DELETE_SERVICE_TYPE,
      }));
    });

    it('should track complete booking workflow with audit logs', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const bookingId = 'booking-123';
      const assignmentId = 'assignment-123';
      const progressId = 'progress-123';

      // 1. Create booking
      await logAuditActivity(
        AUDIT_ACTIONS.CREATE_BOOKING,
        AUDIT_ENTITIES.BOOKING,
        bookingId,
        { vehicle_plate: 'B1234XYZ' }
      );

      // 2. Assign mechanic
      await logAuditActivity(
        AUDIT_ACTIONS.ASSIGN_MECHANIC,
        AUDIT_ENTITIES.ASSIGNMENT,
        assignmentId,
        { booking_id: bookingId, mechanic_id: 'mechanic-123' }
      );

      // 3. Start service
      await logAuditActivity(
        AUDIT_ACTIONS.START_SERVICE,
        AUDIT_ENTITIES.SERVICE_PROGRESS,
        progressId,
        { booking_id: bookingId, status: 'in_progress' }
      );

      // 4. Complete service
      await logAuditActivity(
        AUDIT_ACTIONS.COMPLETE_SERVICE,
        AUDIT_ENTITIES.SERVICE_PROGRESS,
        progressId,
        { booking_id: bookingId, status: 'done' }
      );

      // Verify all four operations were logged
      expect(mockInsert).toHaveBeenCalledTimes(4);
      
      // Verify workflow sequence
      expect(mockInsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE_BOOKING,
        entity: AUDIT_ENTITIES.BOOKING,
      }));
      expect(mockInsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
        action: AUDIT_ACTIONS.ASSIGN_MECHANIC,
        entity: AUDIT_ENTITIES.ASSIGNMENT,
      }));
      expect(mockInsert).toHaveBeenNthCalledWith(3, expect.objectContaining({
        action: AUDIT_ACTIONS.START_SERVICE,
        entity: AUDIT_ENTITIES.SERVICE_PROGRESS,
      }));
      expect(mockInsert).toHaveBeenNthCalledWith(4, expect.objectContaining({
        action: AUDIT_ACTIONS.COMPLETE_SERVICE,
        entity: AUDIT_ENTITIES.SERVICE_PROGRESS,
      }));
    });
  });
});
