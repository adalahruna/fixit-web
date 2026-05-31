/**
 * Property-Based Tests for Audit Log Completeness
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that all audit log entries created by the system contain
 * the required fields: actor_id, action, entity, entity_id, timestamp_log, and
 * relevant metadata fields.
 */

import * as fc from 'fast-check';
import { logAuditActivity, getAuditLogs } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/utils';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../constants';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/utils');

describe('Audit Log Completeness - Property-Based Tests', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user
    mockUser = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      role: 'admin',
    };
    
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Property 13: Audit logs contain required fields
   * **Validates: Requirements 3.4, 4.4, 5.2, 6.3, 7.3**
   * 
   * For any audit log entry created by the system, it should contain:
   * - actor_id (who performed the action)
   * - action (what action was performed)
   * - entity (what type of entity was affected)
   * - entity_id (which specific entity was affected)
   * - timestamp_log (when the action occurred)
   * - metadata (relevant additional information)
   */
  describe('Property 13: Audit logs contain required fields', () => {
    /**
     * Test that all audit log entries have the core required fields
     */
    it('should contain all required core fields for any audit log entry', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(
              ...Object.values(AUDIT_ACTIONS)
            ),
            entity: fc.constantFrom(
              ...Object.values(AUDIT_ENTITIES)
            ),
            entityId: fc.option(fc.uuid(), { nil: undefined }),
            metadata: fc.option(
              fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.oneof(
                  fc.string({ maxLength: 200 }),
                  fc.integer(),
                  fc.float({ noNaN: true }),
                  fc.boolean()
                )
              ),
              { nil: undefined }
            ),
          }),
          async ({ action, entity, entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            // Track what was inserted
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log audit activity
            await logAuditActivity(action, entity, entityId, metadata);

            // Assert: Insert was called
            expect(mockInsert).toHaveBeenCalledTimes(1);

            // Assert: Inserted data contains all required fields
            expect(insertedData).toBeDefined();
            expect(insertedData).toHaveProperty('actor_id');
            expect(insertedData).toHaveProperty('action');
            expect(insertedData).toHaveProperty('entity');
            expect(insertedData).toHaveProperty('entity_id');
            expect(insertedData).toHaveProperty('metadata');

            // Assert: Field values are correct
            expect(insertedData.actor_id).toBe(mockUser.id);
            expect(insertedData.action).toBe(action);
            expect(insertedData.entity).toBe(entity);
            expect(insertedData.entity_id).toBe(entityId);
            expect(insertedData.metadata).toEqual(metadata || {});
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that service type operations include required metadata
     */
    it('should include service type metadata for service type operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(
              AUDIT_ACTIONS.CREATE_SERVICE_TYPE,
              AUDIT_ACTIONS.UPDATE_SERVICE_TYPE,
              AUDIT_ACTIONS.DELETE_SERVICE_TYPE
            ),
            entityId: fc.uuid(),
            metadata: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              price: fc.float({ min: 0, max: 10000, noNaN: true }),
              default_duration_minutes: fc.integer({ min: 15, max: 480 }),
            }),
          }),
          async ({ action, entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log service type audit activity
            await logAuditActivity(
              action,
              AUDIT_ENTITIES.SERVICE_TYPE,
              entityId,
              metadata
            );

            // Assert: Metadata contains service type fields
            expect(insertedData.metadata).toHaveProperty('name', metadata.name);
            expect(insertedData.metadata).toHaveProperty('price', metadata.price);
            expect(insertedData.metadata).toHaveProperty('default_duration_minutes', metadata.default_duration_minutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that mechanic operations include required metadata
     */
    it('should include mechanic metadata for mechanic operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(
              AUDIT_ACTIONS.CREATE_MECHANIC,
              AUDIT_ACTIONS.UPDATE_MECHANIC,
              AUDIT_ACTIONS.DELETE_MECHANIC
            ),
            entityId: fc.uuid(),
            metadata: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              is_active: fc.boolean(),
              daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
              user_id: fc.option(fc.uuid(), { nil: undefined }),
            }),
          }),
          async ({ action, entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log mechanic audit activity
            await logAuditActivity(
              action,
              AUDIT_ENTITIES.MECHANIC,
              entityId,
              metadata
            );

            // Assert: Metadata contains mechanic fields
            expect(insertedData.metadata).toHaveProperty('name', metadata.name);
            expect(insertedData.metadata).toHaveProperty('is_active', metadata.is_active);
            expect(insertedData.metadata).toHaveProperty('daily_capacity_minutes', metadata.daily_capacity_minutes);
            
            if (metadata.user_id !== undefined) {
              expect(insertedData.metadata).toHaveProperty('user_id', metadata.user_id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booking reschedule operations include schedule metadata
     */
    it('should include schedule metadata for reschedule operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            entityId: fc.uuid(),
            metadata: fc.record({
              original_schedule_start: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              original_schedule_end: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              new_schedule_start: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              new_schedule_end: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
            }),
          }),
          async ({ entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log reschedule audit activity
            await logAuditActivity(
              AUDIT_ACTIONS.RESCHEDULE_BOOKING,
              AUDIT_ENTITIES.BOOKING,
              entityId,
              metadata
            );

            // Assert: Metadata contains schedule fields
            expect(insertedData.metadata).toHaveProperty('original_schedule_start', metadata.original_schedule_start);
            expect(insertedData.metadata).toHaveProperty('original_schedule_end', metadata.original_schedule_end);
            expect(insertedData.metadata).toHaveProperty('new_schedule_start', metadata.new_schedule_start);
            expect(insertedData.metadata).toHaveProperty('new_schedule_end', metadata.new_schedule_end);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that assignment operations include assignment metadata
     */
    it('should include assignment metadata for assignment operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(
              AUDIT_ACTIONS.ASSIGN_MECHANIC,
              AUDIT_ACTIONS.UNASSIGN_MECHANIC
            ),
            entityId: fc.uuid(),
            metadata: fc.record({
              booking_id: fc.uuid(),
              mechanic_id: fc.uuid(),
              mechanic_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            }),
          }),
          async ({ action, entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log assignment audit activity
            await logAuditActivity(
              action,
              AUDIT_ENTITIES.ASSIGNMENT,
              entityId,
              metadata
            );

            // Assert: Metadata contains assignment fields
            expect(insertedData.metadata).toHaveProperty('booking_id', metadata.booking_id);
            expect(insertedData.metadata).toHaveProperty('mechanic_id', metadata.mechanic_id);
            expect(insertedData.metadata).toHaveProperty('mechanic_name', metadata.mechanic_name);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that service progress operations include progress metadata
     */
    it('should include progress metadata for service progress operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(
              AUDIT_ACTIONS.START_SERVICE,
              AUDIT_ACTIONS.COMPLETE_SERVICE
            ),
            entityId: fc.uuid(),
            metadata: fc.record({
              booking_id: fc.uuid(),
              mechanic_id: fc.uuid(),
              status: fc.constantFrom('in_progress', 'done'),
              timestamp: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
            }),
          }),
          async ({ action, entityId, metadata }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log service progress audit activity
            await logAuditActivity(
              action,
              AUDIT_ENTITIES.SERVICE_PROGRESS,
              entityId,
              metadata
            );

            // Assert: Metadata contains service progress fields
            expect(insertedData.metadata).toHaveProperty('booking_id', metadata.booking_id);
            expect(insertedData.metadata).toHaveProperty('mechanic_id', metadata.mechanic_id);
            expect(insertedData.metadata).toHaveProperty('status', metadata.status);
            expect(insertedData.metadata).toHaveProperty('timestamp', metadata.timestamp);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that actor_id is properly set from authenticated user
     */
    it('should set actor_id from authenticated user for all operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            action: fc.constantFrom(...Object.values(AUDIT_ACTIONS)),
            entity: fc.constantFrom(...Object.values(AUDIT_ENTITIES)),
            entityId: fc.uuid(),
          }),
          async ({ userId, action, entity, entityId }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            
            // Mock different user for each iteration
            const testUser = {
              id: userId,
              email: `user-${userId}@example.com`,
              role: 'admin',
            };
            (getUser as jest.Mock).mockResolvedValue(testUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log audit activity
            await logAuditActivity(action, entity, entityId, {});

            // Assert: actor_id matches the authenticated user
            expect(insertedData.actor_id).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that actor_id is null when no user is authenticated
     */
    it('should set actor_id to null when no user is authenticated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(...Object.values(AUDIT_ACTIONS)),
            entity: fc.constantFrom(...Object.values(AUDIT_ENTITIES)),
            entityId: fc.uuid(),
          }),
          async ({ action, entity, entityId }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            
            // Mock no authenticated user
            (getUser as jest.Mock).mockResolvedValue(null);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log audit activity
            await logAuditActivity(action, entity, entityId, {});

            // Assert: actor_id is null
            expect(insertedData.actor_id).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test that timestamp_log is automatically set by database
     * (we verify the field is not explicitly set in the insert, allowing DB default)
     */
    it('should allow database to set timestamp_log automatically', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(...Object.values(AUDIT_ACTIONS)),
            entity: fc.constantFrom(...Object.values(AUDIT_ENTITIES)),
            entityId: fc.uuid(),
          }),
          async ({ action, entity, entityId }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log audit activity
            await logAuditActivity(action, entity, entityId, {});

            // Assert: timestamp_log is not explicitly set (DB will set it)
            // The implementation doesn't set timestamp_log, allowing DB default
            expect(insertedData).not.toHaveProperty('timestamp_log');
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test that metadata defaults to empty object when not provided
     */
    it('should default metadata to empty object when not provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            action: fc.constantFrom(...Object.values(AUDIT_ACTIONS)),
            entity: fc.constantFrom(...Object.values(AUDIT_ENTITIES)),
            entityId: fc.uuid(),
          }),
          async ({ action, entity, entityId }) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            (getUser as jest.Mock).mockResolvedValue(mockUser);
            
            let insertedData: any = null;
            
            const mockInsert = jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                data: { ...data, id: fc.sample(fc.uuid(), 1)[0] },
                error: null,
              };
            });

            mockSupabase.from.mockReturnValue({
              insert: mockInsert,
            });

            // Act: Log audit activity without metadata
            await logAuditActivity(action, entity, entityId);

            // Assert: metadata is an empty object
            expect(insertedData.metadata).toEqual({});
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional test: Verify audit logs can be retrieved with all fields
   */
  describe('Audit log retrieval includes all fields', () => {
    it('should retrieve audit logs with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              actor_id: fc.uuid(),
              action: fc.constantFrom(...Object.values(AUDIT_ACTIONS)),
              entity: fc.constantFrom(...Object.values(AUDIT_ENTITIES)),
              entity_id: fc.uuid(),
              timestamp_log: fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              metadata: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.oneof(
                  fc.string({ maxLength: 200 }),
                  fc.integer(),
                  fc.boolean()
                )
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (auditLogs) => {
            // Clear mocks for this iteration
            jest.clearAllMocks();
            
            // Mock the initial test query (checks if table exists)
            const mockTestSelect = jest.fn().mockReturnThis();
            const mockTestLimit = jest.fn().mockResolvedValue({
              data: [{ id: 'test-id' }],
              error: null,
            });

            // Mock audit logs query
            const mockSelect = jest.fn().mockReturnThis();
            const mockOrder = jest.fn().mockReturnThis();
            const mockRange = jest.fn().mockResolvedValue({
              data: auditLogs,
              error: null,
              count: auditLogs.length,
            });

            // Mock users query for actor information
            const mockUsersSelect = jest.fn().mockReturnThis();
            const mockIn = jest.fn().mockResolvedValue({
              data: auditLogs.map(log => ({
                id: log.actor_id,
                name: `User ${log.actor_id}`,
                email: `user-${log.actor_id}@example.com`,
                role: 'admin',
              })),
              error: null,
            });

            let callCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'audit_logs') {
                callCount++;
                if (callCount === 1) {
                  // First call is the test query
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
              limit: mockTestLimit,
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

            // Act: Get audit logs
            const result = await getAuditLogs(1, 50);

            // Assert: All logs have required fields
            expect(result.logs).toHaveLength(auditLogs.length);
            
            result.logs.forEach((log, index) => {
              expect(log).toHaveProperty('id', auditLogs[index].id);
              expect(log).toHaveProperty('actor_id', auditLogs[index].actor_id);
              expect(log).toHaveProperty('action', auditLogs[index].action);
              expect(log).toHaveProperty('entity', auditLogs[index].entity);
              expect(log).toHaveProperty('entity_id', auditLogs[index].entity_id);
              expect(log).toHaveProperty('timestamp_log', auditLogs[index].timestamp_log);
              expect(log).toHaveProperty('metadata', auditLogs[index].metadata);
              expect(log).toHaveProperty('actor'); // Actor information attached
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
