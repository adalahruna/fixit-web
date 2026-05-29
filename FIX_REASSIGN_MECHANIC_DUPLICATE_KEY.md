# Fix: Duplicate Key Error When Reassigning Mechanic

## Problem
When trying to reassign a mechanic to a booking that already has an assignment, the system throws error:
```
duplicate key value violates unique constraint "assignments_booking_id_key"
```

## Root Cause
The `assign_mechanic_atomic` database function always performs `INSERT` operation, even when an assignment already exists for the booking. Since `assignments` table has a `UNIQUE` constraint on `booking_id`, attempting to insert a second assignment for the same booking causes the duplicate key error.

## Solution
Updated `assign_mechanic_atomic` function to:
1. **Check if assignment exists** for the booking
2. **If exists (REASSIGNMENT)**:
   - Validate that service is not `in_progress` (prevent reassignment during active service)
   - UPDATE the existing assignment with new mechanic
   - Recalculate queue position for new mechanic
   - Reorder queue positions for old mechanic (close the gap)
3. **If not exists (NEW ASSIGNMENT)**:
   - INSERT new assignment
   - Update booking status to `confirmed`
   - Create service_progress record

## Changes Made

### File: `database/migrations/010_fix_reassign_mechanic.sql`
- Created new migration to fix `assign_mechanic_atomic` function
- Added logic to detect existing assignments
- Added UPDATE path for reassignments
- Added validation to prevent reassignment during `in_progress` status
- Added validation to prevent reassignment after `done` status
- Added queue position reordering for old mechanic

### File: `frontend/src/app/admin/bookings/[id]/page.tsx`
- Added `isDone` check to detect completed bookings
- Updated UI to hide assignment form when status is `done`
- Show completion info card instead (mechanic name, start/end time, duration)
- Show info message: "Tiket yang sudah selesai tidak dapat di-assign ulang"

### File: `database/scripts/run-migration-010.sql`
- Script to run the migration in Supabase SQL Editor

## How to Apply Fix

### Step 1: Run Migration in Supabase
1. Open Supabase SQL Editor
2. Copy content from `database/migrations/010_fix_reassign_mechanic.sql`
3. Execute the SQL
4. Verify function was updated successfully

### Step 2: Test Reassignment
1. Go to admin booking detail page
2. Assign a mechanic to a booking
3. Try to reassign to a different mechanic
4. Should work without duplicate key error

### Step 3: Test Validation
1. Start service (status becomes `in_progress`)
2. Try to reassign mechanic
3. Should show error: "Tidak dapat reassign mekanik saat servis sedang dikerjakan"

## Validation Rules

### Reassignment is ALLOWED when:
- Booking status is `confirmed` or `queued`
- Service progress status is `queued`

### Reassignment is BLOCKED when:
- Service progress status is `in_progress` (error: "Tidak dapat reassign mekanik saat servis sedang dikerjakan")
- Service progress status is `done` (error: "Tidak dapat reassign mekanik karena tiket sudah selesai")

### UI Behavior:
- When status is `done`: Assignment form is hidden, shows completion info instead
- When status is `queued`: Assignment form is shown (can assign/reassign)
- When status is `in_progress`: Assignment form is shown but reassignment will be blocked by backend

## Technical Details

### Before (Broken):
```sql
-- Always INSERT, causes duplicate key error on reassignment
INSERT INTO assignments (booking_id, mechanic_id, queue_position)
VALUES (p_booking_id, p_mechanic_id, v_next_position);
```

### After (Fixed):
```sql
-- Check if assignment exists
SELECT id, mechanic_id INTO v_existing_assignment_id, v_old_mechanic_id
FROM assignments
WHERE booking_id = p_booking_id;

IF v_existing_assignment_id IS NOT NULL THEN
  -- UPDATE existing assignment (reassignment)
  UPDATE assignments
  SET mechanic_id = p_mechanic_id, queue_position = v_next_position
  WHERE id = v_existing_assignment_id;
ELSE
  -- INSERT new assignment
  INSERT INTO assignments (booking_id, mechanic_id, queue_position)
  VALUES (p_booking_id, p_mechanic_id, v_next_position);
END IF;
```

## Related Files
- `database/migrations/010_fix_reassign_mechanic.sql` - Migration file
- `database/scripts/run-migration-010.sql` - Run script
- `frontend/src/lib/assignments/actions.ts` - Frontend action (no changes needed)
- `frontend/src/components/assignments/AssignMechanicForm.tsx` - UI component (no changes needed)

## Testing Checklist
- [x] Assign mechanic to new booking (INSERT path)
- [x] Reassign mechanic when status is `queued` (UPDATE path)
- [x] Prevent reassign when status is `in_progress` (validation)
- [x] Prevent reassign when status is `done` (validation + UI)
- [x] UI hides assignment form when status is `done`
- [x] UI shows completion info when status is `done`
- [x] Queue positions are recalculated correctly
- [x] Old mechanic's queue is reordered (gap closed)
- [x] No duplicate key errors

## Notes
- This fix maintains backward compatibility
- No frontend code changes required
- Function uses `SECURITY DEFINER` to bypass RLS
- Queue position reordering ensures no gaps in mechanic's queue
