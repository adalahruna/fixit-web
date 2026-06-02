# Implementation Plan - Multiple Fixes

## Priority Order

### 1. Add Delete Buttons (HIGH PRIORITY - Quick Win)
**Services:**
- ✅ Delete action already exists in `frontend/src/lib/services/actions.ts`
- ❌ Need to add delete button with confirmation in `frontend/src/app/admin/services/page.tsx`
- ❌ Need to add audit log

**Mechanics:**
- ❌ Need to add delete action in `frontend/src/lib/mechanics/actions.ts`
- ❌ Need to add delete button with confirmation in `frontend/src/app/admin/mechanics/page.tsx`
- ❌ Need to add audit log

### 2. Fix Audit Logs (HIGH PRIORITY - System Integrity)
Current state: Only logs booking creation

Missing audit logs for:
- Booking updates (reschedule, cancel, status changes)
- Service type CRUD
- Mechanic CRUD
- Assignment operations
- Service progress operations

Files to update:
- `frontend/src/lib/bookings/actions.ts` - add audit for reschedule
- `frontend/src/lib/bookings/cancel-actions.ts` - add audit for cancel
- `frontend/src/lib/services/actions.ts` - add audit for create/update/delete
- `frontend/src/lib/mechanics/actions.ts` - add audit for create/update/delete
- `frontend/src/lib/assignments/actions.ts` - add audit for assign/unassign
- `frontend/src/lib/progress/actions.ts` - add audit for start/complete

### 3. Fix Mechanic Overload Detection (MEDIUM PRIORITY)
Files to check:
- `frontend/src/lib/utils/overload-detection.ts`
- `frontend/src/app/api/overload/mechanic/[id]/route.ts`
- `frontend/src/components/warnings/OverloadWarning.tsx`

Need to verify:
- Logic for calculating workload
- Threshold settings
- Real-time detection

### 4. Fix KPI Chart - Real Data (MEDIUM PRIORITY)
File: `frontend/src/app/admin/dashboard/page.tsx`

Currently using mock data. Need to:
- Query real mechanic performance from database
- Calculate actual completion rates
- Calculate actual average times
- Show real booking trends

## Implementation Notes

### Delete Functionality Requirements
1. Confirmation dialog before delete
2. Check for dependencies (e.g., can't delete service if used in bookings)
3. Soft delete vs hard delete consideration
4. Audit log entry
5. Success/error feedback

### Audit Log Requirements
All actions should log:
- Action type (create, update, delete, assign, etc.)
- Entity type (booking, service, mechanic, etc.)
- Entity ID
- User ID (who performed the action)
- Timestamp
- Changes (old value → new value for updates)

### Overload Detection Requirements
- Calculate total assigned work minutes per mechanic
- Compare against daily_capacity_minutes
- Consider only active/pending bookings
- Show warning when > 80% capacity
- Show critical when > 100% capacity
