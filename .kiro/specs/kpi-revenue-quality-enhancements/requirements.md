# Requirements Document

## Introduction

This document specifies the requirements for enhancing the KPI Dashboard in the FixIt Web application with real revenue data and improved quality metrics. The current dashboard uses placeholder values for several key metrics (reschedule rate: 5%, wait time: 30 min, customer satisfaction: 85%) and lacks detailed revenue analysis capabilities. This enhancement will replace placeholders with real calculations from the database and add comprehensive revenue analytics to support business decision-making.

## Glossary

- **KPI_Dashboard**: The administrative dashboard that displays key performance indicators for the workshop management system
- **Revenue_Calculator**: The system component that calculates revenue metrics from booking and service data
- **Quality_Metrics_Engine**: The system component that calculates service quality metrics from booking and service progress data
- **Booking**: A customer service appointment with associated services, schedule, and status
- **Service_Progress**: The tracking record of actual service execution including start time, end time, and duration
- **Booking_Service**: The junction table linking bookings to service types with pricing information
- **Service_Type**: A type of service offered (e.g., Oil Change, Tune Up) with associated price and duration
- **Mechanic**: A workshop technician who performs services on bookings
- **Assignment**: The relationship between a booking and the mechanic assigned to perform it
- **Reschedule**: A modification to a booking's scheduled time after initial confirmation
- **Wait_Time**: The duration between booking creation and service start time
- **Peak_Hour**: An hour of the day with high booking volume or revenue
- **Revenue_Growth_Rate**: The percentage change in revenue between two time periods
- **First_Time_Fix_Rate**: The percentage of services completed without requiring rework or additional visits
- **Cancellation_Rate**: The percentage of bookings that are cancelled, optionally broken down by reason

## Requirements

### Requirement 1: Calculate Real Revenue Metrics

**User Story:** As a business owner, I want to see accurate revenue calculations based on actual booking data, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute total revenue by summing all service prices from bookings where status equals 'done'
2. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute average booking value by dividing total revenue by the count of all bookings excluding those with status 'cancelled'
3. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute revenue per completed booking by dividing total revenue by the count of bookings where status equals 'done'
4. THE Revenue_Calculator SHALL query booking_services joined with service_types to retrieve price data for revenue calculations
5. THE Revenue_Calculator SHALL filter bookings by comparing the schedule_start timestamp against the selected date range parameters (startDate at 00:00:00 to endDate at 23:59:59 in system timezone)
6. WHEN no date range is specified, THE Revenue_Calculator SHALL default to a date range from 30 days before the current date and time to the current date and time
7. THE Revenue_Calculator SHALL handle bookings with multiple services by summing all service prices for that booking
8. IF a booking has no associated records in booking_services, THEN THE Revenue_Calculator SHALL treat that booking's revenue as 0 and include it in booking counts but not in revenue totals
9. IF a service_type price is NULL, THEN THE Revenue_Calculator SHALL treat that service price as 0 in revenue calculations
10. THE Revenue_Calculator SHALL exclude bookings with status 'cancelled' from all revenue calculations including total revenue, revenue per completed booking, and average booking value

### Requirement 2: Implement Daily Revenue Trend Analysis

**User Story:** As a business owner, I want to see daily revenue trends, so that I can identify patterns and anomalies in daily performance.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute daily revenue for each day in the selected date range
2. FOR EACH day in the date range, THE Revenue_Calculator SHALL sum revenue from all bookings scheduled on that day
3. THE Revenue_Calculator SHALL return daily revenue data as an array of objects containing date and revenue amount
4. THE KPI_Dashboard SHALL display daily revenue trend data in a chart visualization
5. WHEN a day has no bookings, THE Revenue_Calculator SHALL return zero revenue for that day
6. THE Revenue_Calculator SHALL format dates consistently in ISO 8601 format (YYYY-MM-DD)

### Requirement 3: Implement Monthly Revenue Comparison

