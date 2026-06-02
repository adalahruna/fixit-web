# Implementation Plan: System Improvements - CRUD, Audit, KPI

## Overview

This implementation plan addresses four independent system improvements:
1. Delete functionality with confirmation dialogs for Service Types and Mechanics
2. Complete audit logging for all CRUD operations
3. Fix mechanic overload detection functionality
4. Replace mock data with real database queries in KPI dashboard

The tasks are organized to implement each improvement incrementally, with testing integrated throughout. All implementation will use TypeScript.

## Tasks

- [x] 1. Create reusable delete confirmation component
  - Create `frontend/src/components/common/DeleteConfirmation.tsx` component
  - Implement confirmation dialog with confirm/cancel buttons
  - Add loading state during deletion
  - Add error/success message display
  - Make component reusable for different entity types
  - _Requirements: 1.2, 2.2_

- [ ] 2. Implement delete functionality for Service Types
  - [x] 2.1 Add deleteService server action to services/actions.ts
    - Implement validation to check for associated bookings
    - Add database delete operation
    - Add error handling for referential integrity
    - Return success or error response
    - _Requirements: 1.3, 1.5_
  
  - [x] 2.2 Add delete button to Service Types page
    - Import DeleteConfirmation component
    - Add delete button to each service type row
    - Wire delete button to deleteService action
    - Handle success/error responses
    - Trigger page revalidation after deletion
    - _Requirements: 1.1, 1.4, 1.6_
  
  - [ ] 2.3 Write property test for service type deletion
    - **Property 3: Confirmed deletion removes entity from database**
    - **Validates: Requirements 1.3, 2.3**
  
  - [ ] 2.4 Write property test for referential integrity
    - **Property 5: Referential integrity prevents deletion with dependencies**
    - **Validates: Requirements 1.5, 2.5**
  
  - [ ] 2.5 Write unit tests for delete edge cases
    - Test deletion with existing bookings (should fail)
    - Test deletion without bookings (should succeed)
    - Test cancellation behavior
    - _Requirements: 1.4, 1.5_

- [ ] 3. Implement delete functionality for Mechanics
  - [x] 3.1 Add deleteMechanic server action to mechanics/actions.ts
    - Implement validation to check for active/pending assignments
    - Add database delete operation
    - Add error handling for referential integrity
    - Return success or error response
    - _Requirements: 2.3, 2.5_
  
  - [x] 3.2 Add delete button to Mechanics page
    - Import DeleteConfirmation component
    - Add delete button to each mechanic row
    - Wire delete button to deleteMechanic action
    - Handle success/error responses
    - Trigger page revalidation after deletion
    - _Requirements: 2.1, 2.4, 2.6_
  
  - [ ] 3.3 Write unit tests for mechanic deletion
    - Test deletion with active assignments (should fail)
    - Test deletion without assignments (should succeed)
    - Test UI refresh after deletion
    - _Requirements: 2.3, 2.5, 2.6_

- [ ] 4. Checkpoint - Ensure delete functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add audit logging to Service Type operations
  - [x] 5.1 Add audit logging to createService action
    - Import logAuditActivity and constants
    - Add audit log call after successful creation
    - Include service type metadata (name, price, duration)
    - Ensure audit failure doesn't block operation
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [x] 5.2 Add audit logging to updateService action
    - Add audit log call after successful update
    - Include updated fields in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [ ] 5.3 Add audit logging to deleteService action
    - Add audit log call after successful deletion
    - Include deleted service type information in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 5.4 Write property test for service type audit logging
    - **Property 7: Create operations generate audit logs**
    - **Property 8: Update operations generate audit logs**
    - **Property 9: Delete operations generate audit logs**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 6. Add audit logging to Mechanic operations
  - [x] 6.1 Add audit logging to createMechanic action
    - Import logAuditActivity and constants
    - Add audit log call after successful creation
    - Include mechanic metadata (name, capacity, user_id)
    - Ensure audit failure doesn't block operation
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [x] 6.2 Add audit logging to updateMechanic action
    - Add audit log call after successful update
    - Include updated fields in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ] 6.3 Add audit logging to deleteMechanic action
    - Add audit log call after successful deletion
    - Include deleted mechanic information in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ] 6.4 Write property test for mechanic audit logging
    - **Property 7: Create operations generate audit logs**
    - **Property 8: Update operations generate audit logs**
    - **Property 9: Delete operations generate audit logs**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 7. Add audit logging to Booking reschedule operations
  - [x] 7.1 Add audit logging to rescheduleBooking action
    - Import logAuditActivity and constants
    - Add audit log call after successful reschedule
    - Include original and new schedule in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 7.2 Write property test for reschedule audit logging
    - **Property 10: Reschedule operations generate audit logs**
    - **Validates: Requirements 5.1, 5.2**

- [x] 8. Add audit logging to Assignment operations
  - [x] 8.1 Add audit logging to assignMechanic action
    - Import logAuditActivity and constants
    - Add audit log call after successful assignment
    - Include booking_id, mechanic_id, and mechanic name in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 8.2 Add audit logging to unassignMechanic action
    - Add audit log call after successful unassignment
    - Include booking_id and mechanic_id in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ] 8.3 Write property test for assignment audit logging
    - **Property 11: Assignment operations generate audit logs**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 9. Add audit logging to Service Progress operations
  - [x] 9.1 Add audit logging to startService action
    - Import logAuditActivity and constants
    - Add audit log call after successful service start
    - Include booking_id, mechanic_id, and timestamp in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [x] 9.2 Add audit logging to completeService action
    - Add audit log call after successful service completion
    - Include booking_id, mechanic_id, actual_duration, and timestamp in metadata
    - Ensure audit failure doesn't block operation
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [ ] 9.3 Write property test for service progress audit logging
    - **Property 12: Service progress operations generate audit logs**
    - **Validates: Requirements 7.1, 7.2**

