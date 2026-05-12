import { logAuditActivity } from '@/lib/audit/actions';
import { AUDIT_ENTITIES } from '@/lib/audit/constants';

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export class BusinessError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends BusinessError {
  constructor(message: string = 'Unauthorized access') {
    super('AUTHORIZATION_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT_ERROR', message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Global error handler for server actions
 */
export async function handleServerError(
  error: unknown,
  context?: {
    action?: string;
    entity?: string;
    entityId?: string;
    userId?: string;
  }
): Promise<AppError> {
  console.error('Server error:', error);

  // Log error to audit system
  if (context) {
    await logAuditActivity(
      `error_${context.action || 'unknown'}`,
      context.entity || AUDIT_ENTITIES.SYSTEM,
      context.entityId,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context
      }
    );
  }

  // Handle known error types
  if (error instanceof BusinessError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode
    };
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code?: string; message?: string };
    
    switch (supabaseError.code) {
      case '23505': // Unique constraint violation
        return {
          code: 'DUPLICATE_ENTRY',
          message: 'Data already exists',
          statusCode: 409
        };
      case '23503': // Foreign key constraint violation
        return {
          code: 'REFERENCE_ERROR',
          message: 'Referenced data not found',
          statusCode: 400
        };
      case '42501': // Insufficient privilege
        return {
          code: 'PERMISSION_DENIED',
          message: 'Insufficient permissions',
          statusCode: 403
        };
      default:
        return {
          code: 'DATABASE_ERROR',
          message: supabaseError.message || 'Database operation failed',
          statusCode: 500
        };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      statusCode: 500
    };
  }

  // Fallback for unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500
  };
}

/**
 * Error response formatter for API routes
 */
export function formatErrorResponse(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  };
}

/**
 * Client-side error handler
 */
export function handleClientError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message;
  }
  
  return 'An unexpected error occurred';
}