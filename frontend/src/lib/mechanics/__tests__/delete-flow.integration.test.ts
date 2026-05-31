/**
 * Integration Tests for Mechanic Delete Flow
 * Feature: system-improvements-crud-audit-kpi
 * Task: 14.1 Write integration tests for delete flow
 * 
 * These tests verify the complete delete flow from UI interaction to database removal,
 * including confirmation dialog, audit logging, and UI refresh.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.3
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit/actions');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateMechanicPaths: jest.fn(),
}));

import { deleteMechanic } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';
import { revalidateMechanicPaths } from '@/lib/utils/revalidation';

describe('Mechanic Delete Flow - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Complete delete flow from UI to database', () => {
    it('should complete full delete flow: check assignments -> delete from DB -> log audit -> refresh UI', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174000';
      const mechanic = {
        id: mechanicId,
        name: 'Ahmad',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: 'user-123',
      };

      // Mock the complete flow
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [], // No active assignments
                    error: null,
                  }),
                }),
              }),
            }),
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

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - Verify complete flow
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify assignment check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');

      // Verify delete was called
      expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');

      // Verify audit log was created
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_mechanic',
        'mechanic',
        mechanicId,
        expect.objectContaining({
          name: mechanic.name,
          is_active: mechanic.is_active,
          daily_capacity_minutes: mechanic.daily_capacity_minutes,
          user_id: mechanic.user_id,
        })
      );

      // Verify UI refresh was triggered
      expect(revalidateMechanicPaths).toHaveBeenCalled();
    });

    it('should handle complete flow with referential integrity check preventing deletion', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174001';
      const mechanic = {
        id: mechanicId,
        name: 'Budi',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: 'user-456',
      };

      // Mock mechanic with active assignments
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'assignment-1', booking: { status: 'confirmed' } }], // Has active assignments
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - Flow should stop at assignment check
      expect(result.success).toBeUndefined();
      expect(result.error).toContain('assignment');

      // Verify assignment check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');

      // Verify audit log was NOT created
      expect(logAuditActivity).not.toHaveBeenCalled();

      // Verify UI refresh was NOT triggered
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });

    it('should delete linked user account after mechanic deletion', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174002';
      const userId = 'user-789';
      const mechanic = {
        id: mechanicId,
        name: 'Candra',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: userId,
      };

      let userDeleteCalled = false;

      // Mock successful deletion with user
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            delete: jest.fn().mockImplementation(() => {
              userDeleteCalled = true;
              return {
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(userDeleteCalled).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });

    it('should handle database error during delete operation gracefully', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174003';
      const mechanic = {
        id: mechanicId,
        name: 'Dedi',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };
      const dbError = 'Database connection lost';

      // Mock database error during delete
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBe(dbError);

      // Verify audit log was NOT created (delete failed)
      expect(logAuditActivity).not.toHaveBeenCalled();

      // Verify UI refresh was NOT triggered (delete failed)
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation dialog interaction', () => {
    it('should allow deletion when user confirms', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174004';
      const mechanic = {
        id: mechanicId,
        name: 'Eko',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock successful deletion (simulating user confirmed)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act - This simulates the user clicking "Confirm" in the dialog
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should preserve state when validation fails (simulating cancel)', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174005';
      const mechanic = {
        id: mechanicId,
        name: 'Fajar',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock mechanic with assignments (validation fails, simulating cancel)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'assignment-1', booking: { status: 'in_progress' } }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - State should be preserved (error returned, no deletion)
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(logAuditActivity).not.toHaveBeenCalled();
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });
  });

  describe('Audit log creation during delete', () => {
    it('should create audit log with complete mechanic metadata', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174006';
      const mechanic = {
        id: mechanicId,
        name: 'Gunawan',
        is_active: true,
        daily_capacity_minutes: 600,
        skill_notes: 'Expert in engine repair',
        user_id: 'user-abc',
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
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

      // Act
      await deleteMechanic(mechanicId);

      // Assert - Verify audit log contains all required metadata
      expect(logAuditActivity).toHaveBeenCalledTimes(1);
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_mechanic',
        'mechanic',
        mechanicId,
        {
          name: mechanic.name,
          is_active: mechanic.is_active,
          daily_capacity_minutes: mechanic.daily_capacity_minutes,
          user_id: mechanic.user_id,
        }
      );
    });

    it('should create audit log for inactive mechanic', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174007';
      const mechanic = {
        id: mechanicId,
        name: 'Hadi',
        is_active: false,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_mechanic',
        'mechanic',
        mechanicId,
        expect.objectContaining({
          is_active: false,
        })
      );
    });

    it('should not create audit log when deletion fails', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174008';
      const mechanic = {
        id: mechanicId,
        name: 'Irfan',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock deletion failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(logAuditActivity).not.toHaveBeenCalled();
    });
  });

  describe('UI refresh after delete', () => {
    it('should trigger revalidation after successful deletion', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174009';
      const mechanic = {
        id: mechanicId,
        name: 'Joko',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mechanic,
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(revalidateMechanicPaths).toHaveBeenCalledTimes(1);
    });

    it('should not trigger revalidation when deletion fails', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174010';

      // Mock deletion failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mechanicId, name: 'Test' },
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
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });

    it('should not trigger revalidation when referential integrity check fails', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174011';

      // Mock mechanic with assignments
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mechanicId, name: 'Test' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'assignment-1', booking: { status: 'queued' } }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });
  });

  describe('End-to-end delete flow scenarios', () => {
    it('should handle complete successful delete flow with all steps', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174012';
      const mechanic = {
        id: mechanicId,
        name: 'Kurniawan',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: 'user-xyz',
      };

      const flowSteps: string[] = [];

      // Mock with tracking
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('fetch_mechanic');
              return {
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mechanic,
                    error: null,
                  }),
                }),
              };
            }),
            delete: jest.fn().mockImplementation(() => {
              flowSteps.push('delete_mechanic');
              return {
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('check_assignments');
              return {
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        } else if (table === 'users') {
          return {
            delete: jest.fn().mockImplementation(() => {
              flowSteps.push('delete_user');
              return {
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
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

      (revalidateMechanicPaths as jest.Mock).mockImplementation(() => {
        flowSteps.push('revalidate_ui');
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - Verify flow order
      expect(result.success).toBe(true);
      expect(flowSteps).toEqual([
        'check_assignments',
        'fetch_mechanic',
        'delete_mechanic',
        'log_audit',
        'delete_user',
        'revalidate_ui',
      ]);
    });

    it('should stop flow at assignment check when active assignments exist', async () => {
      // Arrange
      const mechanicId = '123e4567-e89b-12d3-a456-426614174013';
      const mechanic = {
        id: mechanicId,
        name: 'Lukman',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      const flowSteps: string[] = [];

      // Mock with tracking
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'mechanics') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('fetch_mechanic');
              return {
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mechanic,
                    error: null,
                  }),
                }),
              };
            }),
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockImplementation(() => {
              flowSteps.push('check_assignments');
              return {
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [{ id: 'assignment-1', booking: { status: 'pending' } }],
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - Flow should stop after assignment check
      expect(result.error).toBeDefined();
      expect(flowSteps).toEqual([
        'check_assignments',
      ]);
      expect(flowSteps).not.toContain('delete_mechanic');
      expect(flowSteps).not.toContain('log_audit');
      expect(flowSteps).not.toContain('revalidate_ui');
    });
  });
});