- [x] 10. Write comprehensive audit logging tests
  - [ ] 10.1 Write property test for audit log completeness
    - **Property 13: Audit logs contain required fields**
    - **Validates: Requirements 3.4, 4.4, 5.2, 6.3, 7.3**
  
  - [ ] 10.2 Write property test for audit failure handling
    - **Property 14: Audit failures don't block primary operations**
    - **Validates: Requirements 3.5, 4.5, 5.3, 6.4, 7.4**
  
  - [ ] 10.3 Write unit tests for audit log viewing and filtering
    - Test audit log display with complete information
    - Test filtering by entity type, action type, actor, date range
    - _Requirements: 10.3, 10.4_

- [ ] 11. Checkpoint - Ensure audit logging is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Fix mechanic overload detection
  - [x] 12.1 Fix detectMechanicOverload function in utils/overload-detection.ts
    - Update query to properly join assignments and bookings
    - Fix workload calculation to sum service durations correctly
    - Implement proper date filtering for current day
    - Fix overload threshold check (>= 80%)
    - Return complete overload status with all required fields
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 12.2 Fix getMechanicOverloadStatus function in utils/overload-detection.ts
    - Update to query specific mechanic's data correctly
    - Ensure it returns status even when not overloaded
    - Fix workload calculation for single mechanic
    - Return complete status information
    - _Requirements: 8.4, 8.5_
  
  - [ ] 12.3 Update overload detection API endpoint
    - Verify API route uses fixed detection functions
    - Ensure API returns real-time data
    - Add error handling for query failures
    - _Requirements: 8.5_
  
  - [ ] 12.4 Write property test for overload detection
    - **Property 17: Overload detection uses real database data**
    - **Property 18: Workload calculation sums service durations**
    - **Property 19: Overload threshold correctly identifies overloaded mechanics**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [ ] 12.5 Write unit tests for overload edge cases
    - Test mechanic with zero bookings
    - Test mechanic at exactly 80% capacity
    - Test mechanic with missing capacity (should use default)
    - Test date boundary conditions
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 13. Replace mock data in KPI dashboard
  - [x] 13.1 Implement real mechanic performance query in kpi/calculations.ts
    - Create getMechanicPerformance helper function
    - Query all active mechanics from database
    - For each mechanic, query their completed bookings via assignments
    - Calculate real average service time from service_progress
    - Calculate real on-time rate from scheduled vs actual duration
    - Include mechanics with zero completed jobs
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 13.2 Replace mock data in calculateKPIMetrics
    - Remove hardcoded mechanicPerformance array
    - Call getMechanicPerformance function instead
    - Ensure all mechanics appear in results
    - Verify no other mock data remains in the function
    - _Requirements: 9.5_
  
  - [x] 13.3 Write property test for KPI calculations
    - **Property 22: Mechanic performance uses real database queries**
    - **Property 23: Performance metrics calculated from actual data**
    - **Property 25: Zero-job mechanics appear in results**
    - **Validates: Requirements 9.1, 9.2, 9.4**
  
  - [x] 13.4 Write unit tests for KPI edge cases
    - Test with zero mechanics in system
    - Test with mechanics having zero completed jobs
    - Test with empty date range
    - Test with missing service_progress records
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 14. Final integration testing
  - [x] 14.1 Write integration tests for delete flow
    - Test complete delete flow from UI to database
    - Test confirmation dialog interaction
    - Test audit log creation during delete
    - Test UI refresh after delete
  
  - [x] 14.2 Write integration tests for audit logging
    - Test audit logs created for all operations
    - Test audit log viewing in admin interface
    - Test audit log filtering functionality
  
  - [x] 14.3 Write integration tests for overload detection
    - Test overload detection with real booking data
    - Test API endpoint returns correct data
    - Test overload warnings display correctly
  
  - [x] 14.4 Write integration tests for KPI dashboard
    - Test dashboard loads with real data
    - Test all charts display correctly
    - Test date range filtering
    - Verify no mock data present

- [x] 15. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The four improvements are independent and can be implemented in parallel if needed
- Audit logging follows a non-blocking pattern to ensure system availability
- Overload detection and KPI fixes focus on replacing mock/broken logic with real database queries
- All implementation uses TypeScript

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "2.1", "3.1", "5.1", "6.1", "7.1", "8.1", "9.1", "12.1", "13.1"]
    },
    {
      "id": 1,
      "tasks": ["2.2", "3.2", "5.2", "6.2", "8.2", "9.2", "12.2", "13.2"]
    },
    {
      "id": 2,
      "tasks": ["2.3", "2.4", "3.3", "5.3", "6.3", "12.3"]
    },
    {
      "id": 3,
      "tasks": ["2.5", "5.4", "6.4", "7.2", "8.3", "9.3", "12.4", "13.3"]
    },
    {
      "id": 4,
      "tasks": ["10.1", "10.2", "12.5", "13.4"]
    },
    {
      "id": 5,
      "tasks": ["10.3", "14.1", "14.2", "14.3", "14.4"]
    }
  ]
}
```
