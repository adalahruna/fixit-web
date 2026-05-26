# Requirements Document: Mechanic Dashboard Status Badge Fix

## Introduction

This bugfix specification addresses a critical issue where the mechanic dashboard displays incorrect status counts. Specifically, when a mechanic clicks "Mulai Servis" (Start Service), the booking status updates correctly in the database (confirmed by data existing in service_progress table with in_progress status), but the dashboard continues to show 0 for "Sedang Dikerjakan" (In Progress) count. This creates a disconnect between the actual system state and what mechanics see, undermining trust in the system and potentially causing mechanics to miss active work items.

The root cause appears to be related to how the dashboard queries count in-progress bookings, potentially involving RLS policy restrictions, incorrect query joins, or mechanic user_id linkage issues.

## Glossary

- **Dashboard**: The mechanic's main page displaying work statistics and queue information
- **Status_Badge**: The numeric count displayed for different booking states (Total Antrian, Sedang Dikerjakan, Selesai Hari Ini)
- **Mechanic_User_Link**: The relationship between a user account (users table) and mechanic profile (mechanics table) via user_id
- **Service_Progress_Table**: Database table tracking the progress of service work (queued, in_progress, done)
- **Bookings_Table**: Database table storing booking records with status field
- **Assignments_Table**: Database table linking bookings to mechanics
- **RLS_Policy**: Row Level Security policy controlling data access at the database level
- **In_Progress_Status**: The status value indicating a booking is currently being worked on
- **Query_Join**: SQL operation combining data from multiple tables (assignments → bookings → service_progress)

## Requirements

### Requirement 1: Diagnostic Query Verification

**User Story:** As a developer, I want to verify the current state of the database and query results, so that I can identify the exact point of failure in the data retrieval chain.

#### Acceptance Criteria

1. WHEN diagnostic queries are executed, THE System SHALL return the actual count of in_progress bookings from service_progress table
2. WHEN diagnostic queries are executed, THE System SHALL return the actual count of in_progress bookings from bookings table
3. WHEN diagnostic queries are executed, THE System SHALL verify the mechanic's user_id is correctly linked in the mechanics table
4. WHEN diagnostic queries are executed, THE System SHALL return all assignment records for the mechanic
5. WHEN diagnostic queries are executed, THE System SHALL test the exact query used by the dashboard with detailed error logging

### Requirement 2: RLS Policy Validation

**User Story:** As a developer, I want to verify that RLS policies allow mechanics to read their assigned bookings and service progress, so that I can rule out or confirm permission issues as the root cause.

#### Acceptance Criteria

1. WHEN a mechanic queries the service_progress table, THE System SHALL allow read access for records linked to their assignments
2. WHEN a mechanic queries the bookings table, THE System SHALL allow read access for bookings assigned to them
3. WHEN a mechanic queries the assignments table, THE System SHALL allow read access for their own assignments
4. IF RLS policies block legitimate queries, THEN THE System SHALL log detailed permission denial information
5. WHEN RLS policies are tested, THE System SHALL verify policies work correctly for all three roles (mechanic, admin, owner)

### Requirement 3: Query Logic Correction

**User Story:** As a developer, I want to ensure the dashboard query correctly joins assignments, bookings, and service_progress tables, so that accurate counts are returned.

#### Acceptance Criteria

1. WHEN counting in_progress bookings, THE System SHALL join assignments table using mechanic_id
2. WHEN counting in_progress bookings, THE System SHALL filter bookings by status = 'in_progress'
3. WHEN counting in_progress bookings, THE System SHALL verify the booking_id exists in assignments for the mechanic
4. WHEN the query executes, THE System SHALL return the same count as a direct service_progress table query
5. WHEN query errors occur, THE System SHALL log the full error details including SQL state and hint

### Requirement 4: Mechanic User Linkage Verification

**User Story:** As a developer, I want to verify that the mechanic's user_id is correctly populated and linked, so that queries filtering by user_id return the correct mechanic record.

#### Acceptance Criteria

1. WHEN a mechanic logs in, THE System SHALL retrieve the mechanic record using user_id from the authenticated user
2. IF no mechanic record is found for a user_id, THEN THE System SHALL display a clear error message to the user
3. WHEN the mechanic record is retrieved, THE System SHALL verify the user_id matches auth.uid()
4. WHEN multiple mechanics exist, THE System SHALL ensure each has a unique user_id (enforced by database constraint)
5. WHEN a mechanic is created, THE System SHALL require a valid user_id to be set

