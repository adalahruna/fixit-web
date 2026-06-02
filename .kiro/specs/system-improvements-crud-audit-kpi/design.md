# Design Document

## Overview

This design addresses four distinct system improvements to the motorcycle service booking system:

1. **Delete Functionality**: Add delete operations with confirmation dialogs for Service Types and Mechanics
2. **Audit Logging Completion**: Extend audit logging to cover all CRUD operations beyond just booking creation
3. **Overload Detection Fix**: Replace broken mechanic overload detection with functional implementation
4. **KPI Dashboard Real Data**: Replace mock data with real database queries in mechanic performance charts

These improvements are independent but complementary, enhancing system maintainability, compliance, operational visibility, and decision-making accuracy.

## Architecture

### Component Organization

The improvements follow the existing architecture pattern:

```
frontend/src/
├── lib/
│   ├── services/actions.ts          # Service type CRUD + audit
│   ├── mechanics/actions.ts         # Mechanic CRUD + audit
│   ├── bookings/
│   │   ├── actions.ts               # Booking creation (already has audit)
│   │   ├── cancel-actions.ts        # Booking cancellation (already has audit)
│   │   └── reschedule-actions.ts    # Add audit logging
│   ├── assignments/actions.ts       # Add audit logging
│   ├── progress/actions.ts          # Add audit logging
│   ├── audit/
│   │   ├── actions.ts               # Audit logging utilities (existing)
│   │   └── constants.ts             # Audit action constants (existing)
│   ├── utils/
│   │   └── overload-detection.ts    # Fix overload detection logic
│   └── kpi/
│       └── calculations.ts          # Replace mock data with real queries
├── app/admin/
│   ├── services/page.tsx            # Add delete button + confirmation
│   ├── mechanics/page.tsx           # Add delete button + confirmation
│   └── dashboard/page.tsx           # Uses KPI calculations
└── components/
    └── (confirmation dialogs)       # Reusable confirmation component
```

### Data Flow

**Delete Operations:**
```
User clicks delete → Confirmation dialog → User confirms → 
Server action (deleteService/deleteMechanic) → 
Audit log created → Database delete → Revalidate → UI refresh
```

**Audit Logging:**
```
User action → Server action → Primary operation → 
logAuditActivity() → Insert audit_logs table → 
Silent fail if audit fails (don't block primary operation)
```

**Overload Detection:**
```
API call → detectMechanicOverload() → 
Query assignments + bookings → Calculate workload → 
Compare to capacity → Return overload status
```

**KPI Dashboard:**
```
Dashboard loads → calculateKPIMetrics() → 
Query bookings + assignments + service_progress → 
Calculate real metrics → Return to UI
```

## Components and Interfaces

### 1. Delete Functionality Components

#### DeleteButton Component
```typescript
interface DeleteButtonProps {
  itemId: string;
  itemName: string;
  itemType: 'service' | 'mechanic';
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
}
```

A reusable client component that:
- Displays a delete button
- Shows confirmation dialog on click
- Calls the delete action on confirmation
- Handles loading and error states
- Shows success/error messages

#### Server Actions

**deleteService(id: string)**
- Validates that service type has no associated bookings
- Deletes service type from database
- Logs audit activity
- Revalidates service paths
- Returns success or error

**deleteMechanic(id: string)**
- Validates that mechanic has no active/pending assignments
- Deletes mechanic from database
- Logs audit activity
- Revalidates mechanic paths
- Returns success or error

### 2. Audit Logging Integration

#### Audit Logging Pattern

All CRUD operations follow this pattern:

```typescript
// 1. Perform primary operation
const { data, error } = await supabase.from('table').operation();

if (error) {
  return { error: error.message };
}

// 2. Log audit activity (non-blocking)
await logAuditActivity(
  AUDIT_ACTIONS.ACTION_NAME,
  AUDIT_ENTITIES.ENTITY_NAME,
  entityId,
  metadata
);

// 3. Revalidate and return
revalidatePaths();
return { success: true };
```

