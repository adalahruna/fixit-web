# Requirements Document

## Introduction

This document specifies requirements for multiple system improvements to the motorcycle service booking system. These improvements address critical gaps in CRUD operations, audit logging, mechanic workload detection, and KPI dashboard data accuracy. The improvements enhance system maintainability, compliance, operational visibility, and decision-making capabilities.

## Glossary

- **System**: The motorcycle service booking management system
- **Admin**: User with administrative privileges who manages service types, mechanics, and bookings
- **Owner**: User with owner privileges who has similar access to admin
- **Service_Type**: A type of service offered (e.g., oil change, tire replacement)
- **Mechanic**: A service technician who performs motorcycle services
- **Audit_Log**: A record of system actions for compliance and tracking
- **CRUD**: Create, Read, Update, Delete operations
- **KPI**: Key Performance Indicator metrics for business intelligence
- **Overload_Detection**: System functionality that identifies when mechanics exceed capacity
- **Confirmation_Dialog**: A UI component that requires user confirmation before destructive actions
- **Mock_Data**: Hardcoded placeholder data used for testing or demonstration
- **Database_Query**: A request to retrieve real data from the database
- **Booking**: A customer's scheduled service appointment
- **Assignment**: The linking of a mechanic to a booking
- **Service_Progress**: The tracking of service execution status

## Requirements

### Requirement 1: Delete Service Types with Confirmation

**User Story:** As an admin, I want to delete service types with confirmation dialogs, so that I can remove obsolete services while preventing accidental deletions.

#### Acceptance Criteria

1. WHEN an admin views the service types list, THE System SHALL display a delete button for each service type
2. WHEN an admin clicks the delete button, THE System SHALL display a confirmation dialog before deletion
3. WHEN an admin confirms deletion in the dialog, THE System SHALL delete the service type from the database
4. WHEN an admin cancels the deletion dialog, THE System SHALL maintain the current state without deleting
5. IF a service type has associated bookings, THEN THE System SHALL prevent deletion and display an error message
6. WHEN a service type is successfully deleted, THE System SHALL refresh the service types list

### Requirement 2: Delete Mechanics with Confirmation

**User Story:** As an admin, I want to delete mechanics with confirmation dialogs, so that I can remove inactive mechanics while preventing accidental deletions.

#### Acceptance Criteria

1. WHEN an admin views the mechanics list, THE System SHALL display a delete button for each mechanic
2. WHEN an admin clicks the delete button, THE System SHALL display a confirmation dialog before deletion
3. WHEN an admin confirms deletion in the dialog, THE System SHALL delete the mechanic from the database
4. WHEN an admin cancels the deletion dialog, THE System SHALL maintain the current state without deleting
5. IF a mechanic has active or pending assignments, THEN THE System SHALL prevent deletion and display an error message
6. WHEN a mechanic is successfully deleted, THE System SHALL refresh the mechanics list

### Requirement 3: Audit Logging for Service Type Operations

**User Story:** As a system administrator, I want all service type CRUD operations logged, so that I can track changes to service offerings for compliance and troubleshooting.

#### Acceptance Criteria

1. WHEN a service type is created, THE System SHALL log an audit entry with action "create_service_type"
2. WHEN a service type is updated, THE System SHALL log an audit entry with action "update_service_type"
3. WHEN a service type is deleted, THE System SHALL log an audit entry with action "delete_service_type"
4. FOR ALL service type audit logs, THE System SHALL record the actor_id, entity_id, timestamp, and relevant metadata
5. WHEN audit logging fails, THE System SHALL continue the operation and log the error without blocking the user

### Requirement 4: Audit Logging for Mechanic Operations

**User Story:** As a system administrator, I want all mechanic CRUD operations logged, so that I can track changes to mechanic records for compliance and troubleshooting.

#### Acceptance Criteria

1. WHEN a mechanic is created, THE System SHALL log an audit entry with action "create_mechanic"
2. WHEN a mechanic is updated, THE System SHALL log an audit entry with action "update_mechanic"
3. WHEN a mechanic is deleted, THE System SHALL log an audit entry with action "delete_mechanic"
4. FOR ALL mechanic audit logs, THE System SHALL record the actor_id, entity_id, timestamp, and relevant metadata
5. WHEN audit logging fails, THE System SHALL continue the operation and log the error without blocking the user

