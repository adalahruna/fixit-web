# Implementation Plan: KPI Revenue and Quality Enhancements

## Overview

This implementation plan converts the KPI Revenue and Quality Enhancements design into actionable coding tasks. The feature replaces placeholder KPI calculations with real database-driven calculations, implements comprehensive revenue analytics, and adds quality metrics including reschedule rate, wait time, cancellation analysis, and first-time fix rate.

## Tasks

- [ ] 1. Set up core infrastructure and interfaces
  - Create `frontend/src/lib/kpi/revenue-calculator.ts` with RevenueMetrics interface
  - Create `frontend/src/lib/kpi/quality-metrics.ts` with QualityMetrics interface
  - Update `frontend/src/lib/kpi/calculations.ts` to extend KPIMetrics interface with new revenue and quality fields
  - Add TypeScript type definitions for all new interfaces
  - _Requirements: 1.1, 1.2, 1.3, 7.1, 8.1, 9.1, 10.1_

- [ ] 2. Implement Revenue Calculator core functions
  - [ ] 2.1 Implement basic revenue calculation functions
    - Write `calculateTotalRevenue()` function to sum service prices from 'done' bookings
    - Write `calculateAverageBookingValue()` function excluding cancelled bookings
    - Write `calculateRevenuePerCompletedBooking()` function
    - Implement date range filtering logic with timezone handling
    - Handle NULL prices (treat as 0) and bookings without services
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_
  
  - [ ]* 2.2 Write property test for revenue calculation correctness
    - **Property 1: Revenue Calculation Correctness**
    - **Validates: Requirements 1.1, 1.7, 1.9, 1.10**
  
  - [ ]* 2.3 Write property test for average booking value
    - **Property 2: Average Booking Value Calculation**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.4 Write property test for revenue per completed booking
    - **Property 3: Revenue Per Completed Booking**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.5 Write property test for date range filtering
    - **Property 4: Date Range Filtering**
    - **Validates: Requirements 1.5, 2.1, 3.1**

- [ ] 3. Implement revenue trend analysis functions
  - [ ] 3.1 Implement daily and monthly revenue aggregation
    - Write `calculateDailyRevenue()` function to aggregate revenue by date
    - Write `calculateMonthlyRevenue()` function to aggregate revenue by month (YYYY-MM format)
    - Handle date ranges with no bookings (return zero revenue)
    - Format dates consistently in ISO 8601 format
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 3.2 Write property test for daily revenue aggregation
    - **Property 5: Daily Revenue Aggregation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6**
  
  - [ ]* 3.3 Write property test for monthly revenue aggregation
    - **Property 6: Monthly Revenue Aggregation**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 4. Implement growth rate calculations
  - [ ] 4.1 Implement period-over-period growth rate calculator
    - Write `calculateGrowthRate()` function with formula: ((current - previous) / previous) * 100
    - Define daily, weekly, and monthly period boundaries with timezone handling
    - Handle edge cases: zero previous revenue (return null with "insufficient data")
    - Handle negative previous revenue (return null with "invalid baseline")
    - Handle missing data (return null with "data unavailable")
    - Round growth rate to 2 decimal places
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14_
  
  - [ ]* 4.2 Write property test for growth rate calculation
    - **Property 7: Growth Rate Calculation**
    - **Validates: Requirements 4.5, 4.6, 4.7, 4.8**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement revenue breakdown functions
  - [ ] 6.1 Implement service type revenue breakdown
    - Write `calculateRevenueByServiceType()` function
    - Aggregate revenue by service type from booking_services
    - Calculate percentage contribution for each service type
    - Sort results by revenue in descending order
    - Handle bookings with multiple services (attribute each to its type)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 6.2 Write property test for service type revenue aggregation
    - **Property 8: Service Type Revenue Aggregation**
    - **Validates: Requirements 5.1, 5.2, 5.6**
  
  - [ ]* 6.3 Write property test for service type percentage calculation
    - **Property 9: Service Type Percentage Calculation**
    - **Validates: Requirements 5.3**
  
  - [ ] 6.4 Implement mechanic revenue analysis
    - Write `calculateRevenueByMechanic()` function
    - Sum revenue from completed bookings assigned to each mechanic
    - Sort results by revenue in descending order
    - Include only active mechanics (is_active = true)
    - Handle mechanics with no completed bookings (return 0.00)
    - Implement overflow protection (max 999,999,999.99)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [ ]* 6.5 Write property test for mechanic revenue attribution
    - **Property 10: Mechanic Revenue Attribution**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6, 6.8**