### Requirement 5: Dashboard Count Accuracy

**User Story:** As a mechanic, I want the dashboard to display accurate counts for all status badges, so that I can trust the information and manage my work effectively.

#### Acceptance Criteria

1. WHEN a booking status changes to in_progress, THE Dashboard SHALL increment the "Sedang Dikerjakan" count within 5 seconds
2. WHEN a booking status changes to done, THE Dashboard SHALL decrement the "Sedang Dikerjakan" count within 5 seconds
3. WHEN the dashboard loads, THE System SHALL display the current count of bookings with status = 'in_progress' assigned to the mechanic
4. WHEN no in_progress bookings exist, THE Dashboard SHALL display 0 for "Sedang Dikerjakan"
5. WHEN the dashboard refreshes, THE System SHALL use force-dynamic rendering to prevent stale cached data

### Requirement 6: Error Logging and Debugging

**User Story:** As a developer, I want comprehensive error logging for dashboard queries, so that I can quickly identify and fix issues when they occur.

#### Acceptance Criteria

1. WHEN a dashboard query fails, THE System SHALL log the error message to the server console
2. WHEN a dashboard query fails, THE System SHALL log the query parameters (mechanic_id, user_id)
3. WHEN a dashboard query returns unexpected results, THE System SHALL log the actual vs expected counts
4. WHEN RLS policies block a query, THE System SHALL log the specific policy that caused the denial
5. WHEN debugging is enabled, THE System SHALL log successful query results for comparison

### Requirement 7: Atomic Status Update Verification

**User Story:** As a developer, I want to verify that the atomic status update functions correctly update both bookings and service_progress tables, so that status consistency is maintained.

#### Acceptance Criteria

1. WHEN start_service_atomic is called, THE System SHALL update service_progress.status to 'in_progress'
2. WHEN start_service_atomic is called, THE System SHALL update bookings.status to 'in_progress'
3. IF either update fails, THEN THE System SHALL rollback both updates (transaction atomicity)
4. WHEN start_service_atomic completes, THE System SHALL return success = true
5. WHEN start_service_atomic encounters an error, THE System SHALL return a descriptive error message

### Requirement 8: Cache Invalidation

**User Story:** As a mechanic, I want the dashboard to show fresh data after I start or complete a service, so that I see the updated counts immediately.

#### Acceptance Criteria

1. WHEN a service status changes, THE System SHALL revalidate the mechanic dashboard path
2. WHEN a service status changes, THE System SHALL revalidate the mechanic queue path
3. WHEN revalidation occurs, THE System SHALL clear all cached query results for affected paths
4. WHEN the dashboard is accessed, THE System SHALL use dynamic rendering (no static generation)
5. WHEN the dashboard is accessed, THE System SHALL set revalidate = 0 to prevent caching

### Requirement 9: Alternative Query Strategy

**User Story:** As a developer, I want to test alternative query approaches if the current approach fails, so that I can find a working solution.

#### Acceptance Criteria

1. WHERE the current query approach fails, THE System SHALL test querying service_progress directly with mechanic_id join
2. WHERE the current query approach fails, THE System SHALL test using a database view that pre-joins the tables
3. WHERE the current query approach fails, THE System SHALL test using a stored function that returns counts
4. WHEN alternative approaches are tested, THE System SHALL compare results for consistency
5. WHEN a working approach is found, THE System SHALL document why it works when others failed

### Requirement 10: Integration Test Coverage

**User Story:** As a developer, I want automated tests that verify dashboard counts update correctly, so that this bug cannot regress in the future.

#### Acceptance Criteria

1. WHEN a test creates a booking and assigns it to a mechanic, THE Test SHALL verify the queue count increments
2. WHEN a test starts a service, THE Test SHALL verify the in_progress count increments and queue count decrements
3. WHEN a test completes a service, THE Test SHALL verify the in_progress count decrements and completed count increments
4. WHEN tests run, THE System SHALL use a test database with known initial state
5. WHEN tests complete, THE System SHALL clean up test data to prevent pollution
