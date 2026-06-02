# Fixes Needed

## 1. Add Delete Button for Service Types (Jenis Servis)
- [ ] Add delete action in `frontend/src/lib/services/actions.ts`
- [ ] Add delete button in service list page
- [ ] Add confirmation dialog
- [ ] Add audit log for delete action

## 2. Add Delete Button for Mechanics
- [ ] Add delete action in `frontend/src/lib/mechanics/actions.ts`
- [ ] Add delete button in mechanics list page
- [ ] Add confirmation dialog
- [ ] Add audit log for delete action

## 3. Fix Audit Logs - Missing Actions
Currently only logs: create booking
Missing:
- [ ] Update booking (reschedule, cancel)
- [ ] Create/Update/Delete service types
- [ ] Create/Update/Delete mechanics
- [ ] Assign/Unassign mechanic
- [ ] Start/Complete service progress
- [ ] User login/logout

## 4. Fix Mechanic Overload Detection
- [ ] Check overload detection logic in `frontend/src/lib/utils/overload-detection.ts`
- [ ] Verify API endpoint `/api/overload/mechanic/[id]`
- [ ] Test with real data

## 5. Fix KPI Chart - Use Real Data from Database
Currently using mock data
- [ ] Update `frontend/src/app/admin/dashboard/page.tsx`
- [ ] Query real mechanic performance data
- [ ] Calculate actual metrics from database