- [ ] 7. Implement Quality Metrics Engine core functions
  - [ ] 7.1 Implement reschedule rate calculation
    - Write `calculateRescheduleRate()` function
    - Query audit_logs table for action='reschedule_booking' events
    - Calculate rate as (rescheduled_count / total_bookings) * 100
    - Handle zero reschedules (return 0%)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 7.2 Write property test for reschedule rate calculation
    - **Property 11: Reschedule Rate Calculation**
    - **Validates: Requirements 7.2, 7.3, 7.5**
  
  - [ ] 7.3 Implement wait time calculation
    - Write `calculateAverageWaitTime()` function
    - Calculate wait time as minutes between booking created_at and service_progress start_time
    - Filter to completed bookings in last 30 days
    - Exclude bookings without service_progress records
    - Exclude bookings where start_time is before created_at
    - Round average to 1 decimal place
    - Return null when no valid data exists
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_
  
  - [ ]* 7.4 Write property test for wait time calculation
    - **Property 12: Wait Time Calculation**
    - **Validates: Requirements 8.2, 8.4**
  
  - [ ]* 7.5 Write property test for average wait time aggregation
    - **Property 13: Average Wait Time Aggregation**
    - **Validates: Requirements 8.5, 8.6, 8.7**

- [ ] 8. Implement cancellation and quality analysis
  - [ ] 8.1 Implement cancellation rate and reason analysis
    - Write `calculateCancellationRate()` function
    - Calculate overall rate as (cancelled_count / total_bookings) * 100
    - Extract cancellation reasons from booking notes or audit_logs metadata
    - Group cancellations by reason and compute counts
    - Calculate percentage for each reason relative to total cancellations
    - Categorize missing reasons as "Unknown"
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 8.2 Write property test for cancellation rate calculation
    - **Property 14: Cancellation Rate Calculation**
    - **Validates: Requirements 9.2**
  
  - [ ]* 8.3 Write property test for cancellation reason grouping
    - **Property 15: Cancellation Reason Grouping**
    - **Validates: Requirements 9.4, 9.5**
  
  - [ ] 8.4 Implement first-time fix rate calculation
    - Write `calculateFirstTimeFixRate()` function
    - Group bookings by customer_id and vehicle_plate
    - Flag as rework if another booking exists for same vehicle within 7 days
    - Calculate rate as (bookings_without_rework / total_completed) * 100
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 8.5 Write property test for first-time fix rate calculation
    - **Property 16: First-Time Fix Rate Calculation**
    - **Validates: Requirements 10.2, 10.3, 10.5**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement peak hours and utilization analysis
  - [ ] 10.1 Implement peak hours with revenue correlation
    - Write `calculatePeakHoursRevenue()` function
    - Aggregate revenue and booking count for each hour (0-23)
    - Calculate average revenue per booking for each hour
    - Handle hours with zero bookings (set average to 0.00)
    - Attribute revenue based on schedule_start hour
    - Return top 3 hours ranked by total revenue
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ]* 10.2 Write property test for hourly revenue aggregation
    - **Property 17: Hourly Revenue Aggregation**
    - **Validates: Requirements 11.1, 11.6**
  
  - [ ]* 10.3 Write property test for hourly average revenue calculation
    - **Property 18: Hourly Average Revenue Calculation**
    - **Validates: Requirements 11.2, 11.3**
  
  - [ ]* 10.4 Write property test for peak hours ranking
    - **Property 19: Peak Hours Ranking**
    - **Validates: Requirements 11.4**
  
  - [ ] 10.5 Implement mechanic utilization by hour
    - Write `calculateMechanicUtilizationByHour()` function
    - Calculate total capacity per hour (active_mechanics * 60 minutes)
    - Calculate used capacity from service_progress actual_duration
    - Calculate utilization as (used / total) * 100
    - Handle hours with no active mechanics (return 0%)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ]* 10.6 Write property test for mechanic utilization calculation
    - **Property 20: Mechanic Utilization Calculation**
    - **Validates: Requirements 12.2, 12.3, 12.4, 12.7**

