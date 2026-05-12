-- Migration: Add Audit Logs Table
-- Created: 2026-03-18
-- Description: Add audit_logs table for tracking user activities

-- First, drop the table if it exists (in case of partial creation)
DROP TABLE IF EXISTS audit_logs;

-- Table: audit_logs
-- Log semua aktivitas penting
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    timestamp_log TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Add foreign key constraint separately (more reliable)
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_actor_id 
FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp_log);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;

-- RLS Policy: Only admin and owner can view audit logs
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'owner')
        )
    );

-- RLS Policy: Allow insert for all authenticated users (for logging)
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT
    WITH CHECK (true);