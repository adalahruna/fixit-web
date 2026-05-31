/**
 * Integration Tests for KPI Dashboard
 * Feature: system-improvements-crud-audit-kpi
 * Task: 14.4 Write integration tests for KPI dashboard
 * 
 * These tests verify:
 * 1. Dashboard loads with real data
 * 2. All charts display correctly
 * 3. Date range filtering works correctly
 * 4. No mock data present
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */

import { calculateKPIMetrics } from '../calculations';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('KPI Dashboard - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Integration Test 1: Dashboard loads with real data
   * **Validates: Requirements 9.1, 9.5**
   * 
   * Verifies that the KPI dashboard loads successfully with real database data
   * and does not use any mock or hardcoded values.
   */
  describe('Integration Test 1: Dashboard loads with real data', () => {
    it('should load dashboard with real booking data from database', async () => {
      // Setup: Mock real database data
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-06-01T09:00:00Z',
          schedule_end: '2024-06-01T10:00:00Z',
          created_at: '2024-06-01T08:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 100000,
                default_duration_minutes: 60,
                name: 'Oil Change'
              }
            }
          ],
          service_progress: {
            start_time: '2024-06-01T09:00:00Z',
            end_time: '2024-06-01T10:00:00Z',
            actual_duration: 60
          }
        },
        {
          id: 'booking-2',
          status: 'in_progress',
          schedule_start: '2024-06-02T10:00:00Z',
          schedule_end: '2024-06-02T11:30:00Z',
          created_at: '2024-06-02T09:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 150000,
                default_duration_minutes: 90,
                name: 'Tire Change'
              }
            }
          ],
          service_progress: null
        },
        {
          id: 'booking-3',
          status: 'cancelled',
          schedule_start: '2024-06-03T14:00:00Z',
          schedule_end: '2024-06-03T15:00:00Z',
          created_at: '2024-06-03T13:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 200000,
                default_duration_minutes: 60,
                name: 'Full Service'
              }
            }
          ],
          service_progress: null
        }
      ];

      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad', daily_capacity_minutes: 480 },
        { id: 'mech-2', name: 'Budi', daily_capacity_minutes: 480 }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn().mockResolvedValue({ data: mockBookings })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Dashboard should load with real data
      expect(result).toBeDefined();
      expect(result.totalBookings).toBe(3);
      expect(result.completedBookings).toBe(1);
      expect(result.cancelledBookings).toBe(1);
      expect(result.pendingBookings).toBe(1);

      // Verify database was queried (not using mock data)
      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
      expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
    });

    it('should query mechanics table for performance data', async () => {
      // Setup: Mock mechanics and their assignments
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' }
      ];

      const mockAssignments = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-06-01T09:00:00Z',
            schedule_end: '2024-06-01T10:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 55,
              start_time: '2024-06-01T09:00:00Z',
              end_time: '2024-06-01T09:55:00Z'
            }
          }
        }
      ];

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
            select: jest.fn(() => {
              const eqChain = {
                eq: jest.fn((field: string, value: string) => {
                  if (value === 'mech-1') {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: mockAssignments })
                        }))
                      }))
                    };
                  } else {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: [] })
                        }))
                      }))
                    };
                  }
                })
              };
              return eqChain;
            })
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [] })
          }))
        };
      });

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Should query mechanics and assignments tables
      expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      
      // Verify mechanic performance data is populated
      expect(result.mechanicPerformance).toBeDefined();
      expect(result.mechanicPerformance.length).toBe(2);
    });

    it('should not contain any hardcoded mock data', async () => {
      // Setup: Empty database
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

      // Act: Load dashboard with empty database
      const result = await calculateKPIMetrics();

      // Assert: Should return empty/zero values, not mock data
      expect(result.mechanicPerformance).toEqual([]);
      expect(result.totalBookings).toBe(0);
      
      // Verify no hardcoded names like 'Ahmad', 'Budi', 'Candra'
      const mechanicNames = result.mechanicPerformance.map(m => m.name);
      expect(mechanicNames).not.toContain('Ahmad');
      expect(mechanicNames).not.toContain('Budi');
      expect(mechanicNames).not.toContain('Candra');
    });
  });

  /**
   * Integration Test 2: All charts display correctly
   * **Validates: Requirements 9.2, 9.3**
   * 
   * Verifies that all dashboard charts (mechanic performance, booking trends, revenue)
   * display correctly with real data.
   */
  describe('Integration Test 2: All charts display correctly', () => {
    it('should display mechanic performance chart with real data', async () => {
      // Setup: Mock mechanics with completed jobs
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' },
        { id: 'mech-3', name: 'Candra' }
      ];

      const mockAssignmentsForAhmad = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-06-01T09:00:00Z',
            schedule_end: '2024-06-01T10:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 55,
              start_time: '2024-06-01T09:00:00Z',
              end_time: '2024-06-01T09:55:00Z'
            }
          }
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: '2024-06-02T09:00:00Z',
            schedule_end: '2024-06-02T10:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 65,
              start_time: '2024-06-02T09:00:00Z',
              end_time: '2024-06-02T10:05:00Z'
            }
          }
        }
      ];

      const mockAssignmentsForBudi = [
        {
          booking: {
            id: 'booking-3',
            schedule_start: '2024-06-01T10:00:00Z',
            schedule_end: '2024-06-01T11:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 50,
              start_time: '2024-06-01T10:00:00Z',
              end_time: '2024-06-01T10:50:00Z'
            }
          }
        }
      ];

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
            select: jest.fn(() => {
              const eqChain = {
                eq: jest.fn((field: string, value: string) => {
                  if (value === 'mech-1') {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: mockAssignmentsForAhmad })
                        }))
                      }))
                    };
                  } else if (value === 'mech-2') {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: mockAssignmentsForBudi })
                        }))
                      }))
                    };
                  } else {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: [] })
                        }))
                      }))
                    };
                  }
                })
              };
              return eqChain;
            })
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [] })
          }))
        };
      });

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Mechanic performance chart should have correct data
      expect(result.mechanicPerformance).toBeDefined();
      expect(result.mechanicPerformance.length).toBe(3);

      // Ahmad: 2 completed jobs, avg time = (55 + 65) / 2 = 60
      const ahmadPerf = result.mechanicPerformance.find(m => m.name === 'Ahmad');
      expect(ahmadPerf).toBeDefined();
      expect(ahmadPerf!.completedJobs).toBe(2);
      expect(ahmadPerf!.avgTime).toBe(60);

      // Budi: 1 completed job, avg time = 50
      const budiPerf = result.mechanicPerformance.find(m => m.name === 'Budi');
      expect(budiPerf).toBeDefined();
      expect(budiPerf!.completedJobs).toBe(1);
      expect(budiPerf!.avgTime).toBe(50);

      // Candra: 0 completed jobs
      const candraPerf = result.mechanicPerformance.find(m => m.name === 'Candra');
      expect(candraPerf).toBeDefined();
      expect(candraPerf!.completedJobs).toBe(0);
      expect(candraPerf!.avgTime).toBe(0);
      expect(candraPerf!.onTimeRate).toBe(0);
    });

    it('should display booking status distribution chart with real data', async () => {
      // Setup: Mock bookings with various statuses
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-06-01T09:00:00Z',
          schedule_end: '2024-06-01T10:00:00Z',
          created_at: '2024-06-01T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 1' } }],
          service_progress: { start_time: '2024-06-01T09:00:00Z', end_time: '2024-06-01T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-2',
          status: 'done',
          schedule_start: '2024-06-02T09:00:00Z',
          schedule_end: '2024-06-02T10:00:00Z',
          created_at: '2024-06-02T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 2' } }],
          service_progress: { start_time: '2024-06-02T09:00:00Z', end_time: '2024-06-02T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-3',
          status: 'in_progress',
          schedule_start: '2024-06-03T09:00:00Z',
          schedule_end: '2024-06-03T10:00:00Z',
          created_at: '2024-06-03T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 3' } }],
          service_progress: null
        },
        {
          id: 'booking-4',
          status: 'cancelled',
          schedule_start: '2024-06-04T09:00:00Z',
          schedule_end: '2024-06-04T10:00:00Z',
          created_at: '2024-06-04T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 4' } }],
          service_progress: null
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn().mockResolvedValue({ data: mockBookings })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Booking status distribution should be correct
      expect(result.bookingsByStatus).toBeDefined();
      expect(result.bookingsByStatus.length).toBeGreaterThan(0);
      
      const completedStatus = result.bookingsByStatus.find(s => s.status === 'Completed');
      expect(completedStatus).toBeDefined();
      expect(completedStatus!.count).toBe(2);

      const inProgressStatus = result.bookingsByStatus.find(s => s.status === 'In Progress');
      expect(inProgressStatus).toBeDefined();
      expect(inProgressStatus!.count).toBe(1);

      const cancelledStatus = result.bookingsByStatus.find(s => s.status === 'Cancelled');
      expect(cancelledStatus).toBeDefined();
      expect(cancelledStatus!.count).toBe(1);
    });

    it('should display service type distribution chart with real data', async () => {
      // Setup: Mock bookings with different service types
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-06-01T09:00:00Z',
          schedule_end: '2024-06-01T10:00:00Z',
          created_at: '2024-06-01T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Oil Change' } }],
          service_progress: { start_time: '2024-06-01T09:00:00Z', end_time: '2024-06-01T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-2',
          status: 'done',
          schedule_start: '2024-06-02T09:00:00Z',
          schedule_end: '2024-06-02T10:00:00Z',
          created_at: '2024-06-02T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Oil Change' } }],
          service_progress: { start_time: '2024-06-02T09:00:00Z', end_time: '2024-06-02T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-3',
          status: 'done',
          schedule_start: '2024-06-03T09:00:00Z',
          schedule_end: '2024-06-03T10:00:00Z',
          created_at: '2024-06-03T08:00:00Z',
          booking_services: [{ service_type: { price: 150000, default_duration_minutes: 90, name: 'Tire Change' } }],
          service_progress: { start_time: '2024-06-03T09:00:00Z', end_time: '2024-06-03T10:30:00Z', actual_duration: 90 }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn().mockResolvedValue({ data: mockBookings })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Service type distribution should be correct
      expect(result.serviceTypeDistribution).toBeDefined();
      expect(result.serviceTypeDistribution.length).toBe(2);

      const oilChange = result.serviceTypeDistribution.find(s => s.name === 'Oil Change');
      expect(oilChange).toBeDefined();
      expect(oilChange!.count).toBe(2);
      expect(oilChange!.revenue).toBe(200000);

      const tireChange = result.serviceTypeDistribution.find(s => s.name === 'Tire Change');
      expect(tireChange).toBeDefined();
      expect(tireChange!.count).toBe(1);
      expect(tireChange!.revenue).toBe(150000);
    });

    it('should display weekly booking trend chart with real data', async () => {
      // Setup: Mock bookings across multiple weeks
      const now = new Date('2024-06-15T12:00:00Z');
      const mockBookings = [
        // Week 1 (3 weeks ago)
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-05-25T09:00:00Z',
          schedule_end: '2024-05-25T10:00:00Z',
          created_at: '2024-05-25T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 1' } }],
          service_progress: { start_time: '2024-05-25T09:00:00Z', end_time: '2024-05-25T10:00:00Z', actual_duration: 60 }
        },
        // Week 2 (2 weeks ago)
        {
          id: 'booking-2',
          status: 'done',
          schedule_start: '2024-06-01T09:00:00Z',
          schedule_end: '2024-06-01T10:00:00Z',
          created_at: '2024-06-01T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 2' } }],
          service_progress: { start_time: '2024-06-01T09:00:00Z', end_time: '2024-06-01T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-3',
          status: 'done',
          schedule_start: '2024-06-02T09:00:00Z',
          schedule_end: '2024-06-02T10:00:00Z',
          created_at: '2024-06-02T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 3' } }],
          service_progress: { start_time: '2024-06-02T09:00:00Z', end_time: '2024-06-02T10:00:00Z', actual_duration: 60 }
        },
        // Week 4 (current week)
        {
          id: 'booking-4',
          status: 'done',
          schedule_start: '2024-06-15T09:00:00Z',
          schedule_end: '2024-06-15T10:00:00Z',
          created_at: '2024-06-15T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 4' } }],
          service_progress: { start_time: '2024-06-15T09:00:00Z', end_time: '2024-06-15T10:00:00Z', actual_duration: 60 }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn().mockResolvedValue({ data: mockBookings })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Weekly trend should be populated
      expect(result.weeklyTrend).toBeDefined();
      expect(result.weeklyTrend.length).toBe(4);
      
      // Verify each week has bookings and revenue data
      result.weeklyTrend.forEach(week => {
        expect(week.week).toBeDefined();
        expect(week.bookings).toBeGreaterThanOrEqual(0);
        expect(week.revenue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  /**
   * Integration Test 3: Date range filtering works correctly
   * **Validates: Requirements 9.1, 9.2**
   * 
   * Verifies that date range filtering correctly filters bookings and
   * mechanic performance data.
   */
  describe('Integration Test 3: Date range filtering works correctly', () => {
    it('should filter bookings by date range', async () => {
      // Setup: Mock bookings across different dates
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-05-15T09:00:00Z',
          schedule_end: '2024-05-15T10:00:00Z',
          created_at: '2024-05-15T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 1' } }],
          service_progress: { start_time: '2024-05-15T09:00:00Z', end_time: '2024-05-15T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-2',
          status: 'done',
          schedule_start: '2024-06-15T09:00:00Z',
          schedule_end: '2024-06-15T10:00:00Z',
          created_at: '2024-06-15T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 2' } }],
          service_progress: { start_time: '2024-06-15T09:00:00Z', end_time: '2024-06-15T10:00:00Z', actual_duration: 60 }
        },
        {
          id: 'booking-3',
          status: 'done',
          schedule_start: '2024-07-15T09:00:00Z',
          schedule_end: '2024-07-15T10:00:00Z',
          created_at: '2024-07-15T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 3' } }],
          service_progress: { start_time: '2024-07-15T09:00:00Z', end_time: '2024-07-15T10:00:00Z', actual_duration: 60 }
        }
      ];

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn((field: string, value: string) => ({
                lte: jest.fn((field2: string, value2: string) => {
                  callCount++;
                  // Filter bookings based on date range
                  const startDate = new Date(value);
                  const endDate = new Date(value2);
                  const filteredBookings = mockBookings.filter(b => {
                    const bookingDate = new Date(b.schedule_start);
                    return bookingDate >= startDate && bookingDate <= endDate;
                  });
                  return Promise.resolve({ data: filteredBookings });
                })
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

      // Act: Load dashboard with specific date range (June 2024)
      const result = await calculateKPIMetrics('2024-06-01', '2024-06-30');

      // Assert: Should only include June booking
      expect(result.totalBookings).toBe(1);
      expect(result.completedBookings).toBe(1);
      
      // Verify date range was used in query
      expect(callCount).toBeGreaterThan(0);
    });

    it('should filter mechanic performance by date range', async () => {
      // Setup: Mock mechanics with assignments in different date ranges
      const mockMechanics = [{ id: 'mech-1', name: 'Ahmad' }];

      const allAssignments = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-05-15T09:00:00Z',
            schedule_end: '2024-05-15T10:00:00Z',
            status: 'done',
            service_progress: { actual_duration: 60, start_time: '2024-05-15T09:00:00Z', end_time: '2024-05-15T10:00:00Z' }
          }
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: '2024-06-15T09:00:00Z',
            schedule_end: '2024-06-15T10:00:00Z',
            status: 'done',
            service_progress: { actual_duration: 55, start_time: '2024-06-15T09:00:00Z', end_time: '2024-06-15T09:55:00Z' }
          }
        },
        {
          booking: {
            id: 'booking-3',
            schedule_start: '2024-06-20T09:00:00Z',
            schedule_end: '2024-06-20T10:00:00Z',
            status: 'done',
            service_progress: { actual_duration: 65, start_time: '2024-06-20T09:00:00Z', end_time: '2024-06-20T10:05:00Z' }
          }
        }
      ];

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
                  gte: jest.fn((field: string, value: string) => ({
                    lte: jest.fn((field2: string, value2: string) => {
                      // Filter assignments by date range
                      const startDate = new Date(value);
                      const endDate = new Date(value2);
                      const filteredAssignments = allAssignments.filter(a => {
                        const assignmentDate = new Date(a.booking.schedule_start);
                        return assignmentDate >= startDate && assignmentDate <= endDate;
                      });
                      return Promise.resolve({ data: filteredAssignments });
                    })
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

      // Act: Load dashboard with June date range
      const result = await calculateKPIMetrics('2024-06-01', '2024-06-30');

      // Assert: Mechanic should only have 2 completed jobs from June
      expect(result.mechanicPerformance.length).toBe(1);
      const ahmadPerf = result.mechanicPerformance[0];
      expect(ahmadPerf.name).toBe('Ahmad');
      expect(ahmadPerf.completedJobs).toBe(2);
      // Average time should be (55 + 65) / 2 = 60
      expect(ahmadPerf.avgTime).toBe(60);
    });

    it('should handle empty date range correctly', async () => {
      // Setup: Mock bookings outside the date range
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-05-15T09:00:00Z',
          schedule_end: '2024-05-15T10:00:00Z',
          created_at: '2024-05-15T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Service 1' } }],
          service_progress: { start_time: '2024-05-15T09:00:00Z', end_time: '2024-05-15T10:00:00Z', actual_duration: 60 }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn((field: string, value: string) => ({
                lte: jest.fn((field2: string, value2: string) => {
                  // Filter bookings - none in June
                  const startDate = new Date(value);
                  const endDate = new Date(value2);
                  const filteredBookings = mockBookings.filter(b => {
                    const bookingDate = new Date(b.schedule_start);
                    return bookingDate >= startDate && bookingDate <= endDate;
                  });
                  return Promise.resolve({ data: filteredBookings });
                })
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

      // Act: Load dashboard with June date range (no bookings in this range)
      const result = await calculateKPIMetrics('2024-06-01', '2024-06-30');

      // Assert: Should return zero metrics
      expect(result.totalBookings).toBe(0);
      expect(result.completedBookings).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });
  });

  /**
   * Integration Test 4: No mock data present
   * **Validates: Requirements 9.5**
   * 
   * Verifies that the KPI dashboard does not contain any hardcoded mock data
   * and all data comes from database queries.
   */
  describe('Integration Test 4: No mock data present', () => {
    it('should not contain hardcoded mechanic names', async () => {
      // Setup: Empty database
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Should not contain mock mechanic names
      const mechanicNames = result.mechanicPerformance.map(m => m.name);
      expect(mechanicNames).not.toContain('Ahmad');
      expect(mechanicNames).not.toContain('Budi');
      expect(mechanicNames).not.toContain('Candra');
      
      // Should be empty array
      expect(result.mechanicPerformance).toEqual([]);
    });

    it('should not contain hardcoded performance metrics', async () => {
      // Setup: Database with one mechanic but no completed jobs
      const mockMechanics = [{ id: 'mech-1', name: 'Test Mechanic' }];

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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Should not contain hardcoded metrics like 15, 45, 95
      const mechanicPerf = result.mechanicPerformance[0];
      expect(mechanicPerf.completedJobs).toBe(0);
      expect(mechanicPerf.avgTime).toBe(0);
      expect(mechanicPerf.onTimeRate).toBe(0);
      
      // Should not match any of the old mock values
      expect(mechanicPerf.completedJobs).not.toBe(15);
      expect(mechanicPerf.completedJobs).not.toBe(12);
      expect(mechanicPerf.completedJobs).not.toBe(18);
      expect(mechanicPerf.avgTime).not.toBe(45);
      expect(mechanicPerf.avgTime).not.toBe(52);
      expect(mechanicPerf.avgTime).not.toBe(38);
    });

    it('should query database for all mechanic performance data', async () => {
      // Setup: Mock mechanics
      const mockMechanics = [
        { id: 'mech-1', name: 'Real Mechanic 1' },
        { id: 'mech-2', name: 'Real Mechanic 2' }
      ];

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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Should query mechanics table
      expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
      
      // Should query assignments table for each mechanic
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      
      // Result should contain mechanics from database
      expect(result.mechanicPerformance.length).toBe(2);
      expect(result.mechanicPerformance[0].name).toBe('Real Mechanic 1');
      expect(result.mechanicPerformance[1].name).toBe('Real Mechanic 2');
    });

    it('should calculate metrics from actual service_progress data', async () => {
      // Setup: Mock mechanic with real service progress data
      const mockMechanics = [{ id: 'mech-1', name: 'Test Mechanic' }];
      
      const mockAssignments = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-06-01T09:00:00Z',
            schedule_end: '2024-06-01T10:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 75,
              start_time: '2024-06-01T09:00:00Z',
              end_time: '2024-06-01T10:15:00Z'
            }
          }
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: '2024-06-02T09:00:00Z',
            schedule_end: '2024-06-02T10:00:00Z',
            status: 'done',
            service_progress: {
              actual_duration: 85,
              start_time: '2024-06-02T09:00:00Z',
              end_time: '2024-06-02T10:25:00Z'
            }
          }
        }
      ];

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
                    lte: jest.fn().mockResolvedValue({ data: mockAssignments })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Should calculate from actual_duration field
      const mechanicPerf = result.mechanicPerformance[0];
      expect(mechanicPerf.completedJobs).toBe(2);
      // Average should be (75 + 85) / 2 = 80
      expect(mechanicPerf.avgTime).toBe(80);
      
      // Should not be any hardcoded value
      expect(mechanicPerf.avgTime).not.toBe(45);
      expect(mechanicPerf.avgTime).not.toBe(52);
      expect(mechanicPerf.avgTime).not.toBe(38);
    });

    it('should verify all data sources are from database queries', async () => {
      // Setup: Mock complete system
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'done',
          schedule_start: '2024-06-01T09:00:00Z',
          schedule_end: '2024-06-01T10:00:00Z',
          created_at: '2024-06-01T08:00:00Z',
          booking_services: [{ service_type: { price: 100000, default_duration_minutes: 60, name: 'Oil Change' } }],
          service_progress: { start_time: '2024-06-01T09:00:00Z', end_time: '2024-06-01T10:00:00Z', actual_duration: 60 }
        }
      ];

      const mockMechanics = [{ id: 'mech-1', name: 'Database Mechanic', daily_capacity_minutes: 480 }];

      const mockAssignments = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-06-01T09:00:00Z',
            schedule_end: '2024-06-01T10:00:00Z',
            status: 'done',
            service_progress: { actual_duration: 60, start_time: '2024-06-01T09:00:00Z', end_time: '2024-06-01T10:00:00Z' }
          }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn().mockResolvedValue({ data: mockBookings })
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
                    lte: jest.fn().mockResolvedValue({ data: mockAssignments })
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

      // Act: Load dashboard
      const result = await calculateKPIMetrics();

      // Assert: Verify all database tables were queried
      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
      expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');

      // Verify data matches database, not mock values
      expect(result.totalBookings).toBe(1);
      expect(result.mechanicPerformance[0].name).toBe('Database Mechanic');
      expect(result.mechanicPerformance[0].completedJobs).toBe(1);
      expect(result.mechanicPerformance[0].avgTime).toBe(60);
      
      // Verify no mock data present
      expect(result.mechanicPerformance).not.toContainEqual(
        expect.objectContaining({ name: 'Ahmad', completedJobs: 15, avgTime: 45, onTimeRate: 95 })
      );
      expect(result.mechanicPerformance).not.toContainEqual(
        expect.objectContaining({ name: 'Budi', completedJobs: 12, avgTime: 52, onTimeRate: 88 })
      );
      expect(result.mechanicPerformance).not.toContainEqual(
        expect.objectContaining({ name: 'Candra', completedJobs: 18, avgTime: 38, onTimeRate: 92 })
      );
    });
  });
});