#### Actions Requiring Audit Logging

**Service Types:**
- `createService()` → AUDIT_ACTIONS.CREATE_SERVICE_TYPE
- `updateService()` → AUDIT_ACTIONS.UPDATE_SERVICE_TYPE
- `deleteService()` → AUDIT_ACTIONS.DELETE_SERVICE_TYPE

**Mechanics:**
- `createMechanic()` → AUDIT_ACTIONS.CREATE_MECHANIC
- `updateMechanic()` → AUDIT_ACTIONS.UPDATE_MECHANIC
- `deleteMechanic()` → AUDIT_ACTIONS.DELETE_MECHANIC

**Bookings:**
- `rescheduleBooking()` → AUDIT_ACTIONS.RESCHEDULE_BOOKING

**Assignments:**
- `assignMechanic()` → AUDIT_ACTIONS.ASSIGN_MECHANIC
- `unassignMechanic()` → AUDIT_ACTIONS.UNASSIGN_MECHANIC

**Service Progress:**
- `startService()` → AUDIT_ACTIONS.START_SERVICE
- `completeService()` → AUDIT_ACTIONS.COMPLETE_SERVICE

#### Metadata Structure

Each audit log should include relevant metadata:

**Service Type Operations:**
```typescript
{
  name: string;
  price: number;
  default_duration_minutes: number;
}
```

**Mechanic Operations:**
```typescript
{
  name: string;
  is_active: boolean;
  daily_capacity_minutes: number;
  user_id?: string;
}
```

**Reschedule Operations:**
```typescript
{
  original_schedule_start: string;
  original_schedule_end: string;
  new_schedule_start: string;
  new_schedule_end: string;
}
```

**Assignment Operations:**
```typescript
{
  booking_id: string;
  mechanic_id: string;
  mechanic_name: string;
}
```

**Service Progress Operations:**
```typescript
{
  booking_id: string;
  mechanic_id: string;
  status: string;
  timestamp: string;
}
```

### 3. Overload Detection Fix

#### Current Issue

The `detectMechanicOverload()` function exists but doesn't work correctly due to:
- Incorrect query structure
- Missing error handling
- Incorrect workload calculation

#### Fixed Implementation