**User Story:** As a business owner, I want to compare revenue across months, so that I can track business growth over time.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute monthly revenue totals for each month in the date range selected by the user, where the date range spans a minimum of 1 month and a maximum of 24 months
2. THE Revenue_Calculator SHALL sum the total_cost field from all bookings where status is 'completed', grouping by the month of the scheduled_date field
3. THE Revenue_Calculator SHALL return monthly revenue data as an array of objects, where each object contains a month identifier in YYYY-MM format and a revenue amount as a decimal number with 2 decimal places
4. THE KPI_Dashboard SHALL display monthly revenue comparison in a chart visualization
5. WHEN a month within the selected date range has no completed bookings, THE Revenue_Calculator SHALL return zero revenue for that month
6. IF the selected date range contains no months, THEN THE Revenue_Calculator SHALL return an empty array

### Requirement 4: Calculate Revenue Growth Rate

**User Story:** As a business owner, I want to see revenue growth rates, so that I can measure business performance over time.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute period-over-period revenue growth rate for the selected time period
2. THE Revenue_Calculator SHALL define daily period as calendar day from 00:00:00 to 23:59:59 in system timezone
3. THE Revenue_Calculator SHALL define weekly period as 7 calendar days from Monday 00:00:00 to Sunday 23:59:59 in system timezone
4. THE Revenue_Calculator SHALL define monthly period as calendar month from first day 00:00:00 to last day 23:59:59 in system timezone
5. THE Revenue_Calculator SHALL calculate growth rate as ((current_period_revenue - previous_period_revenue) / previous_period_revenue) * 100, rounded to 2 decimal places
6. IF previous period revenue is zero, THEN THE Revenue_Calculator SHALL return null and set status indicator to "insufficient data"
7. IF previous period revenue is negative, THEN THE Revenue_Calculator SHALL return null and set status indicator to "invalid baseline"
8. IF revenue data is unavailable for either current or previous period, THEN THE Revenue_Calculator SHALL return null and set status indicator to "data unavailable"
9. THE Revenue_Calculator SHALL compute growth rate for daily, weekly, and monthly periods as separate calculations
10. THE KPI_Dashboard SHALL display growth rate as a percentage with 2 decimal places
11. WHEN growth rate is positive, THE KPI_Dashboard SHALL display an upward indicator
12. WHEN growth rate is negative, THE KPI_Dashboard SHALL display a downward indicator
13. WHEN growth rate is zero, THE KPI_Dashboard SHALL display a neutral indicator
14. WHEN growth rate is null, THE KPI_Dashboard SHALL display the status indicator text returned by Revenue_Calculator

### Requirement 5: Implement Revenue by Service Type Breakdown

**User Story:** As a business owner, I want to see revenue breakdown by service type, so that I can identify the most profitable services.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute total revenue for each service type
2. FOR EACH service type, THE Revenue_Calculator SHALL sum revenue from all bookings containing that service
3. THE Revenue_Calculator SHALL compute the percentage contribution of each service type to total revenue
4. THE Revenue_Calculator SHALL return service type revenue data sorted by revenue amount in descending order
5. THE KPI_Dashboard SHALL display service type revenue breakdown with both absolute amounts and percentages
6. WHEN a booking contains multiple services, THE Revenue_Calculator SHALL attribute each service's price to its respective service type

### Requirement 6: Implement Revenue per Mechanic Analysis

**User Story:** As a business owner, I want to see revenue generated by each mechanic, so that I can evaluate individual performance and productivity.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute total revenue for each mechanic with values ranging from 0.00 to 999,999,999.99 formatted to 2 decimal places
2. THE Revenue_Calculator SHALL sum revenue from all bookings with status "completed" that are assigned to each mechanic
3. THE Revenue_Calculator SHALL calculate mechanic revenue by summing the prices of all services associated with each mechanic's completed bookings
4. THE Revenue_Calculator SHALL return mechanic revenue data sorted by revenue amount in descending order
5. THE KPI_Dashboard SHALL display mechanic revenue analysis showing mechanic name (maximum 100 characters) and revenue amount
6. IF a mechanic has no bookings with status "completed", THEN THE Revenue_Calculator SHALL return 0.00 revenue for that mechanic
7. THE Revenue_Calculator SHALL include only mechanics with is_active status set to true in the analysis
8. IF a booking has multiple services, THEN THE Revenue_Calculator SHALL include all service prices in the mechanic's total revenue
9. IF a mechanic's calculated revenue exceeds 999,999,999.99, THEN THE Revenue_Calculator SHALL return an error indicating revenue calculation overflow

