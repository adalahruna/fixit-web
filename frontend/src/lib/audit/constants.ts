/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  
  // Booking actions
  CREATE_BOOKING: 'create_booking',
  UPDATE_BOOKING: 'update_booking',
  CANCEL_BOOKING: 'cancel_booking',
  RESCHEDULE_BOOKING: 'reschedule_booking',
  
  // Assignment actions
  ASSIGN_MECHANIC: 'assign_mechanic',
  UNASSIGN_MECHANIC: 'unassign_mechanic',
  
  // Service progress actions
  START_SERVICE: 'start_service',
  COMPLETE_SERVICE: 'complete_service',
  PAUSE_SERVICE: 'pause_service',
  
  // Master data actions
  CREATE_SERVICE_TYPE: 'create_service_type',
  UPDATE_SERVICE_TYPE: 'update_service_type',
  DELETE_SERVICE_TYPE: 'delete_service_type',
  CREATE_MECHANIC: 'create_mechanic',
  UPDATE_MECHANIC: 'update_mechanic',
  DELETE_MECHANIC: 'delete_mechanic',
  
  // Admin actions
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_SLA_REPORT: 'view_sla_report',
  VIEW_OVERLOAD_REPORT: 'view_overload_report'
} as const;

/**
 * Entity types
 */
export const AUDIT_ENTITIES = {
  USER: 'user',
  BOOKING: 'booking',
  MECHANIC: 'mechanic',
  SERVICE_TYPE: 'service_type',
  ASSIGNMENT: 'assignment',
  SERVICE_PROGRESS: 'service_progress',
  SYSTEM: 'system'
} as const;