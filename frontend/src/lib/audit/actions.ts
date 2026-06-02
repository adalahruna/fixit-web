'use server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/utils';

interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  timestamp_log: string;
  metadata?: Record<string, unknown>;
}

interface AuditLogWithActor extends AuditLog {
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AuditLogsResponse {
  logs: AuditLogWithActor[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface AuditFilters {
  entity?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Get paginated audit logs with optional filters
 * @param page - Page number (1-indexed)
 * @param limit - Number of logs per page
 * @param filters - Optional filters (entity, action, date range)
 * @returns Paginated audit logs with actor information
 */
export async function getAuditLogs(
  page: number = 1,
  limit: number = 50,
  filters: AuditFilters = {}
): Promise<AuditLogsResponse> {
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      action,
      entity,
      entity_id,
      timestamp_log,
      metadata
    `, { count: 'exact' });

  // Apply filters
  if (filters.entity) {
    query = query.eq('entity', filters.entity);
  }

  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`);
  }

  if (filters.start_date) {
    const startDate = new Date(filters.start_date);
    startDate.setHours(0, 0, 0, 0);
    query = query.gte('timestamp_log', startDate.toISOString());
  }

  if (filters.end_date) {
    const endDate = new Date(filters.end_date);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte('timestamp_log', endDate.toISOString());
  }

  // Order by timestamp (newest first)
  query = query.order('timestamp_log', { ascending: false });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Fetch actor data for logs that have actor_id
  const logsWithActors: AuditLogWithActor[] = [];
  
  if (data && data.length > 0) {
    // Get unique actor IDs
    const actorIds = [...new Set(data.filter(log => log.actor_id).map(log => log.actor_id))];
    
    // Fetch actor data in one query
    let actorsMap: Record<string, { id: string; name: string; email: string; role: string }> = {};
    
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', actorIds as string[]);
      
      if (actors) {
        actorsMap = actors.reduce((acc, actor) => {
          acc[actor.id] = actor;
          return acc;
        }, {} as Record<string, { id: string; name: string; email: string; role: string }>);
      }
    }
    
    // Merge logs with actor data
    for (const log of data) {
      logsWithActors.push({
        ...log,
        actor: log.actor_id && actorsMap[log.actor_id] ? actorsMap[log.actor_id] : null
      });
    }
  }

  return {
    logs: logsWithActors,
    totalCount,
    currentPage: page,
    totalPages
  };
}

/**
 * Get audit logs for a specific entity
 * @param entity - Entity type (e.g., 'booking', 'user')
 * @param entityId - Entity ID
 * @param limit - Maximum number of logs to return
 * @returns Audit logs for the specified entity
 */
export async function getEntityAuditLogs(
  entity: string,
  entityId: string,
  limit: number = 100
): Promise<AuditLogWithActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      action,
      entity,
      entity_id,
      timestamp_log,
      metadata
    `)
    .eq('entity', entity)
    .eq('entity_id', entityId)
    .order('timestamp_log', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching entity audit logs:', error);
    throw new Error(`Failed to fetch entity audit logs: ${error.message}`);
  }

  // Fetch actor data
  const logsWithActors: AuditLogWithActor[] = [];
  
  if (data && data.length > 0) {
    const actorIds = [...new Set(data.filter(log => log.actor_id).map(log => log.actor_id))];
    let actorsMap: Record<string, { id: string; name: string; email: string; role: string }> = {};
    
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', actorIds as string[]);
      
      if (actors) {
        actorsMap = actors.reduce((acc, actor) => {
          acc[actor.id] = actor;
          return acc;
        }, {} as Record<string, { id: string; name: string; email: string; role: string }>);
      }
    }
    
    for (const log of data) {
      logsWithActors.push({
        ...log,
        actor: log.actor_id && actorsMap[log.actor_id] ? actorsMap[log.actor_id] : null
      });
    }
  }

  return logsWithActors;
}

/**
 * Get recent audit logs (last 24 hours)
 * @param limit - Maximum number of logs to return
 * @returns Recent audit logs
 */
export async function getRecentAuditLogs(
  limit: number = 50
): Promise<AuditLogWithActor[]> {
  const supabase = await createClient();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      action,
      entity,
      entity_id,
      timestamp_log,
      metadata
    `)
    .gte('timestamp_log', yesterday.toISOString())
    .order('timestamp_log', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent audit logs:', error);
    throw new Error(`Failed to fetch recent audit logs: ${error.message}`);
  }

  // Fetch actor data
  const logsWithActors: AuditLogWithActor[] = [];
  
  if (data && data.length > 0) {
    const actorIds = [...new Set(data.filter(log => log.actor_id).map(log => log.actor_id))];
    let actorsMap: Record<string, { id: string; name: string; email: string; role: string }> = {};
    
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', actorIds as string[]);
      
      if (actors) {
        actorsMap = actors.reduce((acc, actor) => {
          acc[actor.id] = actor;
          return acc;
        }, {} as Record<string, { id: string; name: string; email: string; role: string }>);
      }
    }
    
    for (const log of data) {
      logsWithActors.push({
        ...log,
        actor: log.actor_id && actorsMap[log.actor_id] ? actorsMap[log.actor_id] : null
      });
    }
  }

  return logsWithActors;
}

/**
 * Log an audit activity
 * @param actorId - ID of the user performing the action (optional, will use current user if not provided)
 * @param action - The action being performed (e.g., 'create_booking', 'delete_service_type')
 * @param entity - The entity type (e.g., 'booking', 'service_type', 'user')
 * @param entityId - The ID of the entity being acted upon (optional for system-level actions)
 * @param metadata - Additional metadata about the action
 */
export async function logAuditActivity(
  actorId: string | null | undefined,
  action: string,
  entity: string,
  entityId: string | undefined,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();

    // If no actorId provided, try to get current user
    let finalActorId = actorId;
    if (!finalActorId) {
      try {
        const user = await getUser();
        finalActorId = user?.id || null;
      } catch {
        // If we can't get user, log as system action (null actor_id)
        finalActorId = null;
      }
    }

    // Create audit log entry
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: finalActorId,
        action,
        entity,
        entity_id: entityId,
        metadata: metadata || {},
        timestamp_log: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Error in logAuditActivity:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a system audit activity (without actor)
 * @param action - The action being performed
 * @param entity - The entity type
 * @param entityId - The ID of the entity being acted upon (optional for system-level actions)
 * @param metadata - Additional metadata about the action
 */
export async function logSystemAuditActivity(
  action: string,
  entity: string,
  entityId: string | undefined,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logAuditActivity(null, action, entity, entityId, metadata);
}
