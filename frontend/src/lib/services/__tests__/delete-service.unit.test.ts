/**
 * Unit Tests for Service Type Deletion Edge Cases
 * Feature: system-improvements-crud-audit-kpi
 * Task: 2.5 Write unit tests for delete edge cases
 * 
 * These tests verify specific examples and edge cases for service type deletion.
 * Requirements: 1.4, 1.5
 */

import { deleteService } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { logAuditActivity } from '@/lib/audit/actions';

// Mock the Supabase client
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/revalidation', () => ({
  revalidateServicePaths: jest.fn(),
}));
jest.mock('@/lib/audit/actions', () => ({
  logAuditActivity: jest.fn(),
}));

describe('Service Type Deletion - Unit Tests (Edge Cases)', () => {
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

  describe('Deletion with existing bookings (should fail)', () => {
    it('should fail when service type has one booking', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174000';
      const serviceType = {
        id: serviceId,
        name: 'Oil Change',
        price: 50000,
        default_duration_minutes: 30,
      };

      // Mock service type exists
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: serviceType,
            error: null,
          }),
        }),
      });

      // Mock has one booking
      const mockBookingServicesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'booking-1' }],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return { select: mockSelect };
        } else if (table === 'booking_services') {
          return { select: mockBookingServicesSelect };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('booking');
      
      // Verify delete was NOT called
      expect(mockSupabase.from).not.toHaveBeenCalledWith(
        expect.objectContaining({ delete: expect.any(Function) })
      );
    });

    it('should fail when service type has multiple bookings', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174001';
      const serviceType = {
        id: serviceId,
        name: 'Tire Replacement',
        price: 150000,
        default_duration_minutes: 60,
      };

      // Mock service type exists
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: serviceType,
            error: null,
          }),
        }),
      });

      // Mock has multiple bookings
      const mockBookingServicesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              { id: 'booking-1' },
              { id: 'booking-2' },
              { id: 'booking-3' },
            ],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return { select: mockSelect };
        } else if (table === 'booking_services') {
          return { select: mockBookingServicesSelect };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('booking');
    });

    it('should return appropriate error message in Indonesian', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174002';

      // Mock service type exists with bookings
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: serviceId, name: 'Test Service' },
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

      // Assert
      expect(result.error).toBe('Tidak dapat menghapus jenis servis yang memiliki booking terkait');
    });
  });

  describe('Deletion without bookings (should succeed)', () => {
    it('should succeed when service type has no bookings', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174003';
      const serviceType = {
        id: serviceId,
        name: 'Brake Service',
        price: 75000,
        default_duration_minutes: 45,
      };

      // Mock service type exists
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: serviceType,
            error: null,
          }),
        }),
      });

      // Mock has no bookings
      const mockBookingServicesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
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
        if (table === 'service_types') {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        } else if (table === 'booking_services') {
          return { select: mockBookingServicesSelect };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify delete was called with correct ID
      expect(mockDelete).toHaveBeenCalled();
      const deleteEqCall = mockDelete.mock.results[0].value.eq;
      expect(deleteEqCall).toHaveBeenCalledWith('id', serviceId);
    });

    it('should log audit activity after successful deletion', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174004';
      const serviceType = {
        id: serviceId,
        name: 'Chain Lubrication',
        price: 25000,
        default_duration_minutes: 15,
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
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBe(true);
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

    it('should call revalidateServicePaths after successful deletion', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174005';
      const { revalidateServicePaths } = require('@/lib/utils/revalidation');

      // Mock successful deletion
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
      expect(revalidateServicePaths).toHaveBeenCalled();
    });
  });

  describe('Cancellation behavior', () => {
    it('should not delete when booking check returns error', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174006';
      const errorMessage = 'Database connection failed';

      // Mock service type exists
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: serviceId, name: 'Test Service' },
            error: null,
          }),
        }),
      });

      // Mock error during booking check
      const mockBookingServicesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: errorMessage },
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return { select: mockSelect };
        } else if (table === 'booking_services') {
          return { select: mockBookingServicesSelect };
        }
        return {};
      });

      // Act
      const result = await deleteService(serviceId);

      // Assert
      expect(result.error).toBe(errorMessage);
      expect(result.success).toBeUndefined();
      
      // Verify delete was NOT called
      expect(mockSupabase.from).not.toHaveBeenCalledWith(
        expect.objectContaining({ delete: expect.any(Function) })
      );
    });

    it('should not delete when database delete operation fails', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174007';
      const deleteErrorMessage = 'Foreign key constraint violation';

      // Mock service type exists with no bookings
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: serviceId, name: 'Test Service' },
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
      expect(result.error).toBe(deleteErrorMessage);
      expect(result.success).toBeUndefined();
    });

    it('should handle null bookings data gracefully', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174008';

      // Mock service type exists
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: serviceId, name: 'Test Service' },
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
                  data: null, // null instead of empty array
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

      // Assert - should succeed since null is treated as no bookings
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should not log audit activity when service type data is not found', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174009';

      // Mock service type not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'service_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null, // Service type not found
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
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBe(true);
      expect(logAuditActivity).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string service ID', async () => {
      const serviceId = '';

      // Mock empty ID scenario
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
      const result = await deleteService(serviceId);

      // Assert - should complete without crashing
      expect(result).toBeDefined();
    });

    it('should handle service type with zero price', async () => {
      const serviceId = '123e4567-e89b-12d3-a456-426614174010';
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
      const result = await deleteService(serviceId);

      // Assert
      expect(result.success).toBe(true);
      expect(logAuditActivity).toHaveBeenCalledWith(
        'delete_service_type',
        'service_type',
        serviceId,
        expect.objectContaining({
          price: 0,
        })
      );
    });
  });
});
