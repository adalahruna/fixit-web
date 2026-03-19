-- Migration: RLS Policies
-- Created: 2026-03-14
-- Description: Setup Row Level Security policies untuk semua tabel

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own data (for registration)
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- SERVICE_TYPES TABLE POLICIES
-- ============================================

-- Everyone can read service types
CREATE POLICY "Anyone can read service types"
ON service_types FOR SELECT
TO authenticated
USING (true);

-- Only admin/owner can insert service types
CREATE POLICY "Admin can insert service types"
ON service_types FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Only admin/owner can update service types
CREATE POLICY "Admin can update service types"
ON service_types FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Only admin/owner can delete service types
CREATE POLICY "Admin can delete service types"
ON service_types FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- ============================================
-- MECHANICS TABLE POLICIES
-- ============================================

-- Everyone can read mechanics
CREATE POLICY "Anyone can read mechanics"
ON mechanics FOR SELECT
TO authenticated
USING (true);

-- Only admin/owner can manage mechanics
CREATE POLICY "Admin can insert mechanics"
ON mechanics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admin can update mechanics"
ON mechanics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admin can delete mechanics"
ON mechanics FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- ============================================
-- BOOKINGS TABLE POLICIES (Basic - akan diperluas nanti)
-- ============================================

-- Customers can read their own bookings
CREATE POLICY "Customers can read own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Customers can update their own bookings (before assigned)
CREATE POLICY "Customers can update own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- ============================================
-- OTHER TABLES - Permissive policies for now
-- ============================================

-- booking_services
CREATE POLICY "Authenticated users can manage booking_services"
ON booking_services FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- booking_consultations
CREATE POLICY "Authenticated users can manage consultations"
ON booking_consultations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- consultation_attachments
CREATE POLICY "Authenticated users can manage attachments"
ON consultation_attachments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- internal_notes
CREATE POLICY "Staff can manage internal notes"
ON internal_notes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- assignments
CREATE POLICY "Staff can manage assignments"
ON assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- service_progress
CREATE POLICY "Staff can manage service progress"
ON service_progress FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- sla_records
CREATE POLICY "Staff can manage SLA records"
ON sla_records FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner', 'mechanic')
  )
);

-- payments
CREATE POLICY "Users can manage related payments"
ON payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- audit_logs
CREATE POLICY "Everyone can insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can read audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);