- [ ] 11. Implement Owner Dashboard enhancements
  - [ ] 11.1 Replace placeholder revenue with real calculations
    - Update Owner Dashboard to call Revenue Calculator
    - Replace placeholder calculation (completedBookings * 75000) with real revenue sum
    - Query booking_services joined with service_types for accurate prices
    - Filter bookings by last 30 days
    - Format revenue with IDR currency formatting
    - Handle bookings with multiple services
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 11.2 Add weekly revenue trend visualization
    - Write `calculateWeeklyRevenueTrend()` function for last 4 weeks
    - Define week as Monday 00:00:00 to Sunday 23:59:59 in WIB (UTC+7)
    - Sum payment amounts from completed bookings per week
    - Calculate 4-week growth rate: ((current_4week - previous_4week) / previous_4week) * 100
    - Round growth rate to 1 decimal place
    - Handle zero previous period (display "N/A")
    - Format revenue as "Rp" with thousand separators (dots, no decimals)
    - Display growth rate in green (positive) or red (negative)
    - Handle no data case with appropriate message
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_
  
  - [ ]* 11.3 Write property test for weekly revenue aggregation
    - **Property 21: Weekly Revenue Aggregation**
    - **Validates: Requirements 14.2, 14.3**
  
  - [ ]* 11.4 Write property test for weekly growth rate calculation
    - **Property 22: Weekly Growth Rate Calculation**
    - **Validates: Requirements 14.5, 14.6, 14.9**
  
  - [ ] 11.5 Add top performing service types display
    - Write function to get top 5 service types by revenue
    - Display revenue amount and booking count for each
    - Calculate and display percentage contribution to total revenue
    - Handle fewer than 5 service types (display all available)
    - Sort by revenue in descending order
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [ ]* 11.6 Write property test for top service types ranking
    - **Property 23: Top Service Types Ranking**
    - **Validates: Requirements 15.3, 15.6**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement date range filtering and UI integration
  - [ ] 13.1 Implement date range filtering for all metrics
    - Add date range validation function (ensure startDate < endDate)
    - Apply date range filter to all Revenue Calculator functions
    - Apply date range filter to all Quality Metrics Engine functions
    - Set default date range to last 30 days when not specified
    - Persist date range in URL query parameters
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_
  
  - [ ] 13.2 Update KPI Dashboard UI components
    - Add date range input fields (startDate and endDate) to dashboard
    - Update dashboard to call `calculateKPIMetrics()` with date range
    - Implement color coding for reschedule rate (green <5%, yellow 5-10%, red >10%)
    - Implement color coding for wait time (green <30min, yellow 30-60min, red >60min)
    - Implement color coding for first-time fix rate (green >90%, yellow 80-90%, red <80%)
    - Implement color coding for utilization (green 70-90%, yellow 50-70% or 90-100%, red <50% or >100%)
    - Display growth rate indicators (upward/downward/neutral)
    - Visually distinguish top 3 peak hours with colored border/background
    - Display "N/A" for null values (wait time, growth rate)
    - Display "No data available" messages for empty datasets
    - _Requirements: 7.6, 7.7, 8.8, 8.9, 8.10, 8.11, 9.6, 10.6, 10.7, 11.4, 11.5, 12.5, 12.6, 14.4, 14.7, 14.8, 16.3, 16.4, 16.6_