### Requirement 5: Audit Logging for Booking Updates

**User Story:** As a system administrator, I want booking reschedule operations logged, so that I can track schedule changes for compliance and customer service.

#### Acceptance Criteria

1. WHEN a booking is rescheduled, THE System SHALL log an audit entry with action "reschedule_booking"
2. FOR ALL reschedule audit logs, THE System SHALL record the original schedule, new schedule, and actor information
3. WHEN audit logging fails, THE System SHALL continue the operation and log the error without blocking the user

### Requirement 6: Audit Logging for Assignment Operations

**User Story:** As a system administrator, I want mechanic assignment operations logged, so that I can track workload distribution and accountability.

#### Acceptance Criteria

1. WHEN a mechanic is assigned to a booking, THE System SHALL log an audit entry with action "assign_mechanic"
2. WHEN a mechanic is unassigned from a booking, THE System SHALL log an audit entry with action "unassign_mechanic"
3. FOR ALL assignment audit logs, THE System SHALL record the booking_id, mechanic_id, actor_id, and timestamp
4. WHEN audit logging fails, THE System SHALL continue the operation and log the error without blocking the user

### Requirement 7: Audit Logging for Service Progress Operations

**User Story:** As a system administrator, I want service progress operations logged, so that I can track service execution and mechanic performance.

#### Acceptance Criteria

1. WHEN a service is started, THE System SHALL log an audit entry with action "start_service"
2. WHEN a service is completed, THE System SHALL log an audit entry with action "complete_service"
3. FOR ALL service progress audit logs, THE System SHALL record the booking_id, mechanic_id, timestamp, and status changes
4. WHEN audit logging fails, THE System SHALL continue the operation and log the error without blocking the user

### Requirement 8: Fix Mechanic Overload Detection

**User Story:** As an admin, I want accurate mechanic overload detection, so that I can identify capacity issues and prevent service quality degradation.

#### Acceptance Criteria

1. WHEN the overload detection function is called, THE System SHALL query real booking and assignment data from the database
2. WHEN calculating mechanic workload, THE System SHALL sum actual service durations for the current day
3. WHEN a mechanic's workload exceeds 80% of daily capacity, THE System SHALL mark them as overloaded
4. WHEN displaying overload status, THE System SHALL show current load, max capacity, and overload percentage
5. WHEN the overload detection API endpoint is called, THE System SHALL return accurate real-time data

### Requirement 9: Replace Mock Data in KPI Dashboard

**User Story:** As an owner, I want KPI dashboard charts to display real data, so that I can make informed business decisions based on actual performance.

#### Acceptance Criteria

1. WHEN displaying mechanic performance charts, THE System SHALL query real completed bookings and service times from the database
2. WHEN calculating mechanic performance metrics, THE System SHALL compute actual average service time and on-time rate per mechanic
3. WHEN displaying mechanic performance data, THE System SHALL show mechanic name, completed jobs count, average time, and on-time rate
4. FOR ALL mechanics with zero completed jobs, THE System SHALL display them with zero metrics rather than excluding them
5. WHEN the KPI dashboard loads, THE System SHALL use only real database queries without any hardcoded mock data

### Requirement 10: Comprehensive Audit Log Coverage

**User Story:** As a compliance officer, I want complete audit coverage of all system operations, so that I can ensure regulatory compliance and investigate incidents.

#### Acceptance Criteria

1. FOR ALL CRUD operations on service types, mechanics, and bookings, THE System SHALL create audit log entries
2. FOR ALL assignment and service progress operations, THE System SHALL create audit log entries
3. WHEN viewing audit logs, THE System SHALL display actor information, action type, entity type, timestamp, and metadata
4. WHEN filtering audit logs, THE System SHALL support filtering by entity type, action type, actor, and date range
5. WHEN audit log storage fails, THE System SHALL log the failure without blocking the primary operation
