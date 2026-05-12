-- Run this script in your Supabase SQL Editor to add audit logging support
-- Migration 005: Add Audit Logs Table

-- Step 1: Clean up any existing table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Step 2: Create the table with all columns
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    timestamp_log TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Step 3: Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Step 4: Add foreign key constraint
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_actor_id 
FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 5: Create indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp_log);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Step 6: Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'owner')
        )
    );

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Step 8: Test the table
INSERT INTO audit_logs (action, entity, metadata) 
VALUES ('test_migration', 'system', '{"migration": "005", "test": true}');

-- Step 9: Verify the test record
SELECT id, action, entity, timestamp_log FROM audit_logs WHERE action = 'test_migration';

-- Step 10: Clean up test record
DELETE FROM audit_logs WHERE action = 'test_migration';

-- Final verification
SELECT 'Audit logs table created and tested successfully!' as result;