### Requirement 7: Calculate Real Reschedule Rate

**User Story:** As a business owner, I want to see the actual reschedule rate, so that I can identify scheduling issues and improve customer experience.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Quality_Metrics_Engine SHALL compute reschedule rate from booking data
2. THE Quality_Metrics_Engine SHALL count bookings that have been rescheduled by checking for updated schedule_start or schedule_end timestamps
3. THE Quality_Metrics_Engine SHALL calculate reschedule rate as (rescheduled_bookings_count / total_bookings_count) * 100
4. THE Quality_Metrics_Engine SHALL use audit_logs table to identify reschedule events (action = 'reschedule_booking')
5. WHEN no bookings have been rescheduled, THE Quality_Metrics_Engine SHALL return 0% reschedule rate
6. THE KPI_Dashboard SHALL display reschedule rate as a percentage
7. THE KPI_Dashboard SHALL use color coding (green for <5%, yellow for 5-10%, red for >10%)

### Requirement 8: Calculate Real Average Wait Time

**User Story:** As a business owner, I want to see the actual average wait time, so that I can optimize scheduling and reduce customer wait times.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Quality_Metrics_Engine SHALL compute average wait time from bookings with status "completed" within the last 30 days
2. THE Quality_Metrics_Engine SHALL calculate wait time as the duration in minutes between booking created_at timestamp and service_progress start_time timestamp
3. IF a booking has status "completed" AND has no service_progress record, THEN THE Quality_Metrics_Engine SHALL exclude it from the calculation
4. IF a booking has a service_progress start_time that is earlier than the booking created_at, THEN THE Quality_Metrics_Engine SHALL exclude it from the calculation
5. THE Quality_Metrics_Engine SHALL compute average wait time by summing all valid wait times and dividing by the count of included bookings
6. THE Quality_Metrics_Engine SHALL round the average wait time to 1 decimal place for display
7. IF no completed bookings with valid service_progress records exist in the last 30 days, THEN THE KPI_Dashboard SHALL display "N/A" for average wait time
8. THE KPI_Dashboard SHALL display average wait time in minutes with 1 decimal place
9. IF average wait time is less than 30.0 minutes, THEN THE KPI_Dashboard SHALL display it with green color coding
10. IF average wait time is greater than or equal to 30.0 minutes AND less than 60.0 minutes, THEN THE KPI_Dashboard SHALL display it with yellow color coding
11. IF average wait time is greater than or equal to 60.0 minutes, THEN THE KPI_Dashboard SHALL display it with red color coding

### Requirement 9: Implement Cancellation Rate by Reason

**User Story:** As a business owner, I want to see cancellation rates broken down by reason, so that I can address the root causes of cancellations.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Quality_Metrics_Engine SHALL compute cancellation rate from booking data
2. THE Quality_Metrics_Engine SHALL calculate overall cancellation rate as (cancelled_bookings_count / total_bookings_count) * 100
3. THE Quality_Metrics_Engine SHALL extract cancellation reasons from booking notes or audit_logs metadata
4. THE Quality_Metrics_Engine SHALL group cancellations by reason and compute count for each reason
5. THE Quality_Metrics_Engine SHALL compute percentage for each cancellation reason relative to total cancellations
6. THE KPI_Dashboard SHALL display cancellation rate breakdown with reasons and percentages
7. WHEN no cancellation reason is available, THE Quality_Metrics_Engine SHALL categorize it as "Unknown"

### Requirement 10: Calculate First-Time Fix Rate

**User Story:** As a business owner, I want to see the first-time fix rate, so that I can measure service quality and identify training needs.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Quality_Metrics_Engine SHALL compute first-time fix rate from booking data
2. THE Quality_Metrics_Engine SHALL identify rework by checking if a customer has multiple bookings for the same vehicle within 7 days
3. THE Quality_Metrics_Engine SHALL calculate first-time fix rate as (bookings_without_rework / total_completed_bookings) * 100
4. THE Quality_Metrics_Engine SHALL group bookings by customer_id and vehicle_plate to identify potential rework
5. WHEN a booking is followed by another booking for the same vehicle within 7 days, THE Quality_Metrics_Engine SHALL flag it as potential rework
6. THE KPI_Dashboard SHALL display first-time fix rate as a percentage
7. THE KPI_Dashboard SHALL use color coding (green for >90%, yellow for 80-90%, red for <80%)