**detectMechanicOverload()**
```typescript
async function detectMechanicOverload(): Promise<OverloadDetectionResult> {
  // 1. Get all active mechanics
  const mechanics = await supabase
    .from('mechanics')
    .select('id, name, daily_capacity_minutes, is_active')
    .eq('is_active', true);

  // 2. For each mechanic, calculate today's workload
  for (const mechanic of mechanics) {
    const maxCapacity = mechanic.daily_capacity_minutes || 480;
    
    // 3. Get today's assignments
    const assignments = await supabase
      .from('assignments')
      .select(`
        booking:bookings!inner(
          id,
          status,
          booking_services(duration_minutes)
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .gte('booking.schedule_start', startOfToday)
      .lt('booking.schedule_start', startOfTomorrow)
      .in('booking.status', ['queued', 'in_progress']);
    
    // 4. Calculate total workload
    const totalWorkload = assignments.reduce((sum, assignment) => {
      const duration = assignment.booking.booking_services
        .reduce((s, bs) => s + bs.duration_minutes, 0);
      return sum + duration;
    }, 0);
    
    // 5. Check if overloaded (>80% capacity)
    const isOverloaded = (totalWorkload / maxCapacity) >= 0.8;
    
    // 6. Store status
    overloadStatuses.push({
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      currentLoad: totalWorkload,
      maxCapacity,
      isOverloaded,
      overloadPercentage: Math.round((totalWorkload / maxCapacity) * 100)
    });
  }
  
  return {
    overloadedMechanics: overloadStatuses.filter(s => s.isOverloaded),
    totalMechanics: mechanics.length,
    overloadedCount: overloadStatuses.filter(s => s.isOverloaded).length
  };
}
```

**getMechanicOverloadStatus(mechanicId: string)**
- Query specific mechanic's data
- Calculate workload for today
- Return overload status even if not overloaded
- Used by API endpoint `/api/overload/mechanic/[id]`

### 4. KPI Dashboard Real Data

#### Current Issue

The `mechanicPerformance` array in `calculateKPIMetrics()` uses hardcoded mock data:

```typescript
// Current (WRONG)
const mechanicPerformance = [
  { name: 'Ahmad', completedJobs: 15, avgTime: 45, onTimeRate: 95 },
  { name: 'Budi', completedJobs: 12, avgTime: 52, onTimeRate: 88 },
  { name: 'Candra', completedJobs: 18, avgTime: 38, onTimeRate: 92 }
];
```

#### Fixed Implementation

**Real Mechanic Performance Query:**

```typescript
async function getMechanicPerformance(startDate: Date, endDate: Date) {
  // 1. Get all active mechanics
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('is_active', true);

  const performance = [];

  // 2. For each mechanic, calculate real metrics
  for (const mechanic of mechanics) {
    // 3. Get completed bookings assigned to this mechanic
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        booking:bookings!inner(
          id,
          schedule_start,
          schedule_end,
          status,
          service_progress(
            actual_duration,
            start_time,
            end_time
          )
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .eq('booking.status', 'done')
      .gte('booking.schedule_start', startDate.toISOString())
      .lte('booking.schedule_start', endDate.toISOString());

    const completedJobs = assignments?.length || 0;

    // 4. Calculate average service time
    const totalTime = assignments?.reduce((sum, a) => {
      const progress = Array.isArray(a.booking.service_progress)
        ? a.booking.service_progress[0]
        : a.booking.service_progress;
      return sum + (progress?.actual_duration || 0);
    }, 0) || 0;

    const avgTime = completedJobs > 0 
      ? Math.round(totalTime / completedJobs) 
      : 0;

    // 5. Calculate on-time rate
    const onTimeJobs = assignments?.filter(a => {
      const progress = Array.isArray(a.booking.service_progress)
        ? a.booking.service_progress[0]
        : a.booking.service_progress;
      const scheduledDuration = 
        new Date(a.booking.schedule_end).getTime() - 
        new Date(a.booking.schedule_start).getTime();
      const actualDuration = (progress?.actual_duration || 0) * 60 * 1000;
      return actualDuration <= scheduledDuration + (30 * 60 * 1000); // 30 min tolerance
    }).length || 0;

    const onTimeRate = completedJobs > 0
      ? Math.round((onTimeJobs / completedJobs) * 100)
      : 0;

    // 6. Add to performance array
    performance.push({
      name: mechanic.name,
      completedJobs,
      avgTime,
      onTimeRate
    });
  }

  return performance;
}
```

## Data Models

### Audit Logs Table (Existing)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  timestamp_log TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

### Service Types Table (Existing)

```sql
CREATE TABLE service_types (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Mechanics Table (Existing)

```sql
CREATE TABLE mechanics (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  daily_capacity_minutes INTEGER DEFAULT 480,
  skill_notes TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships for Delete Validation

**Service Types:**
- Referenced by `booking_services.service_type_id`
- Cannot delete if any bookings reference it

**Mechanics:**
- Referenced by `assignments.mechanic_id`
- Cannot delete if any active/pending assignments exist

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Delete Functionality Properties

Property 1: Delete buttons appear for all CRUD entities
*For any* service type or mechanic in the admin list view, a delete button should be rendered in the UI
**Validates: Requirements 1.1, 2.1**

Property 2: Confirmation dialogs prevent accidental deletion
*For any* delete button click on a service type or mechanic, a confirmation dialog should be displayed before any deletion occurs
**Validates: Requirements 1.2, 2.2**

Property 3: Confirmed deletion removes entity from database
*For any* service type or mechanic without dependencies, confirming the deletion dialog should result in the entity being removed from the database
**Validates: Requirements 1.3, 2.3**

Property 4: Cancelled deletion preserves entity state
*For any* service type or mechanic, cancelling the deletion dialog should leave the entity unchanged in the database
**Validates: Requirements 1.4, 2.4**

Property 5: Referential integrity prevents deletion with dependencies
*For any* service type with associated bookings or mechanic with active assignments, deletion should be rejected with an error message
**Validates: Requirements 1.5, 2.5**

Property 6: UI refreshes after successful deletion
*For any* successful deletion of a service type or mechanic, the list view should refresh to reflect the removal
**Validates: Requirements 1.6, 2.6**

### Audit Logging Properties

Property 7: Create operations generate audit logs
*For any* creation of a service type, mechanic, or booking, an audit log entry with the appropriate "create_*" action should be inserted into the audit_logs table
**Validates: Requirements 3.1, 4.1**

Property 8: Update operations generate audit logs
*For any* update of a service type, mechanic, or booking, an audit log entry with the appropriate "update_*" action should be inserted into the audit_logs table
**Validates: Requirements 3.2, 4.2**

Property 9: Delete operations generate audit logs
*For any* deletion of a service type or mechanic, an audit log entry with the appropriate "delete_*" action should be inserted into the audit_logs table
**Validates: Requirements 3.3, 4.3**

Property 10: Reschedule operations generate audit logs
*For any* booking reschedule operation, an audit log entry with action "reschedule_booking" should be inserted with original and new schedule information
**Validates: Requirements 5.1, 5.2**

Property 11: Assignment operations generate audit logs
*For any* mechanic assignment or unassignment operation, an audit log entry with the appropriate action should be inserted with booking and mechanic information
**Validates: Requirements 6.1, 6.2**

Property 12: Service progress operations generate audit logs
*For any* service start or completion operation, an audit log entry with the appropriate action should be inserted with booking, mechanic, and status information
**Validates: Requirements 7.1, 7.2**

Property 13: Audit logs contain required fields
*For any* audit log entry created by the system, it should contain actor_id, action, entity, entity_id, timestamp_log, and relevant metadata fields
**Validates: Requirements 3.4, 4.4, 5.2, 6.3, 7.3**

Property 14: Audit failures don't block primary operations
*For any* operation that triggers audit logging, if the audit logging fails, the primary operation should complete successfully and the audit error should be logged
**Validates: Requirements 3.5, 4.5, 5.3, 6.4, 7.4**

Property 15: Audit log filtering returns matching records
*For any* audit log query with filters (entity type, action type, actor, date range), the returned results should match all specified filter criteria
**Validates: Requirements 10.4**

Property 16: Audit log display includes complete information
*For any* audit log record displayed in the UI, it should show actor information, action type, entity type, timestamp, and metadata
**Validates: Requirements 10.3**

### Overload Detection Properties

Property 17: Overload detection uses real database data
*For any* call to the overload detection function, it should query the assignments and bookings tables from the database rather than using mock or hardcoded data
**Validates: Requirements 8.1**

Property 18: Workload calculation sums service durations
*For any* mechanic with assigned bookings for the current day, the calculated workload should equal the sum of all booking service durations
**Validates: Requirements 8.2**

Property 19: Overload threshold correctly identifies overloaded mechanics
*For any* mechanic whose workload is greater than or equal to 80% of their daily capacity, the system should mark them as overloaded
**Validates: Requirements 8.3**

Property 20: Overload status contains complete information
*For any* mechanic's overload status, it should include current load, max capacity, overload percentage, queued bookings count, and in-progress bookings count
**Validates: Requirements 8.4**

Property 21: Overload API returns real-time data
*For any* API call to the overload detection endpoint, the returned data should reflect the current state of the database at the time of the call
**Validates: Requirements 8.5**

### KPI Dashboard Properties

Property 22: Mechanic performance uses real database queries
*For any* KPI dashboard load, the mechanic performance data should be calculated from queries to the assignments, bookings, and service_progress tables
**Validates: Requirements 9.1**

Property 23: Performance metrics calculated from actual data
*For any* mechanic with completed jobs, the average service time and on-time rate should be calculated from their actual service_progress records
**Validates: Requirements 9.2**

Property 24: Performance data contains complete metrics
*For any* mechanic in the performance chart, the data should include mechanic name, completed jobs count, average service time, and on-time rate
**Validates: Requirements 9.3**

Property 25: Zero-job mechanics appear in results
*For any* active mechanic with zero completed jobs in the date range, they should appear in the performance results with zero values for completed jobs, average time, and on-time rate
**Validates: Requirements 9.4**

Property 26: KPI dashboard eliminates all mock data
*For any* data displayed in the KPI dashboard, it should be sourced from database queries without any hardcoded or mock values
**Validates: Requirements 9.5**

## Error Handling

### Delete Operations

**Validation Errors:**
- Service type has associated bookings → Return error message, prevent deletion
- Mechanic has active/pending assignments → Return error message, prevent deletion
- Entity not found → Return error message
- User lacks permissions → Return unauthorized error

**Database Errors:**
- Foreign key constraint violation → Return error message
- Connection failure → Return error message
- Transaction failure → Rollback, return error message

**UI Error Handling:**
- Display error messages in toast notifications
- Keep confirmation dialog open on error
- Log errors to console for debugging

### Audit Logging

**Silent Failure Pattern:**
- Audit logging failures should never block primary operations
- Log audit errors to console with `console.error()`
- Continue with primary operation even if audit fails
- This ensures system availability over audit completeness

**Error Scenarios:**
- Database connection failure during audit insert
- Invalid audit data format
- Missing actor information
- Audit table unavailable

### Overload Detection

**Query Errors:**
- Mechanics table unavailable → Return empty overload result
- Assignments table unavailable → Skip mechanic, continue with others
- Invalid mechanic ID → Return null for specific mechanic query
- Date calculation errors → Use default date range

**Calculation Errors:**
- Missing capacity data → Use default 480 minutes (8 hours)
- Missing service duration → Use default 60 minutes
- Division by zero → Return 0% utilization

### KPI Dashboard

**Data Availability:**
- No bookings in date range → Return zero metrics
- No mechanics in system → Return empty performance array
- Missing service_progress records → Use scheduled duration as fallback
- Invalid date range → Use default last 30 days

**Calculation Errors:**
- Division by zero in averages → Return 0
- Null/undefined values → Use default values or skip
- Invalid timestamps → Skip record, log warning

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of delete operations with and without dependencies
- Confirmation dialog interactions (confirm/cancel)
- Audit log creation for specific operations
- Error handling scenarios (missing data, invalid input)
- Edge cases (zero mechanics, empty date ranges)
- Integration between components (delete button → dialog → action)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Delete operations across all entity types
- Audit logging for all CRUD operations
- Overload detection calculations for any mechanic workload
- KPI calculations for any date range and booking set
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Testing Library:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: system-improvements-crud-audit-kpi, Property {number}: {property_text}`

**Property Test Examples:**

```typescript
// Feature: system-improvements-crud-audit-kpi, Property 3: Confirmed deletion removes entity from database
test('confirmed deletion removes entity', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        id: fc.uuid(),
        name: fc.string(),
        price: fc.float({ min: 0, max: 10000 })
      }),
      async (serviceType) => {
        // Create service type
        await createServiceType(serviceType);
        
        // Delete it
        const result = await deleteService(serviceType.id);
        
        // Verify it's gone
        const found = await getServiceType(serviceType.id);
        expect(found).toBeNull();
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: system-improvements-crud-audit-kpi, Property 7: Create operations generate audit logs
test('create operations generate audit logs', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string(),
        price: fc.float({ min: 0, max: 10000 }),
        duration: fc.integer({ min: 15, max: 480 })
      }),
      async (serviceType) => {
        // Create service type
        const result = await createServiceType(serviceType);
        
        // Check audit log exists
        const auditLogs = await getAuditLogs({
          entity: 'service_type',
          action: 'create_service_type',
          entity_id: result.id
        });
        
        expect(auditLogs.length).toBeGreaterThan(0);
        expect(auditLogs[0].action).toBe('create_service_type');
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: system-improvements-crud-audit-kpi, Property 19: Overload threshold correctly identifies overloaded mechanics
test('overload threshold identifies overloaded mechanics', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        mechanicId: fc.uuid(),
        capacity: fc.integer({ min: 240, max: 600 }),
        workload: fc.integer({ min: 0, max: 600 })
      }),
      async ({ mechanicId, capacity, workload }) => {
        // Setup mechanic with capacity
        await setupMechanic(mechanicId, capacity);
        
        // Create bookings totaling workload
        await createBookingsForMechanic(mechanicId, workload);
        
        // Check overload status
        const status = await getMechanicOverloadStatus(mechanicId);
        
        const expectedOverload = (workload / capacity) >= 0.8;
        expect(status.isOverloaded).toBe(expectedOverload);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

```typescript
describe('Delete Service Type', () => {
  it('should prevent deletion when service type has bookings', async () => {
    const serviceType = await createServiceType({ name: 'Oil Change' });
    await createBooking({ serviceTypeId: serviceType.id });
    
    const result = await deleteService(serviceType.id);
    
    expect(result.error).toContain('associated bookings');
    
    const stillExists = await getServiceType(serviceType.id);
    expect(stillExists).not.toBeNull();
  });
  
  it('should show confirmation dialog on delete button click', async () => {
    const { getByText, queryByText } = render(<ServiceTypesPage />);
    
    const deleteButton = getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(queryByText('Are you sure')).toBeInTheDocument();
  });
});

describe('Audit Logging', () => {
  it('should continue operation when audit logging fails', async () => {
    // Mock audit logging to fail
    jest.spyOn(auditActions, 'logAuditActivity').mockRejectedValue(new Error('Audit failed'));
    
    const result = await createServiceType({ name: 'Test Service' });
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });
});

describe('KPI Dashboard', () => {
  it('should show zero metrics for mechanics with no completed jobs', async () => {
    const mechanic = await createMechanic({ name: 'New Mechanic' });
    
    const kpiData = await calculateKPIMetrics();
    
    const mechanicPerf = kpiData.mechanicPerformance.find(m => m.name === 'New Mechanic');
    expect(mechanicPerf).toBeDefined();
    expect(mechanicPerf.completedJobs).toBe(0);
    expect(mechanicPerf.avgTime).toBe(0);
    expect(mechanicPerf.onTimeRate).toBe(0);
  });
});
```

### Integration Testing

**Delete Flow Integration:**
1. Render admin page with service types/mechanics
2. Click delete button
3. Verify confirmation dialog appears
4. Confirm deletion
5. Verify entity removed from database
6. Verify audit log created
7. Verify UI refreshed

**Audit Logging Integration:**
1. Perform CRUD operation
2. Verify primary operation succeeds
3. Verify audit log created with correct fields
4. Verify audit log queryable through admin interface

**Overload Detection Integration:**
1. Create mechanics with various capacities
2. Create bookings assigned to mechanics
3. Call overload detection
4. Verify correct mechanics marked as overloaded
5. Verify API endpoint returns same data

**KPI Dashboard Integration:**
1. Create test data (mechanics, bookings, service progress)
2. Load KPI dashboard
3. Verify all charts use real data
4. Verify no mock data present
5. Verify calculations match expected values

### Test Data Requirements

**For Delete Tests:**
- Service types with and without bookings
- Mechanics with and without assignments
- Various user roles (admin, owner, customer)

**For Audit Tests:**
- All CRUD operations across all entities
- Various user actors
- Success and failure scenarios

**For Overload Tests:**
- Mechanics with various capacities (240-600 minutes)
- Bookings with various durations (15-240 minutes)
- Different dates (today, yesterday, tomorrow)

**For KPI Tests:**
- Multiple mechanics with varying performance
- Bookings across different date ranges
- Service progress records with various durations
- Edge cases (zero bookings, zero mechanics)