- [ ] 14. Implement database query optimization
  - [ ] 14.1 Create database indexes for KPI queries
    - Create index on bookings.created_at
    - Create index on service_progress.start_time
    - Create index on audit_logs.action
    - Verify existing indexes on bookings.schedule_start, bookings.status, assignments.mechanic_id
    - _Requirements: 17.1_
  
  - [ ] 14.2 Optimize database queries with joins and aggregation
    - Refactor queries to use single query with joins instead of multiple queries
    - Use Supabase select with nested joins for booking_services and service_types
    - Use database aggregation functions (SUM, AVG, COUNT) where possible
    - Implement connection pooling configuration
    - Add query result caching where appropriate
    - _Requirements: 17.2, 17.3, 17.5, 17.7_
  
  - [ ] 14.3 Implement performance monitoring
    - Add slow query logging for queries exceeding 1 second
    - Log query duration with context (query name, date range, duration)
    - Verify all KPI calculations complete within 3 seconds for 10k bookings
    - _Requirements: 17.4, 17.6_

- [ ] 15. Implement error handling and edge cases
  - [ ] 15.1 Add comprehensive error handling
    - Implement graceful degradation for database query errors (return defaults)
    - Add division by zero checks for all rate calculations
    - Filter and validate data before calculations (exclude invalid records)
    - Validate date range inputs (sanitize and ensure start < end)
    - Treat NULL prices as 0 in all revenue calculations
    - Implement overflow protection for mechanic revenue (max 999,999,999.99)
    - Add error logging for unexpected errors
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [ ] 15.2 Add data inconsistency logging
    - Log warnings when booking is 'done' but has no service_progress
    - Log warnings when mechanic has no assignments
    - Log warnings when service type has no bookings
    - _Requirements: 18.7_
  
  - [ ]* 15.3 Write unit tests for edge cases
    - Test empty datasets (no bookings)
    - Test NULL values in prices and timestamps
    - Test division by zero scenarios
    - Test date range validation
    - Test error handling paths

- [ ] 16. Final integration and testing
  - [ ] 16.1 Wire all components together
    - Update `frontend/src/lib/kpi/calculations.ts` to integrate Revenue Calculator and Quality Metrics Engine
    - Ensure `calculateKPIMetrics()` function returns complete KPIMetrics interface
    - Update Admin Dashboard page to use new KPI metrics
    - Update Owner Dashboard page to use new revenue calculations
    - Test all metrics display correctly in UI
    - _Requirements: All requirements_
  
  - [ ]* 16.2 Write integration tests
    - Test date range filtering across all metrics
    - Test UI rendering with real data
    - Test performance with 10k bookings dataset
    - Test all color coding and indicators
  
  - [ ] 16.3 Verify all requirements are met
    - Review all 18 requirements and verify implementation
    - Test all acceptance criteria
    - Verify all edge cases are handled
    - Confirm all property tests pass
    - Confirm all unit tests pass

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with Next.js and Supabase
- All revenue calculations use 2 decimal places for currency precision
- All date/time operations use system timezone (WIB/UTC+7)
- Database queries are optimized with indexes and joins for performance
- Error handling ensures graceful degradation with logging

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "14.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 10, "tasks": ["8.5", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3", "10.4", "10.5"] },
    { "id": 12, "tasks": ["10.6", "11.1"] },
    { "id": 13, "tasks": ["11.2"] },
    { "id": 14, "tasks": ["11.3", "11.4", "11.5"] },
    { "id": 15, "tasks": ["11.6", "13.1"] },
    { "id": 16, "tasks": ["13.2", "14.2"] },
    { "id": 17, "tasks": ["14.3", "15.1"] },
    { "id": 18, "tasks": ["15.2", "15.3"] },
    { "id": 19, "tasks": ["16.1"] },
    { "id": 20, "tasks": ["16.2", "16.3"] }
  ]
}
```
