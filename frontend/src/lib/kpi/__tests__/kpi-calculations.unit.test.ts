/**
 * Unit Tests for KPI Calculations - Edge Cases
 * Feature: system-improvements-crud-audit-kpi
 * Task: 13.4 Write unit tests for KPI edge cases
 * 
 * These tests verify that KPI calculations handle edge cases gracefully:
 * - Zero mechanics in system
 * - Mechanics with zero completed jobs
 * - Empty date range
 * - Missing service_progress records
 * 
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */

import { calculateKPIMetrics } from '../calculations';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');

describe('KPI Calculations - Unit Tests (Edge Cases)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Edge Case 1: Zero mechanics in system
   * **Validates: Requirements 9.3, 9.4**
   * 
   * When there are no mechanics in the system, the KPI dashboard should:
   * - Return an empty mechanic performance array
   * - Not crash or throw errors
   * - Still calculate other KPI metrics correctly
   */
  describe('Edge Case: Zero mechanics in system', () => {
    it('should return empty mechanic performance array when no mechanics exist', async () => {
      // Setup: Mock database with no mechanics
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
          // No mechanics in system
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should return empty mechanic performance array
      expect(result.mechanicPerformance).toBeDefined();
      expect(result.mechanicPerformance).toEqual([]);
      expect(result.mechanicPerformance.length).toBe(0);
    });

    it('should not crash when calculating metrics with zero mechanics', async () => {
      // Setup: Mock database with no mechanics
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

      // Act & Assert: Should not throw error
      await expect(calculateKPIMetrics()).resolves.toBeDefined();
    });

    it('should still calculate other KPI metrics when no mechanics exist', async () => {
      // Setup: Mock database with bookings but no mechanics
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
                price: 100,
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Other metrics should still be calculated
      expect(result.totalBookings).toBe(1);
      expect(result.completedBookings).toBe(1);
      expect(result.totalRevenue).toBe(100);
      expect(result.mechanicPerformance).toEqual([]);
    });
  });

  /**
   * Edge Case 2: Mechanics with zero completed jobs
   * **Validates: Requirements 9.3, 9.4**
   * 
   * When mechanics exist but have no completed jobs, they should:
   * - Appear in the mechanic performance array
   * - Show zero values for all metrics (completedJobs, avgTime, onTimeRate)
   * - Not be excluded from results
   */
  describe('Edge Case: Mechanics with zero completed jobs', () => {
    it('should show mechanics with zero completed jobs in results', async () => {
      // Setup: Mock mechanics with no completed jobs
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' },
        { id: 'mech-3', name: 'Candra' }
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
          // No assignments for any mechanic
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: All mechanics should appear with zero metrics
      expect(result.mechanicPerformance.length).toBe(3);
      
      result.mechanicPerformance.forEach(perf => {
        expect(perf.completedJobs).toBe(0);
        expect(perf.avgTime).toBe(0);
        expect(perf.onTimeRate).toBe(0);
      });

      // Verify all mechanic names are present
      const resultNames = result.mechanicPerformance.map(p => p.name).sort();
      expect(resultNames).toEqual(['Ahmad', 'Budi', 'Candra']);
    });

    it('should handle mix of mechanics with and without completed jobs', async () => {
      // Setup: Some mechanics have jobs, others don't
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' },
        { id: 'mech-3', name: 'Candra' }
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
                  // Only mech-1 has completed jobs
                  if (value === 'mech-1') {
                    return {
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({
                            data: [
                              {
                                booking: {
                                  id: 'booking-1',
                                  schedule_start: '2024-06-01T09:00:00Z',
                                  schedule_end: '2024-06-01T10:00:00Z',
                                  status: 'done',
                                  service_progress: {
                                    actual_duration: 60,
                                    start_time: '2024-06-01T09:00:00Z',
                                    end_time: '2024-06-01T10:00:00Z'
                                  }
                                }
                              }
                            ]
                          })
                        }))
                      }))
                    };
                  } else {
                    // mech-2 and mech-3 have no jobs
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: All mechanics should appear
      expect(result.mechanicPerformance.length).toBe(3);

      // Ahmad should have 1 completed job
      const ahmadPerf = result.mechanicPerformance.find(p => p.name === 'Ahmad');
      expect(ahmadPerf).toBeDefined();
      expect(ahmadPerf!.completedJobs).toBe(1);
      expect(ahmadPerf!.avgTime).toBe(60);

      // Budi and Candra should have zero jobs
      const budiPerf = result.mechanicPerformance.find(p => p.name === 'Budi');
      expect(budiPerf).toBeDefined();
      expect(budiPerf!.completedJobs).toBe(0);
      expect(budiPerf!.avgTime).toBe(0);
      expect(budiPerf!.onTimeRate).toBe(0);

      const candraPerf = result.mechanicPerformance.find(p => p.name === 'Candra');
      expect(candraPerf).toBeDefined();
      expect(candraPerf!.completedJobs).toBe(0);
      expect(candraPerf!.avgTime).toBe(0);
      expect(candraPerf!.onTimeRate).toBe(0);
    });

    it('should not exclude mechanics based on job count', async () => {
      // Setup: Multiple mechanics with varying job counts (including zero)
      const mockMechanics = [
        { id: 'mech-1', name: 'Mechanic A' },
        { id: 'mech-2', name: 'Mechanic B' },
        { id: 'mech-3', name: 'Mechanic C' },
        { id: 'mech-4', name: 'Mechanic D' }
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: All 4 mechanics should appear in results
      expect(result.mechanicPerformance.length).toBe(4);
      
      // Verify all mechanic names are present
      const resultNames = result.mechanicPerformance.map(p => p.name).sort();
      const expectedNames = mockMechanics.map(m => m.name).sort();
      expect(resultNames).toEqual(expectedNames);
    });
  });

  /**
   * Edge Case 3: Empty date range
   * **Validates: Requirements 9.3, 9.5**
   * 
   * When the date range contains no bookings, the system should:
   * - Return zero for booking counts
   * - Return zero for revenue metrics
   * - Still show all mechanics with zero metrics
   * - Not crash or throw errors
   */
  describe('Edge Case: Empty date range', () => {
    it('should handle date range with no bookings', async () => {
      // Setup: Mechanics exist but no bookings in date range
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          // No bookings in date range
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

      // Act: Calculate KPI metrics for empty date range
      const result = await calculateKPIMetrics('2024-01-01', '2024-01-02');

      // Assert: Should return zero metrics
      expect(result.totalBookings).toBe(0);
      expect(result.completedBookings).toBe(0);
      expect(result.cancelledBookings).toBe(0);
      expect(result.pendingBookings).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageBookingValue).toBe(0);
      
      // Mechanics should still appear with zero metrics
      expect(result.mechanicPerformance.length).toBe(2);
      result.mechanicPerformance.forEach(perf => {
        expect(perf.completedJobs).toBe(0);
        expect(perf.avgTime).toBe(0);
        expect(perf.onTimeRate).toBe(0);
      });
    });

    it('should not crash with same start and end date', async () => {
      // Setup: Mock empty database
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

      // Act & Assert: Should not throw error
      const sameDate = '2024-06-01';
      await expect(
        calculateKPIMetrics(sameDate, sameDate)
      ).resolves.toBeDefined();
    });

    it('should handle future date range with no bookings yet', async () => {
      // Setup: Mock mechanics but no future bookings
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

      // Act: Calculate KPI metrics for future date range
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 30);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 60);

      const result = await calculateKPIMetrics(
        futureStart.toISOString().split('T')[0],
        futureEnd.toISOString().split('T')[0]
      );

      // Assert: Should return zero metrics gracefully
      expect(result.totalBookings).toBe(0);
      expect(result.mechanicPerformance.length).toBe(1);
      expect(result.mechanicPerformance[0].completedJobs).toBe(0);
    });
  });

  /**
   * Edge Case 4: Missing service_progress records
   * **Validates: Requirements 9.3, 9.5**
   * 
   * When bookings are marked as 'done' but have no service_progress records:
   * - Should not crash or throw errors
   * - Should handle null/undefined service_progress gracefully
   * - Should exclude bookings without progress from average calculations
   * - Should still count completed bookings correctly
   */
  describe('Edge Case: Missing service_progress records', () => {
    it('should handle bookings with null service_progress', async () => {
      // Setup: Bookings marked as done but no service_progress
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
                price: 100,
                default_duration_minutes: 60,
                name: 'Oil Change'
              }
            }
          ],
          service_progress: null // Missing service_progress
        },
        {
          id: 'booking-2',
          status: 'done',
          schedule_start: '2024-06-02T09:00:00Z',
          schedule_end: '2024-06-02T10:00:00Z',
          created_at: '2024-06-02T08:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 150,
                default_duration_minutes: 90,
                name: 'Tire Change'
              }
            }
          ],
          service_progress: null // Missing service_progress
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should not crash and handle gracefully
      expect(result).toBeDefined();
      expect(result.totalBookings).toBe(2);
      expect(result.completedBookings).toBe(2);
      
      // Average service time should be 0 since no valid progress records
      expect(result.averageServiceTime).toBe(0);
      
      // Revenue should still be calculated from booking_services
      expect(result.totalRevenue).toBe(250);
    });

    it('should handle mix of bookings with and without service_progress', async () => {
      // Setup: Some bookings have progress, others don't
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
                price: 100,
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
          status: 'done',
          schedule_start: '2024-06-02T09:00:00Z',
          schedule_end: '2024-06-02T10:00:00Z',
          created_at: '2024-06-02T08:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 150,
                default_duration_minutes: 90,
                name: 'Tire Change'
              }
            }
          ],
          service_progress: null // Missing
        },
        {
          id: 'booking-3',
          status: 'done',
          schedule_start: '2024-06-03T09:00:00Z',
          schedule_end: '2024-06-03T10:30:00Z',
          created_at: '2024-06-03T08:00:00Z',
          booking_services: [
            {
              service_type: {
                price: 200,
                default_duration_minutes: 90,
                name: 'Full Service'
              }
            }
          ],
          service_progress: {
            start_time: '2024-06-03T09:00:00Z',
            end_time: '2024-06-03T10:30:00Z',
            actual_duration: 90
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should calculate average from only valid progress records
      expect(result.totalBookings).toBe(3);
      expect(result.completedBookings).toBe(3);
      
      // Average should be (60 + 90) / 2 = 75 (only counting bookings with progress)
      expect(result.averageServiceTime).toBe(75);
      
      // Revenue should include all bookings
      expect(result.totalRevenue).toBe(450);
    });

    it('should handle service_progress with zero actual_duration', async () => {
      // Setup: Booking with service_progress but actual_duration is 0
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
                price: 100,
                default_duration_minutes: 60,
                name: 'Oil Change'
              }
            }
          ],
          service_progress: {
            start_time: '2024-06-01T09:00:00Z',
            end_time: '2024-06-01T09:00:00Z',
            actual_duration: 0 // Zero duration
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should handle zero duration gracefully
      expect(result).toBeDefined();
      expect(result.completedBookings).toBe(1);
      // Zero duration should be excluded from average calculation
      expect(result.averageServiceTime).toBe(0);
    });

    it('should handle mechanic performance with missing service_progress', async () => {
      // Setup: Mechanic with completed bookings but no service_progress
      const mockMechanics = [{ id: 'mech-1', name: 'Ahmad' }];

      const mockAssignments = [
        {
          booking: {
            id: 'booking-1',
            schedule_start: '2024-06-01T09:00:00Z',
            schedule_end: '2024-06-01T10:00:00Z',
            status: 'done',
            service_progress: null // Missing
          }
        },
        {
          booking: {
            id: 'booking-2',
            schedule_start: '2024-06-02T09:00:00Z',
            schedule_end: '2024-06-02T10:00:00Z',
            status: 'done',
            service_progress: null // Missing
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Mechanic should appear with completed jobs but zero avg time
      expect(result.mechanicPerformance.length).toBe(1);
      const mechanicPerf = result.mechanicPerformance[0];
      expect(mechanicPerf.name).toBe('Ahmad');
      expect(mechanicPerf.completedJobs).toBe(2);
      expect(mechanicPerf.avgTime).toBe(0); // No valid progress data
      expect(mechanicPerf.onTimeRate).toBe(0); // Can't calculate without progress
    });
  });

  /**
   * Additional Edge Cases: Combined scenarios
   * **Validates: Requirements 9.3, 9.4, 9.5**
   */
  describe('Edge Case: Combined scenarios', () => {
    it('should handle system with no mechanics and no bookings', async () => {
      // Setup: Completely empty system
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should return all zero metrics without crashing
      expect(result).toBeDefined();
      expect(result.totalBookings).toBe(0);
      expect(result.completedBookings).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.mechanicPerformance).toEqual([]);
      expect(result.averageServiceTime).toBe(0);
      expect(result.mechanicUtilization).toBe(0);
    });

    it('should handle all mechanics with zero jobs in empty date range', async () => {
      // Setup: Mechanics exist but date range is empty
      const mockMechanics = [
        { id: 'mech-1', name: 'Ahmad' },
        { id: 'mech-2', name: 'Budi' }
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics('2024-01-01', '2024-01-02');

      // Assert: All mechanics should appear with zero metrics
      expect(result.mechanicPerformance.length).toBe(2);
      expect(result.totalBookings).toBe(0);
      
      result.mechanicPerformance.forEach(perf => {
        expect(perf.completedJobs).toBe(0);
        expect(perf.avgTime).toBe(0);
        expect(perf.onTimeRate).toBe(0);
      });
    });

    it('should handle bookings without service_progress in empty mechanic system', async () => {
      // Setup: Bookings exist but no mechanics
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
                price: 100,
                default_duration_minutes: 60,
                name: 'Oil Change'
              }
            }
          ],
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

      // Act: Calculate KPI metrics
      const result = await calculateKPIMetrics();

      // Assert: Should handle gracefully
      expect(result.totalBookings).toBe(1);
      expect(result.completedBookings).toBe(1);
      expect(result.mechanicPerformance).toEqual([]);
      expect(result.averageServiceTime).toBe(0);
      expect(result.totalRevenue).toBe(100);
    });
  });
});