### Requirement 11: Enhance Peak Hours with Revenue Correlation

**User Story:** As a business owner, I want to see revenue per hour alongside booking count, so that I can identify the most profitable hours.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute total revenue for each hour (0-23) by summing the service price from all bookings with status "completed" where the scheduled_at timestamp falls within that hour
2. WHEN the KPI Dashboard is loaded, THE Revenue_Calculator SHALL compute average revenue per booking for each hour (0-23) by dividing total revenue by booking count
3. IF an hour has zero completed bookings, THEN THE Revenue_Calculator SHALL set average revenue to 0.00 for that hour
4. THE KPI_Dashboard SHALL display the top 3 hours ranked by total revenue in descending order, showing hour number, booking count, total revenue amount, and average revenue per booking for each hour
5. THE KPI_Dashboard SHALL visually distinguish the top 3 most profitable hours by displaying them with a colored border or background that differs from other hours
6. IF a booking's scheduled_at timestamp hour differs from its service_progress.started_at hour, THEN THE Revenue_Calculator SHALL attribute revenue to the hour indicated by scheduled_at

### Requirement 12: Implement Mechanic Utilization per Hour

**User Story:** As a business owner, I want to see mechanic utilization by hour, so that I can optimize staffing schedules.

#### Acceptance Criteria

1. WHEN the KPI Dashboard is loaded, THE Quality_Metrics_Engine SHALL compute mechanic utilization for each hour of the day
2. FOR EACH hour, THE Quality_Metrics_Engine SHALL calculate total mechanic capacity in minutes (number_of_active_mechanics * 60)
3. FOR EACH hour, THE Quality_Metrics_Engine SHALL calculate total used capacity from service_progress actual_duration
4. THE Quality_Metrics_Engine SHALL calculate hourly utilization as (used_capacity / total_capacity) * 100
5. THE KPI_Dashboard SHALL display hourly utilization as a percentage
6. THE KPI_Dashboard SHALL use color coding (green for 70-90%, yellow for 50-70% or 90-100%, red for <50% or >100%)
7. WHEN no mechanics are active in an hour, THE Quality_Metrics_Engine SHALL return 0% utilization

### Requirement 13: Replace Owner Dashboard Placeholder Revenue

**User Story:** As a business owner, I want to see real revenue calculations on my dashboard, so that I have accurate financial information.

#### Acceptance Criteria

1. WHEN the Owner Dashboard is loaded, THE Revenue_Calculator SHALL compute total revenue from completed bookings
2. THE Revenue_Calculator SHALL replace the placeholder calculation (completedBookings * 75000) with real revenue sum
3. THE Revenue_Calculator SHALL query booking_services joined with service_types to retrieve accurate price data
4. THE Revenue_Calculator SHALL filter bookings by the last 30 days
5. THE Owner Dashboard SHALL display total revenue with proper currency formatting (IDR)
6. THE Revenue_Calculator SHALL handle bookings with multiple services by summing all service prices

### Requirement 14: Add Revenue Trend Visualization to Owner Dashboard

**User Story:** As a business owner, I want to see revenue trends on my dashboard, so that I can quickly assess business performance.

#### Acceptance Criteria

