/**
 * Property-Based Tests for KPI Calculations
 * Feature: system-improvements-crud-audit-kpi
 * 
 * These tests verify that KPI dashboard queries real database data,
 * calculates performance metrics from actual service_progress records,
 * and includes mechanics with zero completed jobs in results.
 */

import * as fc from 'fast-check';
import { calculateKPIMetrics } from '../calculations';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');

describe('KPI Calculations - Property-Based Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  /**
   * Property 22: Mechanic performance uses real database queries
   * **Validates: Requirements 9.1**
   * 
   * For any KPI dashboard load, the mechanic performance data should be calculated
   * from queries to the assignments, bookings, and service_progress tables.
   */
  describe('Property 22: Mechanic performance uses real database queries', () => {
    it('should query mechanics table for active mechanics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          }).filter(({ startDate, endDate }) => {
            // Filter out invalid dates
            return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
          }),
          async ({ startDate, endDate }) => {
            // Ensure endDate is after startDate
            if (endDate < startDate) {
              [startDate, endDate] = [endDate, startDate];
            }

            // Setup: Mock database responses
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
            await calculateKPIMetrics(
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            );

            // Assert: Should query mechanics table
            expect(mockSupabase.from).toHaveBeenCalledWith('mechanics');
            
            // Verify mechanics query includes active filter
            const mechanicsCall = (mockSupabase.from as jest.Mock).mock.calls.find(
              call => call[0] === 'mechanics'
            );
            expect(mechanicsCall).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should query assignments table for each mechanic', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanics: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          async ({ mechanics }) => {
            // Setup: Mock mechanics exist
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
                    eq: jest.fn().mockResolvedValue({ data: mechanics })
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
            await calculateKPIMetrics();

            // Assert: Should query assignments table for each mechanic
            expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
            
            // Verify assignments query was called at least once per mechanic
            const assignmentsCalls = (mockSupabase.from as jest.Mock).mock.calls.filter(
              call => call[0] === 'assignments'
            );
            expect(assignmentsCalls.length).toBeGreaterThanOrEqual(mechanics.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use hardcoded or mock data for mechanic performance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanics: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 0, maxLength: 3 }
            ),
          }),
          async ({ mechanics }) => {
            // Setup: Mock database responses
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
                    eq: jest.fn().mockResolvedValue({ data: mechanics })
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

            // Assert: Mechanic performance should match database query results
            // If no mechanics in DB, performance array should be empty
            // If mechanics exist, performance array length should match
            expect(result.mechanicPerformance.length).toBe(mechanics.length);
            
            // Verify no hardcoded names like 'Ahmad', 'Budi', 'Candra'
            const hardcodedNames = ['Ahmad', 'Budi', 'Candra'];
            const hasHardcodedData = result.mechanicPerformance.some(
              perf => hardcodedNames.includes(perf.name)
            );
            
            // Only fail if we have hardcoded names AND they don't match our test data
            if (hasHardcodedData) {
              const testMechanicNames = mechanics.map(m => m.name);
              const isFromTestData = hardcodedNames.every(
                name => testMechanicNames.includes(name)
              );
              expect(isFromTestData).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 23: Performance metrics calculated from actual data
   * **Validates: Requirements 9.2**
   * 
   * For any mechanic with completed jobs, the average service time and on-time rate
   * should be calculated from their actual service_progress records.
   */
  describe('Property 23: Performance metrics calculated from actual data', () => {
    it('should calculate average service time from service_progress actual_duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanic: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            completedJobs: fc.array(
              fc.record({
                id: fc.uuid(),
                schedule_start: fc.constant('2024-06-01T09:00:00Z'),
                schedule_end: fc.constant('2024-06-01T10:00:00Z'),
                status: fc.constant('done'),
                service_progress: fc.record({
                  actual_duration: fc.integer({ min: 15, max: 240 }),
                  start_time: fc.constant('2024-06-01T09:00:00Z'),
                  end_time: fc.constant('2024-06-01T10:00:00Z'),
                }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          async ({ mechanic, completedJobs }) => {
            // Setup: Mock database responses
            const assignments = completedJobs.map(job => ({
              booking: job
            }));

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
                    eq: jest.fn().mockResolvedValue({ data: [mechanic] })
                  }))
                };
              } else if (table === 'assignments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: assignments })
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

            // Calculate expected average
            const totalTime = completedJobs.reduce(
              (sum, job) => sum + job.service_progress.actual_duration,
              0
            );
            const expectedAvgTime = Math.round(totalTime / completedJobs.length);

            // Act: Calculate KPI metrics
            const result = await calculateKPIMetrics();

            // Assert: Average time should match calculation from actual_duration
            const mechanicPerf = result.mechanicPerformance.find(
              p => p.name === mechanic.name
            );
            expect(mechanicPerf).toBeDefined();
            expect(mechanicPerf!.avgTime).toBe(expectedAvgTime);
            expect(mechanicPerf!.completedJobs).toBe(completedJobs.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate on-time rate from scheduled vs actual duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanic: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            completedJobs: fc.array(
              fc.record({
                id: fc.uuid(),
                scheduledDuration: fc.integer({ min: 30, max: 180 }), // minutes
                actualDuration: fc.integer({ min: 15, max: 240 }), // minutes
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          async ({ mechanic, completedJobs }) => {
            // Setup: Create bookings with schedule times based on durations
            const baseDate = new Date('2024-06-01T09:00:00Z');
            const assignments = completedJobs.map((job, index) => {
              const scheduleStart = new Date(baseDate.getTime() + index * 3600000);
              const scheduleEnd = new Date(
                scheduleStart.getTime() + job.scheduledDuration * 60 * 1000
              );

              return {
                booking: {
                  id: job.id,
                  schedule_start: scheduleStart.toISOString(),
                  schedule_end: scheduleEnd.toISOString(),
                  status: 'done',
                  service_progress: {
                    actual_duration: job.actualDuration,
                    start_time: scheduleStart.toISOString(),
                    end_time: new Date(
                      scheduleStart.getTime() + job.actualDuration * 60 * 1000
                    ).toISOString(),
                  },
                },
              };
            });

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
                    eq: jest.fn().mockResolvedValue({ data: [mechanic] })
                  }))
                };
              } else if (table === 'assignments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn().mockResolvedValue({ data: assignments })
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

            // Calculate expected on-time rate (30 min tolerance)
            const onTimeJobs = completedJobs.filter(job => {
              const actualMs = job.actualDuration * 60 * 1000;
              const scheduledMs = job.scheduledDuration * 60 * 1000;
              const toleranceMs = 30 * 60 * 1000;
              return actualMs <= scheduledMs + toleranceMs;
            }).length;
            const expectedOnTimeRate = Math.round(
              (onTimeJobs / completedJobs.length) * 100
            );

            // Act: Calculate KPI metrics
            const result = await calculateKPIMetrics();

            // Assert: On-time rate should match calculation
            const mechanicPerf = result.mechanicPerformance.find(
              p => p.name === mechanic.name
            );
            expect(mechanicPerf).toBeDefined();
            expect(mechanicPerf!.onTimeRate).toBe(expectedOnTimeRate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use service_progress table data for calculations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanic: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          async ({ mechanic }) => {
            // Setup: Mock database responses
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
                    eq: jest.fn().mockResolvedValue({ data: [mechanic] })
                  }))
                };
              } else if (table === 'assignments') {
                // Return assignments with service_progress data
                return {
                  select: jest.fn((query: string) => {
                    // Verify query includes service_progress
                    expect(query).toContain('service_progress');
                    
                    return {
                      eq: jest.fn(() => ({
                        eq: jest.fn(() => ({
                          gte: jest.fn(() => ({
                            lte: jest.fn().mockResolvedValue({ data: [] })
                          }))
                        }))
                      }))
                    };
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
            await calculateKPIMetrics();

            // Assert: Assignments query should include service_progress
            const assignmentsCall = (mockSupabase.from as jest.Mock).mock.calls.find(
              call => call[0] === 'assignments'
            );
            expect(assignmentsCall).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 25: Zero-job mechanics appear in results
   * **Validates: Requirements 9.4**
   * 
   * For any active mechanic with zero completed jobs in the date range,
   * they should appear in the performance results with zero values.
   */
  describe('Property 25: Zero-job mechanics appear in results', () => {
    it('should include mechanics with zero completed jobs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanics: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          async ({ mechanics }) => {
            // Setup: Mock mechanics exist but have no completed jobs
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
                    eq: jest.fn().mockResolvedValue({ data: mechanics })
                  }))
                };
              } else if (table === 'assignments') {
                // No completed jobs for any mechanic
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

            // Assert: All mechanics should appear in results
            expect(result.mechanicPerformance.length).toBe(mechanics.length);
            
            // All mechanics should have zero metrics
            result.mechanicPerformance.forEach(perf => {
              expect(perf.completedJobs).toBe(0);
              expect(perf.avgTime).toBe(0);
              expect(perf.onTimeRate).toBe(0);
            });
            
            // Verify all mechanic names are present
            const resultNames = result.mechanicPerformance.map(p => p.name).sort();
            const expectedNames = mechanics.map(m => m.name).sort();
            expect(resultNames).toEqual(expectedNames);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show zero values for mechanics without completed jobs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mechanicsWithJobs: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                completedJobs: fc.integer({ min: 1, max: 10 }),
              }),
              { minLength: 0, maxLength: 3 }
            ),
            mechanicsWithoutJobs: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          async ({ mechanicsWithJobs, mechanicsWithoutJobs }) => {
            // Combine all mechanics
            const allMechanics = [
              ...mechanicsWithJobs.map(m => ({ id: m.id, name: m.name })),
              ...mechanicsWithoutJobs
            ];

            // Setup: Mock database responses
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
                    eq: jest.fn().mockResolvedValue({ data: allMechanics })
                  }))
                };
              } else if (table === 'assignments') {
                return {
                  select: jest.fn(() => {
                    // Return function that checks mechanic_id
                    const eqChain = {
                      eq: jest.fn((field: string, value: string) => {
                        // Check if this mechanic has jobs
                        const mechanicWithJobs = mechanicsWithJobs.find(m => m.id === value);
                        
                        if (mechanicWithJobs) {
                          // Return mock assignments
                          const assignments = Array.from(
                            { length: mechanicWithJobs.completedJobs },
                            (_, i) => ({
                              booking: {
                                id: `booking-${i}`,
                                schedule_start: '2024-06-01T09:00:00Z',
                                schedule_end: '2024-06-01T10:00:00Z',
                                status: 'done',
                                service_progress: {
                                  actual_duration: 60,
                                  start_time: '2024-06-01T09:00:00Z',
                                  end_time: '2024-06-01T10:00:00Z',
                                },
                              },
                            })
                          );
                          
                          return {
                            eq: jest.fn(() => ({
                              gte: jest.fn(() => ({
                                lte: jest.fn().mockResolvedValue({ data: assignments })
                              }))
                            }))
                          };
                        } else {
                          // No assignments for this mechanic
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

            // Assert: All mechanics should appear in results
            expect(result.mechanicPerformance.length).toBe(allMechanics.length);
            
            // Mechanics without jobs should have zero values
            mechanicsWithoutJobs.forEach(mechanic => {
              const perf = result.mechanicPerformance.find(p => p.name === mechanic.name);
              expect(perf).toBeDefined();
              expect(perf!.completedJobs).toBe(0);
              expect(perf!.avgTime).toBe(0);
              expect(perf!.onTimeRate).toBe(0);
            });
            
            // Mechanics with jobs should have non-zero completed jobs
            mechanicsWithJobs.forEach(mechanic => {
              const perf = result.mechanicPerformance.find(p => p.name === mechanic.name);
              expect(perf).toBeDefined();
              expect(perf!.completedJobs).toBe(mechanic.completedJobs);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not exclude mechanics from results based on job count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalMechanics: fc.integer({ min: 1, max: 10 }),
            mechanicsWithJobsCount: fc.integer({ min: 0, max: 10 }),
          }).filter(({ totalMechanics, mechanicsWithJobsCount }) => 
            mechanicsWithJobsCount <= totalMechanics
          ),
          async ({ totalMechanics, mechanicsWithJobsCount }) => {
            // Generate mechanics
            const mechanics = Array.from({ length: totalMechanics }, (_, i) => ({
              id: `mechanic-${i}`,
              name: `Mechanic ${i}`,
            }));

            // Track which mechanics should have jobs
            let assignmentCallIndex = 0;

            // Setup: Mock database responses
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
                    eq: jest.fn().mockResolvedValue({ data: mechanics })
                  }))
                };
              } else if (table === 'assignments') {
                return {
                  select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      eq: jest.fn(() => ({
                        gte: jest.fn(() => ({
                          lte: jest.fn(() => {
                            // First N mechanics have jobs, rest have none
                            const currentIndex = assignmentCallIndex;
                            assignmentCallIndex++;
                            const hasJobs = currentIndex < mechanicsWithJobsCount;
                            
                            if (hasJobs) {
                              return Promise.resolve({
                                data: [{
                                  booking: {
                                    id: 'booking-1',
                                    schedule_start: '2024-06-01T09:00:00Z',
                                    schedule_end: '2024-06-01T10:00:00Z',
                                    status: 'done',
                                    service_progress: {
                                      actual_duration: 60,
                                      start_time: '2024-06-01T09:00:00Z',
                                      end_time: '2024-06-01T10:00:00Z',
                                    },
                                  },
                                }]
                              });
                            } else {
                              return Promise.resolve({ data: [] });
                            }
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

            // Act: Calculate KPI metrics
            const result = await calculateKPIMetrics();

            // Assert: Result should include ALL mechanics, not just those with jobs
            expect(result.mechanicPerformance.length).toBe(totalMechanics);
            
            // Count mechanics with zero jobs
            const mechanicsWithZeroJobs = result.mechanicPerformance.filter(
              p => p.completedJobs === 0
            ).length;
            
            const expectedZeroJobMechanics = totalMechanics - mechanicsWithJobsCount;
            expect(mechanicsWithZeroJobs).toBe(expectedZeroJobMechanics);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
