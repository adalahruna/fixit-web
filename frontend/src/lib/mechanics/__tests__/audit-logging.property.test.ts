/**
 * Property-Based Tests for Mechanic Audit Logging
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that all CRUD operations on mechanics generate appropriate audit logs.
 */

import * as fc from 'fast-check';
import { createMechanic, updateMechanic, deleteMechanic } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/audit/constants';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateMechanicPaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Mechanic Audit Logging - Property-Based Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getSession: jest.fn(),
        signUp: jest.fn(),
        setSession: jest.fn(),
      },
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
  });

  // Helper to reset mocks between property test iterations
  const resetMocks = () => {
    (logAuditActivity as jest.Mock).mockClear();
    (logAuditActivity as jest.Mock).mockResolvedValue(undefined);
  };

  /**
   * Property 7: Create operations generate audit logs
   * **Validates: Requirements 4.1**
   * 
   * For any mechanic creation, an audit log entry with action "create_mechanic"
   * should be inserted into the audit_logs table.
   */
  describe('Property 7: Create operations generate audit logs', () => {
    it('should generate audit log for every mechanic creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 50 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.option(fc.integer({ min: 240, max: 600 }), { nil: null }),
            skill_notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          }),
          async (mechanicData) => {
            // Reset mocks for this iteration
            resetMocks();
            
            // Setup: Mock successful mechanic creation
            const createdUserId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanicId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanic = {
              id: createdMechanicId,
              name: mechanicData.name,
              is_active: mechanicData.is_active,
              daily_capacity_minutes: mechanicData.daily_capacity_minutes,
              skill_notes: mechanicData.skill_notes,
              user_id: createdUserId,
            };

            // Mock auth.getSession (no existing session)
            mockSupabase.auth.getSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            // Mock auth.signUp
            mockSupabase.auth.signUp.mockResolvedValue({
              data: { user: { id: createdUserId } },
              error: null,
            });

            // Mock auth.setSession (no-op since no admin session)
            mockSupabase.auth.setSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            // Mock database operations
            const mockUserInsert = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            const mockMechanicSelect = jest.fn().mockReturnThis();
            const mockMechanicSingle = jest.fn().mockResolvedValue({
              data: createdMechanic,
              error: null,
            });
            const mockMechanicInsert = jest.fn().mockReturnThis();

            // Mock existing user check (no existing user)
            const mockExistingUserSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'users') {
                return {
                  select: mockExistingUserSelect,
                  insert: mockUserInsert,
                };
              } else if (table === 'mechanics') {
                return {
                  insert: mockMechanicInsert,
                };
              }
              return {};
            });

            mockMechanicInsert.mockReturnValue({
              select: mockMechanicSelect,
            });

            mockMechanicSelect.mockReturnValue({
              single: mockMechanicSingle,
            });

            // Create FormData
            const formData = new FormData();
            formData.append('name', mechanicData.name);
            formData.append('email', mechanicData.email);
            formData.append('password', mechanicData.password);
            formData.append('is_active', mechanicData.is_active.toString());
            if (mechanicData.daily_capacity_minutes !== null) {
              formData.append('daily_capacity_minutes', mechanicData.daily_capacity_minutes.toString());
            }
            if (mechanicData.skill_notes !== null) {
              formData.append('skill_notes', mechanicData.skill_notes);
            }

            // Act: Create mechanic
            await createMechanic(null, formData);

            // Assert: Audit log should be created
            expect(logAuditActivity).toHaveBeenCalledWith(
              AUDIT_ACTIONS.CREATE_MECHANIC,
              AUDIT_ENTITIES.MECHANIC,
              createdMechanicId,
              expect.objectContaining({
                name: mechanicData.name,
                is_active: mechanicData.is_active,
                daily_capacity_minutes: mechanicData.daily_capacity_minutes,
                user_id: createdUserId,
              })
            );

            // Verify audit log was called exactly once
            expect(logAuditActivity).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include complete metadata in create audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 50 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
            skill_notes: fc.string({ maxLength: 500 }),
          }),
          async (mechanicData) => {
            // Reset mocks for this iteration
            resetMocks();
            
            const createdUserId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanicId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanic = {
              id: createdMechanicId,
              name: mechanicData.name,
              is_active: mechanicData.is_active,
              daily_capacity_minutes: mechanicData.daily_capacity_minutes,
              skill_notes: mechanicData.skill_notes,
              user_id: createdUserId,
            };

            mockSupabase.auth.getSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            mockSupabase.auth.signUp.mockResolvedValue({
              data: { user: { id: createdUserId } },
              error: null,
            });

            mockSupabase.auth.setSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            const mockUserInsert = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            const mockMechanicSelect = jest.fn().mockReturnThis();
            const mockMechanicSingle = jest.fn().mockResolvedValue({
              data: createdMechanic,
              error: null,
            });
            const mockMechanicInsert = jest.fn().mockReturnThis();

            const mockExistingUserSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'users') {
                return {
                  select: mockExistingUserSelect,
                  insert: mockUserInsert,
                };
              } else if (table === 'mechanics') {
                return {
                  insert: mockMechanicInsert,
                };
              }
              return {};
            });

            mockMechanicInsert.mockReturnValue({
              select: mockMechanicSelect,
            });

            mockMechanicSelect.mockReturnValue({
              single: mockMechanicSingle,
            });

            const formData = new FormData();
            formData.append('name', mechanicData.name);
            formData.append('email', mechanicData.email);
            formData.append('password', mechanicData.password);
            formData.append('is_active', mechanicData.is_active.toString());
            formData.append('daily_capacity_minutes', mechanicData.daily_capacity_minutes.toString());
            formData.append('skill_notes', mechanicData.skill_notes);

            await createMechanic(null, formData);

            // Assert: Metadata should contain all required fields
            const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
            const metadata = auditCall[3];

            expect(metadata).toHaveProperty('name', mechanicData.name);
            expect(metadata).toHaveProperty('is_active', mechanicData.is_active);
            expect(metadata).toHaveProperty('daily_capacity_minutes', mechanicData.daily_capacity_minutes);
            expect(metadata).toHaveProperty('user_id', createdUserId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Update operations generate audit logs
   * **Validates: Requirements 4.2**
   * 
   * For any mechanic update, an audit log entry with action "update_mechanic"
   * should be inserted into the audit_logs table.
   */
  describe('Property 8: Update operations generate audit logs', () => {
    it('should generate audit log for every mechanic update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.option(fc.integer({ min: 240, max: 600 }), { nil: null }),
            skill_notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            user_id: fc.option(fc.uuid(), { nil: null }),
          }),
          async (mechanicData) => {
            // Reset mocks for this iteration
            resetMocks();
            
            // Setup: Mock successful mechanic update
            const mockCurrentMechanicSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    user_id: mechanicData.user_id,
                    name: 'Old Name',
                  },
                  error: null,
                }),
              }),
            });

            const mockUpdate = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            // Mock user update (if user_id exists)
            const mockUserUpdate = jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'mechanics') {
                return {
                  select: mockCurrentMechanicSelect,
                  update: mockUpdate,
                };
              } else if (table === 'users') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                  update: mockUserUpdate,
                };
              }
              return {};
            });

            mockUpdate.mockReturnValue({
              eq: mockEq,
            });

            // Create FormData
            const formData = new FormData();
            formData.append('id', mechanicData.id);
            formData.append('name', mechanicData.name);
            formData.append('is_active', mechanicData.is_active.toString());
            if (mechanicData.daily_capacity_minutes !== null) {
              formData.append('daily_capacity_minutes', mechanicData.daily_capacity_minutes.toString());
            }
            if (mechanicData.skill_notes !== null) {
              formData.append('skill_notes', mechanicData.skill_notes);
            }

            // Act: Update mechanic
            await updateMechanic(null, formData);

            // Assert: Audit log should be created
            expect(logAuditActivity).toHaveBeenCalledWith(
              AUDIT_ACTIONS.UPDATE_MECHANIC,
              AUDIT_ENTITIES.MECHANIC,
              mechanicData.id,
              expect.objectContaining({
                name: mechanicData.name,
                is_active: mechanicData.is_active,
                daily_capacity_minutes: mechanicData.daily_capacity_minutes,
              })
            );

            // Verify audit log was called exactly once
            expect(logAuditActivity).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include updated fields in update audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
            skill_notes: fc.string({ maxLength: 500 }),
          }),
          async (mechanicData) => {
            // Reset mocks for this iteration
            resetMocks();
            
            const mockCurrentMechanicSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    user_id: null,
                    name: 'Old Name',
                  },
                  error: null,
                }),
              }),
            });

            const mockUpdate = jest.fn().mockReturnThis();
            const mockEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'mechanics') {
                return {
                  select: mockCurrentMechanicSelect,
                  update: mockUpdate,
                };
              } else if (table === 'users') {
                return {
                  select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }
              return {};
            });

            mockUpdate.mockReturnValue({
              eq: mockEq,
            });

            const formData = new FormData();
            formData.append('id', mechanicData.id);
            formData.append('name', mechanicData.name);
            formData.append('is_active', mechanicData.is_active.toString());
            formData.append('daily_capacity_minutes', mechanicData.daily_capacity_minutes.toString());
            formData.append('skill_notes', mechanicData.skill_notes);

            await updateMechanic(null, formData);

            // Assert: Metadata should contain updated fields
            const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
            const metadata = auditCall[3];

            expect(metadata).toHaveProperty('name', mechanicData.name);
            expect(metadata).toHaveProperty('is_active', mechanicData.is_active);
            expect(metadata).toHaveProperty('daily_capacity_minutes', mechanicData.daily_capacity_minutes);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Delete operations generate audit logs
   * **Validates: Requirements 4.3**
   * 
   * For any mechanic deletion, an audit log entry with action "delete_mechanic"
   * should be inserted into the audit_logs table.
   */
  describe('Property 9: Delete operations generate audit logs', () => {
    it('should generate audit log for every mechanic deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.option(fc.integer({ min: 240, max: 600 }), { nil: null }),
            user_id: fc.option(fc.uuid(), { nil: null }),
          }),
          async (mechanic) => {
            // Reset mocks for this iteration
            resetMocks();
            
            // Setup: Mock mechanic exists and has no active assignments
            const mockAssignmentsSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [], // No active assignments
                    error: null,
                  }),
                }),
              }),
            });

            const mockMechanicSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
                  error: null,
                }),
              }),
            });

            const mockDelete = jest.fn().mockReturnThis();
            const mockDeleteEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            const mockUserDelete = jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'assignments') {
                return {
                  select: mockAssignmentsSelect,
                };
              } else if (table === 'mechanics') {
                return {
                  select: mockMechanicSelect,
                  delete: mockDelete,
                };
              } else if (table === 'users') {
                return {
                  delete: mockUserDelete,
                };
              }
              return {};
            });

            mockDelete.mockReturnValue({
              eq: mockDeleteEq,
            });

            // Act: Delete mechanic
            await deleteMechanic(mechanic.id);

            // Assert: Audit log should be created
            expect(logAuditActivity).toHaveBeenCalledWith(
              AUDIT_ACTIONS.DELETE_MECHANIC,
              AUDIT_ENTITIES.MECHANIC,
              mechanic.id,
              expect.objectContaining({
                name: mechanic.name,
                is_active: mechanic.is_active,
                daily_capacity_minutes: mechanic.daily_capacity_minutes,
                user_id: mechanic.user_id,
              })
            );

            // Verify audit log was called exactly once
            expect(logAuditActivity).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include deleted mechanic information in delete audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
            user_id: fc.uuid(),
          }),
          async (mechanic) => {
            // Reset mocks for this iteration
            resetMocks();
            
            const mockAssignmentsSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            });

            const mockMechanicSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
                  error: null,
                }),
              }),
            });

            const mockDelete = jest.fn().mockReturnThis();
            const mockDeleteEq = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            const mockUserDelete = jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'assignments') {
                return {
                  select: mockAssignmentsSelect,
                };
              } else if (table === 'mechanics') {
                return {
                  select: mockMechanicSelect,
                  delete: mockDelete,
                };
              } else if (table === 'users') {
                return {
                  delete: mockUserDelete,
                };
              }
              return {};
            });

            mockDelete.mockReturnValue({
              eq: mockDeleteEq,
            });

            await deleteMechanic(mechanic.id);

            // Assert: Metadata should contain deleted mechanic information
            const auditCall = (logAuditActivity as jest.Mock).mock.calls[0];
            const metadata = auditCall[3];

            expect(metadata).toHaveProperty('name', mechanic.name);
            expect(metadata).toHaveProperty('is_active', mechanic.is_active);
            expect(metadata).toHaveProperty('daily_capacity_minutes', mechanic.daily_capacity_minutes);
            expect(metadata).toHaveProperty('user_id', mechanic.user_id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not generate audit log when mechanic does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (nonExistentId) => {
            // Reset mocks for this iteration
            resetMocks();
            
            // Setup: Mock mechanic doesn't exist
            const mockAssignmentsSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            });

            const mockMechanicSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null, // Mechanic doesn't exist
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
              if (table === 'assignments') {
                return {
                  select: mockAssignmentsSelect,
                };
              } else if (table === 'mechanics') {
                return {
                  select: mockMechanicSelect,
                  delete: mockDelete,
                };
              }
              return {};
            });

            // Act: Attempt to delete non-existent mechanic
            await deleteMechanic(nonExistentId);

            // Assert: Audit log should NOT be created (no mechanic data to log)
            expect(logAuditActivity).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Audit logging doesn't block operations on failure
   * 
   * Even if audit logging fails, the primary CRUD operation should succeed.
   * This is tested by verifying that logAuditActivity is called but doesn't throw.
   */
  describe('Audit failure handling', () => {
    it('should not block create operation when audit logging fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 50 }),
            is_active: fc.boolean(),
            daily_capacity_minutes: fc.integer({ min: 240, max: 600 }),
            skill_notes: fc.string({ maxLength: 500 }),
          }),
          async (mechanicData) => {
            // Reset mocks for this iteration
            resetMocks();
            
            // Setup: Mock audit logging to fail
            (logAuditActivity as jest.Mock).mockRejectedValue(new Error('Audit system unavailable'));

            const createdUserId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanicId = fc.sample(fc.uuid(), 1)[0];
            const createdMechanic = {
              id: createdMechanicId,
              name: mechanicData.name,
              is_active: mechanicData.is_active,
              daily_capacity_minutes: mechanicData.daily_capacity_minutes,
              skill_notes: mechanicData.skill_notes,
              user_id: createdUserId,
            };

            mockSupabase.auth.getSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            mockSupabase.auth.signUp.mockResolvedValue({
              data: { user: { id: createdUserId } },
              error: null,
            });

            mockSupabase.auth.setSession.mockResolvedValue({
              data: { session: null },
              error: null,
            });

            const mockUserInsert = jest.fn().mockResolvedValue({
              data: null,
              error: null,
            });

            const mockMechanicSelect = jest.fn().mockReturnThis();
            const mockMechanicSingle = jest.fn().mockResolvedValue({
              data: createdMechanic,
              error: null,
            });
            const mockMechanicInsert = jest.fn().mockReturnThis();

            const mockExistingUserSelect = jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            });

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === 'users') {
                return {
                  select: mockExistingUserSelect,
                  insert: mockUserInsert,
                };
              } else if (table === 'mechanics') {
                return {
                  insert: mockMechanicInsert,
                };
              }
              return {};
            });

            mockMechanicInsert.mockReturnValue({
              select: mockMechanicSelect,
            });

            mockMechanicSelect.mockReturnValue({
              single: mockMechanicSingle,
            });

            const formData = new FormData();
            formData.append('name', mechanicData.name);
            formData.append('email', mechanicData.email);
            formData.append('password', mechanicData.password);
            formData.append('is_active', mechanicData.is_active.toString());
            formData.append('daily_capacity_minutes', mechanicData.daily_capacity_minutes.toString());
            formData.append('skill_notes', mechanicData.skill_notes);

            // Act & Assert: Should not throw despite audit failure
            const result = await createMechanic(null, formData);

            // Operation should succeed
            expect(result).toHaveProperty('success');
            expect(result.success).toBeTruthy();

            // Verify audit was attempted
            expect(logAuditActivity).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