1. WHEN the Owner Dashboard is loaded, THE KPI_Dashboard SHALL display a revenue trend chart showing weekly revenue data for the last 4 weeks
2. THE Revenue_Calculator SHALL compute weekly revenue by summing payment amounts from bookings with status "completed" for each week
3. THE Revenue_Calculator SHALL define a week as starting on Monday at 00:00:00 and ending on Sunday at 23:59:59 in local timezone (WIB/UTC+7)
4. THE KPI_Dashboard SHALL display revenue trend as a line chart with weeks on the x-axis and revenue amounts on the y-axis
5. THE KPI_Dashboard SHALL calculate revenue growth rate as ((current 4-week total - previous 4-week total) / previous 4-week total) × 100
6. THE KPI_Dashboard SHALL display the growth rate as a percentage with 1 decimal place (e.g., "+15.3%" or "-8.7%")
7. THE KPI_Dashboard SHALL display positive growth rates in green text and negative growth rates in red text
8. IF no completed bookings exist for the last 4 weeks, THEN THE KPI_Dashboard SHALL display the chart with zero values and a message indicating "No revenue data available for this period"
9. IF the previous 4-week revenue total is zero, THEN THE KPI_Dashboard SHALL display "N/A" for the growth rate instead of performing division
10. THE Revenue_Calculator SHALL format revenue amounts as "Rp" followed by the amount with thousand separators using dots and no decimal places (e.g., "Rp 1.500.000")

### Requirement 15: Add Top Performing Service Types to Owner Dashboard

**User Story:** As a business owner, I want to see top performing service types on my dashboard, so that I can focus on promoting profitable services.

#### Acceptance Criteria

1. WHEN the Owner Dashboard is loaded, THE KPI_Dashboard SHALL display top performing service types by revenue
2. THE Revenue_Calculator SHALL compute revenue for each service type
3. THE KPI_Dashboard SHALL display the top 5 service types sorted by revenue in descending order
4. THE KPI_Dashboard SHALL show both revenue amount and booking count for each service type
5. THE KPI_Dashboard SHALL display the percentage contribution of each service type to total revenue
6. WHEN fewer than 5 service types exist, THE KPI_Dashboard SHALL display all available service types

### Requirement 16: Implement Date Range Filtering for All Metrics

**User Story:** As a business owner, I want to filter all metrics by date range, so that I can analyze specific time periods.

#### Acceptance Criteria

1. WHEN a user selects a date range on the KPI Dashboard, THE Revenue_Calculator SHALL apply the date range filter to all revenue metrics
2. WHEN a user selects a date range on the KPI Dashboard, THE Quality_Metrics_Engine SHALL apply the date range filter to all quality metrics
3. THE KPI_Dashboard SHALL provide date range input fields (startDate and endDate)
4. THE KPI_Dashboard SHALL validate that endDate is not before startDate
5. WHEN no date range is specified, THE system SHALL default to the last 30 days
6. THE KPI_Dashboard SHALL update all metrics and visualizations when the date range is changed
7. THE system SHALL persist the selected date range in URL query parameters for bookmarking and sharing

### Requirement 17: Optimize Database Queries for Performance

**User Story:** As a system administrator, I want KPI calculations to be performant, so that the dashboard loads quickly even with large datasets.

#### Acceptance Criteria

1. THE Revenue_Calculator SHALL use database indexes on schedule_start, status, and created_at columns
2. THE Revenue_Calculator SHALL minimize the number of database queries by using joins instead of multiple queries
3. THE Revenue_Calculator SHALL use database aggregation functions (SUM, AVG, COUNT) instead of application-level calculations where possible
4. WHEN the dashboard is loaded, THE system SHALL complete all KPI calculations within 3 seconds for datasets up to 10,000 bookings
5. THE system SHALL use database query result caching where appropriate
6. THE system SHALL log slow queries (>1 second) for performance monitoring
7. THE system SHALL use connection pooling to manage database connections efficiently

### Requirement 18: Handle Edge Cases and Missing Data

**User Story:** As a developer, I want the system to handle edge cases gracefully, so that the dashboard remains functional even with incomplete data.

#### Acceptance Criteria

1. WHEN a booking has no booking_services records, THE Revenue_Calculator SHALL treat its revenue as zero
2. WHEN a booking has no service_progress record, THE Quality_Metrics_Engine SHALL exclude it from wait time calculations
3. WHEN dividing by zero would occur, THE system SHALL return null or a default value (0) instead of throwing an error
4. WHEN a date range contains no bookings, THE system SHALL display "No data available" messages instead of empty charts
5. WHEN a mechanic has no assignments, THE system SHALL display zero metrics for that mechanic
6. WHEN a service type has no bookings, THE system SHALL exclude it from the service type distribution
7. THE system SHALL log warnings for data inconsistencies (e.g., booking without service_progress when status is 'done')
