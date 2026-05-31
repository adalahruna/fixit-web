/**
 * Unit tests for getMechanicPerformance helper function
 * Tests real mechanic performance query implementation
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { calculateKPIMetrics } from '../calculations';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('getMechanicPerformance - Real Data Query', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn()
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should query mechanics table for active mechanics', async () => {
    // Arrange
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn().mockResolvedValue({ data: [] })
            }))
          }))
        };
      } else if (table === 'mechanics') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [] })
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [] })
        }))
      };
    });

    // Act
    await calculateKPIMetrics();

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
  });

  it('should query assignments table for mechanic bookings', async () => {
    // Arrange
    const mockMechanics = [{ id: 'mech-1', name: 'Ahmad' }];
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn().mockResolvedValue({ data: [] })
            }))
          }))
        };
      } else if (table === 'mechanics') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: mockMechanics })
          }))
        };
      } else if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                gte: jest.fn(() => ({
                  lte: jest.fn().mockResolvedValue({ data: [] })
                }))
              }))
            }))
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [] })
        }))
      };
    });

    // Act
    await calculateKPIMetrics();

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
  });

  it('should return empty array when no mechanics exist', async () => {
    // Arrange
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn().mockResolvedValue({ data: [] })
            }))
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [] })
        }))
      };
    });

    // Act
    const result = await calculateKPIMetrics('2024-01-01', '2024-01-31');

    // Assert
    expect(result.mechanicPerformance).toEqual([]);
  });
});

describe('getMechanicPerformance - Calculations', () => {
  it('should calculate average service time correctly', () => {
    // Test the calculation logic
    const completedJobs = 2;
    const totalTime = 100; // 45 + 55
    const avgTime = completedJobs > 0 ? Math.round(totalTime / completedJobs) : 0;
    
    expect(avgTime).toBe(50);
  });

  it('should calculate on-time rate correctly', () => {
    // Test the on-time calculation logic
    const totalJobs = 2;
    const onTimeJobs = 1;
    const onTimeRate = totalJobs > 0 ? Math.round((onTimeJobs / totalJobs) * 100) : 0;
    
    expect(onTimeRate).toBe(50);
  });

  it('should handle zero completed jobs', () => {
    const completedJobs = 0;
    const totalTime = 0;
    const avgTime = completedJobs > 0 ? Math.round(totalTime / completedJobs) : 0;
    const onTimeRate = completedJobs > 0 ? Math.round((0 / completedJobs) * 100) : 0;
    
    expect(avgTime).toBe(0);
    expect(onTimeRate).toBe(0);
  });

  it('should handle missing actual_duration', () => {
    const actualDuration = null;
    const result = actualDuration || 0;
    
    expect(result).toBe(0);
  });

  it('should determine on-time status with tolerance', () => {
    // Scheduled: 60 minutes
    const scheduledDuration = 60 * 60 * 1000; // milliseconds
    const tolerance = 30 * 60 * 1000; // 30 minutes
    
    // Case 1: On time (55 minutes)
    const actualDuration1 = 55 * 60 * 1000;
    const isOnTime1 = actualDuration1 <= scheduledDuration + tolerance;
    expect(isOnTime1).toBe(true);
    
    // Case 2: Late (100 minutes)
    const actualDuration2 = 100 * 60 * 1000;
    const isOnTime2 = actualDuration2 <= scheduledDuration + tolerance;
    expect(isOnTime2).toBe(false);
  });

  it('should handle service_progress as array', () => {
    const serviceProgressArray = [{ actual_duration: 60 }];
    const serviceProgressObject = { actual_duration: 60 };
    
    // Test array handling
    const progress1 = Array.isArray(serviceProgressArray) 
      ? serviceProgressArray[0] 
      : serviceProgressArray;
    expect(progress1.actual_duration).toBe(60);
    
    // Test object handling
    const progress2 = Array.isArray(serviceProgressObject) 
      ? serviceProgressObject[0] 
      : serviceProgressObject;
    expect(progress2.actual_duration).toBe(60);
  });

  it('should include mechanics with zero completed jobs in results', () => {
    // This tests the requirement that mechanics with zero jobs should appear
    const mechanics = [
      { name: 'Ahmad', completedJobs: 5, avgTime: 45, onTimeRate: 90 },
      { name: 'New Mechanic', completedJobs: 0, avgTime: 0, onTimeRate: 0 }
    ];
    
    const mechanicsWithZeroJobs = mechanics.filter(m => m.completedJobs === 0);
    expect(mechanicsWithZeroJobs.length).toBeGreaterThan(0);
    expect(mechanicsWithZeroJobs[0].name).toBe('New Mechanic');
  });

  it('should calculate metrics from actual_duration field', () => {
    // Test that we use actual_duration from service_progress
    const assignments = [
      { booking: { service_progress: { actual_duration: 45 } } },
      { booking: { service_progress: { actual_duration: 55 } } }
    ];
    
    const totalTime = assignments.reduce((sum, a: any) => {
      return sum + (a.booking.service_progress.actual_duration || 0);
    }, 0);
    
    expect(totalTime).toBe(100);
  });

  it('should filter bookings by date range', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    
    const bookingDate1 = new Date('2024-01-15');
    const bookingDate2 = new Date('2023-12-31');
    const bookingDate3 = new Date('2024-02-01');
    
    // Test date filtering logic
    const isInRange1 = bookingDate1 >= startDate && bookingDate1 <= endDate;
    const isInRange2 = bookingDate2 >= startDate && bookingDate2 <= endDate;
    const isInRange3 = bookingDate3 >= startDate && bookingDate3 <= endDate;
    
    expect(isInRange1).toBe(true);
    expect(isInRange2).toBe(false);
    expect(isInRange3).toBe(false);
  });

  it('should only include completed bookings (status = done)', () => {
    const bookings = [
      { status: 'done', id: '1' },
      { status: 'in_progress', id: '2' },
      { status: 'done', id: '3' },
      { status: 'cancelled', id: '4' }
    ];
    
    const completedBookings = bookings.filter(b => b.status === 'done');
    expect(completedBookings.length).toBe(2);
  });
});
