/**
 * Unit Tests for Mechanic Deletion Edge Cases
 * Feature: system-improvements-crud-audit-kpi
 * Task: 3.3 Write unit tests for mechanic deletion
 * 
 * These tests verify specific examples and edge cases for mechanic deletion.
 * Requirements: 2.3, 2.5, 2.6
 */

import { deleteMechanic } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';

// Mock the Supabase client
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateMechanicPaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Mechanic Deletion - Unit Tests (Edge Cases)', () => {
  let mockSupabase: {
    from: jest.Mock;
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Deletion with active assignments (should fail)', () => {
    it('should fail when mechanic has one pending assignment', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock has one pending assignment
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'assignment-1', booking: { status: 'pending' } }],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('assignment');
    });

    it('should fail when mechanic has confirmed assignment', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174001';

      // Mock has confirmed assignment
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'assignment-1', booking: { status: 'confirmed' } }],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('assignment');
    });

    it('should fail when mechanic has queued assignment', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174002';

      // Mock has queued assignment
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'assignment-1', booking: { status: 'queued' } }],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it('should fail when mechanic has in_progress assignment', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174003';

      // Mock has in_progress assignment
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'assignment-1', booking: { status: 'in_progress' } }],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it('should fail when mechanic has multiple active assignments', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174004';

      // Mock has multiple active assignments
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                { id: 'assignment-1', booking: { status: 'pending' } },
                { id: 'assignment-2', booking: { status: 'confirmed' } },
                { id: 'assignment-3', booking: { status: 'queued' } },
              ],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('assignment');
    });

    it('should return appropriate error message in Indonesian', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174005';

      // Mock has active assignment
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'assignment-1', booking: { status: 'pending' } }],
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
      expect(result.error).toBe('Tidak dapat menghapus mekanik yang memiliki assignment aktif atau pending');
    });
  });

  describe('Deletion without assignments (should succeed)', () => {
    it('should succeed when mechanic has no assignments', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174006';
      const mechanic = {
        id: mechanicId,
        name: 'Ahmad',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock has no assignments
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

      // Mock mechanic data
      const mockMechanicSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mechanic,
            error: null,
          }),
        }),
      });

      // Mock delete operation
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        } else if (table === 'mechanics') {
          return {
            select: mockMechanicSelect,
            delete: mockDelete,
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify delete was called with correct ID
      expect(mockDelete).toHaveBeenCalled();
      const deleteEqCall = mockDelete.mock.results[0].value.eq;
      expect(deleteEqCall).toHaveBeenCalledWith('id', mechanicId);
    });

    it('should succeed when mechanic has only completed assignments', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174007';
      const mechanic = {
        id: mechanicId,
        name: 'Budi',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock has only completed assignments (not in the active statuses)
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

      // Mock mechanic data and delete
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        } else if (table === 'mechanics') {
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should succeed when mechanic has only cancelled assignments', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174008';
      const mechanic = {
        id: mechanicId,
        name: 'Candra',
        is_active: false,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock has only cancelled assignments (not in the active statuses)
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

      // Mock mechanic data and delete
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        } else if (table === 'mechanics') {
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should log audit activity after successful deletion', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174009';
      const mechanic = {
        id: mechanicId,
        name: 'Dedi',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: 'user-123',
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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

      // Assert
      expect(result.success).toBe(true);
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

    it('should call revalidateMechanicPaths after successful deletion', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174010';
      const { revalidateMechanicPaths } = jest.requireMock('@/lib/utils/revalidation');

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert
      expect(revalidateMechanicPaths).toHaveBeenCalled();
    });

    it('should delete linked user account when mechanic has user_id', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174011';
      const userId = 'user-456';
      const mechanic = {
        id: mechanicId,
        name: 'Eko',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: userId,
      };

      const mockUserDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
        } else if (table === 'users') {
          return {
            delete: mockUserDelete,
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserDelete).toHaveBeenCalled();
      const userDeleteEqCall = mockUserDelete.mock.results[0].value.eq;
      expect(userDeleteEqCall).toHaveBeenCalledWith('id', userId);
    });
  });

  describe('UI refresh after deletion', () => {
    it('should trigger revalidation to refresh UI after successful deletion', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174012';
      const { revalidateMechanicPaths } = jest.requireMock('@/lib/utils/revalidation');

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      await deleteMechanic(mechanicId);

      // Assert - revalidation should be called to refresh the UI
      expect(revalidateMechanicPaths).toHaveBeenCalledTimes(1);
    });

    it('should not trigger revalidation when deletion fails', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174013';
      const { revalidateMechanicPaths } = jest.requireMock('@/lib/utils/revalidation');

      // Mock has active assignment (deletion should fail)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'assignment-1', booking: { status: 'pending' } }],
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

      // Assert - revalidation should NOT be called when deletion fails
      expect(revalidateMechanicPaths).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database error during assignment check', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174014';
      const errorMessage = 'Database connection failed';

      // Mock error during assignment check
      const mockAssignmentsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: errorMessage },
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return { select: mockAssignmentsSelect };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.error).toBe(errorMessage);
      expect(result.success).toBeUndefined();
    });

    it('should handle database error during delete operation', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174015';
      const deleteErrorMessage = 'Foreign key constraint violation';

      // Mock no assignments but delete fails
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
                error: { message: deleteErrorMessage },
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.error).toBe(deleteErrorMessage);
      expect(result.success).toBeUndefined();
    });

    it('should handle null assignments data gracefully', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174016';

      // Mock null assignments data
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null, // null instead of empty array
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'mechanics') {
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
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - should succeed since null is treated as no assignments
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should not log audit activity when mechanic data is not found', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174017';

      // Mock mechanic not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null, // Mechanic not found
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(logAuditActivity).not.toHaveBeenCalled();
    });

    it('should continue deletion even if user deletion fails', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174018';
      const userId = 'user-789';
      const mechanic = {
        id: mechanicId,
        name: 'Fajar',
        is_active: true,
        daily_capacity_minutes: 480,
        user_id: userId,
      };

      // Mock successful mechanic deletion but failed user deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
        } else if (table === 'users') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'User deletion failed' },
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - should still succeed even if user deletion fails
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string mechanic ID', async () => {
      const mechanicId = '';

      // Mock empty ID scenario
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert - should complete without crashing
      expect(result).toBeDefined();
    });

    it('should handle mechanic with zero capacity', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174019';
      const mechanic = {
        id: mechanicId,
        name: 'Gani',
        is_active: false,
        daily_capacity_minutes: 0,
        user_id: null,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_mechanic',
        'mechanic',
        mechanicId,
        expect.objectContaining({
          daily_capacity_minutes: 0,
        })
      );
    });

    it('should handle inactive mechanic deletion', async () => {
      const mechanicId = '123e4567-e89b-12d3-a456-426614174020';
      const mechanic = {
        id: mechanicId,
        name: 'Hadi',
        is_active: false,
        daily_capacity_minutes: 480,
        user_id: null,
      };

      // Mock successful deletion
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
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
        } else if (table === 'mechanics') {
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
        }
        return {};
      });

      // Act
      const result = await deleteMechanic(mechanicId);

      // Assert
      expect(result.success).toBe(true);
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_mechanic',
        'mechanic',
        mechanicId,
        expect.objectContaining({
          is_active: false,
        })
      );
    });
  });
});
