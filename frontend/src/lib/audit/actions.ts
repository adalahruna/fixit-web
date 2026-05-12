'use server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/utils';

export interface AuditLogEntry {
  id?: string;
  actor_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  timestamp_log?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log audit activity
 */
export async function logAuditActivity(
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const user = await getUser();

    const auditEntry: AuditLogEntry = {
      actor_id: user?.id || null,
      action,
      entity,
      entity_id: entityId,
      metadata: metadata || {}
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditEntry);

    if (error) {
      console.error('Failed to log audit activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Silent fail - audit logging shouldn't break main functionality
  }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(
  page: number = 1,
  limit: number = 50,
  filters?: {
    entity?: string;
    action?: string;
    actor_id?: string;
    start_date?: string;
    end_date?: string;
  }
) {
  const supabase = await createClient();
  
  // First, check if the audit_logs table exists and has data
  const { data: testData, error: testError } = await supabase
    .from('audit_logs')
    .select('id')
    .limit(1);

  if (testError) {
    // If table doesn't exist or has issues, return empty result
    console.warn('Audit logs table not accessible:', testError.message);
    return {
      logs: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0
    };
  }
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp_log', { ascending: false });

  // Apply filters
  if (filters?.entity) {
    query = query.eq('entity', filters.entity);
  }
  if (filters?.action) {
    query = query.eq('action', filters.action);
  }
  if (filters?.actor_id) {
    query = query.eq('actor_id', filters.actor_id);
  }
  if (filters?.start_date) {
    query = query.gte('timestamp_log', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('timestamp_log', filters.end_date);
  }

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: logs, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return {
      logs: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0
    };
  }

  // Get unique actor IDs and fetch user information
  const actorIds = [...new Set(logs?.map(log => log.actor_id).filter(Boolean) || [])];
  let actors: Record<string, { id: string; name: string; email: string; role: string }> = {};
  
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('id', actorIds);
    
    if (users) {
      actors = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, { id: string; name: string; email: string; role: string }>);
    }
  }

  // Attach actor information to logs
  const logsWithActors = logs?.map(log => ({
    ...log,
    actor: log.actor_id ? actors[log.actor_id] : null
  })) || [];

  return {
    logs: logsWithActors,
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit)
  };
}