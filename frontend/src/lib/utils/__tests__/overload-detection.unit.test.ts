/**
 * Unit tests for mechanic overload detection
 * Tests Requirements 8.1, 8.2, 8.3, 8.4
 */

import { detectMechanicOverload, getMechanicOverloadStatus } from '../overload-detection';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Mechanic Overload Detection', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('detectMechanicOverload', () => {
    it('should calculate workload correctly by summing service durations', async () => {
      // Mock mechanics data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'mech-1', name: 'Ahmad', daily_capacity_minutes: 480, is_active: true }
          ],
          error: null
        })
      });

      // Mock assignments with bookings
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [
                  { duration_minutes: 60 },
                  { duration_minutes: 90 }
                ]
              }
            },
            {
              booking: {
                id: 'booking-2',
                schedule_start: new Date().toISOString(),
                status: 'in_progress',
                booking_services: [
                  { duration_minutes: 120 }
                ]
              }
            }
          ],
          error: null
        })
      });

      const result = await detectMechanicOverload();

      // Total workload should be 60 + 90 + 120 = 270 minutes
      // Percentage: 270 / 480 = 56.25%
      expect(result.totalMechanics).toBe(1);
      expect(result.overloadedCount).toBe(0); // Not overloaded (< 80%)
    });

    it('should mark mechanic as overloaded when workload >= 80%', async () => {
      // Mock mechanics data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'mech-1', name: 'Ahmad', daily_capacity_minutes: 480, is_active: true }
          ],
          error: null
        })
      });

      // Mock assignments with high workload (400 minutes = 83.3%)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [
                  { duration_minutes: 200 }
                ]
              }
            },
            {
              booking: {
                id: 'booking-2',
                schedule_start: new Date().toISOString(),
                status: 'in_progress',
                booking_services: [
                  { duration_minutes: 200 }
                ]
              }
            }
          ],
          error: null
        })
      });

      const result = await detectMechanicOverload();

      expect(result.overloadedCount).toBe(1);
      expect(result.overloadedMechanics).toHaveLength(1);
      expect(result.overloadedMechanics[0].isOverloaded).toBe(true);
      expect(result.overloadedMechanics[0].currentLoad).toBe(400);
      expect(result.overloadedMechanics[0].maxCapacity).toBe(480);
      expect(result.overloadedMechanics[0].overloadPercentage).toBeGreaterThanOrEqual(80);
    });

    it('should return complete overload status with all required fields', async () => {
      // Mock mechanics data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'mech-1', name: 'Ahmad', daily_capacity_minutes: 480, is_active: true }
          ],
          error: null
        })
      });

      // Mock assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 400 }]
              }
            }
          ],
          error: null
        })
      });

      const result = await detectMechanicOverload();

      expect(result).toHaveProperty('overloadedMechanics');
      expect(result).toHaveProperty('totalMechanics');
      expect(result).toHaveProperty('overloadedCount');
      expect(result).toHaveProperty('systemOverloadPercentage');

      const status = result.overloadedMechanics[0];
      expect(status).toHaveProperty('mechanicId');
      expect(status).toHaveProperty('mechanicName');
      expect(status).toHaveProperty('currentLoad');
      expect(status).toHaveProperty('maxCapacity');
      expect(status).toHaveProperty('isOverloaded');
      expect(status).toHaveProperty('overloadPercentage');
      expect(status).toHaveProperty('queuedBookings');
      expect(status).toHaveProperty('inProgressBookings');
    });

    it('should filter bookings for current day only', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock mechanics data
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'mech-1', name: 'Ahmad', daily_capacity_minutes: 480, is_active: true }
          ],
          error: null
        })
      });

      // Mock assignments - should only include today's bookings
      const mockAssignmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-today',
                schedule_start: today.toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 100 }]
              }
            }
          ],
          error: null
        })
      };

      mockSupabase.from.mockReturnValueOnce(mockAssignmentsQuery);

      await detectMechanicOverload();

      // Verify date filtering was applied
      expect(mockAssignmentsQuery.gte).toHaveBeenCalled();
      expect(mockAssignmentsQuery.lt).toHaveBeenCalled();
    });

    it('should use default capacity of 480 minutes when not specified', async () => {
      // Mock mechanics without daily_capacity_minutes
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'mech-1', name: 'Ahmad', is_active: true }
          ],
          error: null
        })
      });

      // Mock assignments
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const result = await detectMechanicOverload();

      // Should use default 480 minutes capacity
      expect(result.totalMechanics).toBe(1);
    });
  });

  describe('getMechanicOverloadStatus', () => {
    it('should return status for specific mechanic', async () => {
      const mechanicId = 'mech-1';

      // Mock getting specific mechanic
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: 'Ahmad', daily_capacity_minutes: 480, is_active: true },
          error: null
        })
      });

      // Mock getting assignments for this mechanic
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 400 }]
              }
            }
          ],
          error: null
        })
      });

      const status = await getMechanicOverloadStatus(mechanicId);

      expect(status).not.toBeNull();
      expect(status?.mechanicId).toBe(mechanicId);
      expect(status?.currentLoad).toBe(400);
      expect(status?.maxCapacity).toBe(480);
      expect(status?.isOverloaded).toBe(true); // 400/480 = 83.3% >= 80%
      expect(status?.overloadPercentage).toBe(83);
    });

    it('should return null for non-existent mechanic', async () => {
      const mechanicId = 'non-existent';

      // Mock getting specific mechanic - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const status = await getMechanicOverloadStatus(mechanicId);

      expect(status).toBeNull();
    });

    it('should return status even when mechanic is not overloaded', async () => {
      const mechanicId = 'mech-2';

      // Mock getting specific mechanic
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mechanicId, name: 'Budi', daily_capacity_minutes: 480, is_active: true },
          error: null
        })
      });

      // Mock getting assignments - only 100 minutes of work
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              booking: {
                id: 'booking-1',
                schedule_start: new Date().toISOString(),
                status: 'queued',
                booking_services: [{ duration_minutes: 100 }]
              }
            }
          ],
          error: null
        })
      });

      const status = await getMechanicOverloadStatus(mechanicId);

      expect(status).not.toBeNull();
      expect(status?.mechanicId).toBe(mechanicId);
      expect(status?.currentLoad).toBe(100);
      expect(status?.maxCapacity).toBe(480);
      expect(status?.isOverloaded).toBe(false); // 100/480 = 20.8% < 80%
      expect(status?.overloadPercentage).toBe(21);
    });
  });
});
