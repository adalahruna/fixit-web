/**
 * Authentication Error Handler
 * 
 * Provides comprehensive error handling with classification, retry logic,
 * rate limiting, and detailed logging for authentication operations.
 */

import type { AuthError } from '@supabase/supabase-js';

interface ErrorContext {
  operation: 'login' | 'refresh' | 'logout' | 'getUser' | 'register';
  url?: string;
  userAgent?: string;
  timestamp: Date;
  attemptCount?: number;
}

interface ErrorResult {
  action: 'retry' | 'logout' | 'redirect' | 'ignore';
  message?: string;
  redirectUrl?: string;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
}

type AuthErrorCode = 
  | 'refresh_token_not_found'
  | 'invalid_refresh_token'
  | 'token_expired'
  | 'network_error'
  | 'session_not_found'
  | 'invalid_session'
  | 'rate_limit_exceeded'
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_not_confirmed'
  | 'signup_disabled';

class AuthErrorHandler {
  private rateLimitMap: Map<string, RateLimitEntry>;
  private readonly maxAttempts: number;
  private readonly rateLimitWindow: number; // in milliseconds
  private readonly baseRetryDelay: number; // in milliseconds

  constructor() {
    this.rateLimitMap = new Map();
    this.maxAttempts = 5;
    this.rateLimitWindow = 15 * 60 * 1000; // 15 minutes
    this.baseRetryDelay = 1000; // 1 second
  }

  /**
   * Handle authentication error with comprehensive logic
   */
  async handleError(error: AuthError, context: ErrorContext): Promise<ErrorResult> {
    try {
      // Log error for debugging
      this.logError(error, context);

      // Check rate limiting
      if (this.isRateLimited(context)) {
        return {
          action: 'redirect',
          message: 'Too many authentication attempts. Please try again later.',
          redirectUrl: '/login',
          retryAfter: this.getRateLimitRetryAfter(context),
        };
      }

      // Update rate limiting counters
      this.updateRateLimit(context);

      // Classify error and determine action
      const errorCode = this.classifyError(error);
      const isRecoverable = this.isRecoverable(error);

      switch (errorCode) {
        case 'refresh_token_not_found':
        case 'invalid_refresh_token':
          return {
            action: 'logout',
            message: 'Your session has expired. Please log in again.',
            redirectUrl: '/login',
          };

        case 'network_error':
          if (isRecoverable && this.shouldRetry(error, context.attemptCount || 0)) {
            return {
              action: 'retry',
              retryAfter: this.calculateRetryDelay(context.attemptCount || 0),
            };
          }
          return {
            action: 'redirect',
            message: 'Network error. Please check your connection and try again.',
            redirectUrl: '/login',
          };

        case 'invalid_credentials':
          return {
            action: 'ignore',
            message: 'Invalid email or password. Please try again.',
          };

        case 'email_not_confirmed':
          return {
            action: 'redirect',
            message: 'Please check your email and click the confirmation link.',
            redirectUrl: '/login?message=check-email',
          };

        case 'user_not_found':
          return {
            action: 'ignore',
            message: 'No account found with this email address.',
          };

        case 'signup_disabled':
          return {
            action: 'redirect',
            message: 'Account registration is currently disabled.',
            redirectUrl: '/login',
          };

        case 'session_not_found':
        case 'invalid_session':
          return {
            action: 'logout',
            message: 'Your session is invalid. Please log in again.',
            redirectUrl: '/login',
          };

        case 'token_expired':
          if (context.operation === 'refresh') {
            return {
              action: 'logout',
              message: 'Your session has expired. Please log in again.',
              redirectUrl: '/login',
            };
          }
          return {
            action: 'retry',
            retryAfter: 100, // Immediate retry for token refresh
          };

        default:
          // Unknown error - be conservative
          if (isRecoverable && this.shouldRetry(error, context.attemptCount || 0)) {
            return {
              action: 'retry',
              retryAfter: this.calculateRetryDelay(context.attemptCount || 0),
            };
          }
          return {
            action: 'logout',
            message: 'An authentication error occurred. Please log in again.',
            redirectUrl: '/login',
          };
      }
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      return {
        action: 'logout',
        message: 'A system error occurred. Please log in again.',
        redirectUrl: '/login',
      };
    }
  }

  /**
   * Classify error based on message and properties
   */
  private classifyError(error: AuthError): AuthErrorCode {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('refresh_token_not_found') || 
        message.includes('refresh token not found')) {
      return 'refresh_token_not_found';
    }
    
    if (message.includes('invalid refresh token') || 
        message.includes('invalid_refresh_token')) {
      return 'invalid_refresh_token';
    }
    
    if (message.includes('token expired') || 
        message.includes('jwt expired')) {
      return 'token_expired';
    }
    
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('connection')) {
      return 'network_error';
    }
    
    if (message.includes('session not found')) {
      return 'session_not_found';
    }
    
    if (message.includes('invalid session')) {
      return 'invalid_session';
    }
    
    if (message.includes('invalid login credentials') || 
        message.includes('invalid email or password')) {
      return 'invalid_credentials';
    }
    
    if (message.includes('email not confirmed') || 
        message.includes('confirm your email')) {
      return 'email_not_confirmed';
    }
    
    if (message.includes('user not found')) {
      return 'user_not_found';
    }
    
    if (message.includes('signup disabled') || 
        message.includes('signups not allowed')) {
      return 'signup_disabled';
    }
    
    // Default to network error for unknown errors
    return 'network_error';
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: AuthError): boolean {
    const recoverableErrors: AuthErrorCode[] = [
      'network_error',
      'token_expired',
    ];
    
    const errorCode = this.classifyError(error);
    return recoverableErrors.includes(errorCode);
  }

  /**
   * Determine if retry should be attempted
   */
  shouldRetry(error: AuthError, attemptCount: number): boolean {
    if (attemptCount >= 3) {
      return false;
    }
    
    return this.isRecoverable(error);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attemptCount: number): number {
    return Math.min(
      this.baseRetryDelay * Math.pow(2, attemptCount),
      30000 // Max 30 seconds
    );
  }

  /**
   * Check if operation is rate limited
   */
  private isRateLimited(context: ErrorContext): boolean {
    const key = this.getRateLimitKey(context);
    const entry = this.rateLimitMap.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.rateLimitWindow);
    
    // Clean up old entries
    if (entry.firstAttempt < windowStart) {
      this.rateLimitMap.delete(key);
      return false;
    }
    
    return entry.count >= this.maxAttempts;
  }

  /**
   * Update rate limiting counters
   */
  private updateRateLimit(context: ErrorContext): void {
    const key = this.getRateLimitKey(context);
    const now = new Date();
    const entry = this.rateLimitMap.get(key);
    
    if (entry) {
      const windowStart = new Date(now.getTime() - this.rateLimitWindow);
      
      if (entry.firstAttempt < windowStart) {
        // Reset counter for new window
        this.rateLimitMap.set(key, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
        });
      } else {
        // Increment counter
        entry.count++;
        entry.lastAttempt = now;
      }
    } else {
      // First attempt
      this.rateLimitMap.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    }
  }

  /**
   * Get rate limit key for context
   */
  private getRateLimitKey(context: ErrorContext): string {
    // Use operation and user agent as key
    return `${context.operation}:${context.userAgent || 'unknown'}`;
  }

  /**
   * Get retry after time for rate limited requests
   */
  private getRateLimitRetryAfter(context: ErrorContext): number {
    const key = this.getRateLimitKey(context);
    const entry = this.rateLimitMap.get(key);
    
    if (!entry) {
      return 0;
    }
    
    const windowEnd = new Date(entry.firstAttempt.getTime() + this.rateLimitWindow);
    return Math.max(0, windowEnd.getTime() - Date.now());
  }

  /**
   * Log error with context and sanitization
   */
  logError(error: AuthError, context: ErrorContext): void {
    try {
      const sanitizedContext = {
        operation: context.operation,
        url: context.url ? this.sanitizeUrl(context.url) : undefined,
        userAgent: context.userAgent ? this.sanitizeUserAgent(context.userAgent) : undefined,
        timestamp: context.timestamp.toISOString(),
        attemptCount: context.attemptCount,
      };

      const logEntry = {
        level: 'error',
        message: 'Authentication error occurred',
        error: {
          code: error.name || 'unknown',
          message: this.sanitizeErrorMessage(error.message || ''),
          status: (error as any).status,
        },
        context: sanitizedContext,
        errorCode: this.classifyError(error),
        recoverable: this.isRecoverable(error),
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth Error:', logEntry);
      }

      // In production, you might want to send to a logging service
      // this.sendToLoggingService(logEntry);
    } catch (loggingError) {
      console.error('Failed to log authentication error:', loggingError);
    }
  }

  /**
   * Sanitize URL to remove sensitive information
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters that might contain sensitive data
      urlObj.search = '';
      urlObj.hash = '';
      return urlObj.toString();
    } catch {
      return '[invalid-url]';
    }
  }

  /**
   * Sanitize user agent to remove potentially identifying information
   */
  private sanitizeUserAgent(userAgent: string): string {
    // Keep only browser and version info, remove detailed system info
    const match = userAgent.match(/^([^/]+\/[^\s]+)/);
    return match ? match[1] : '[sanitized]';
  }

  /**
   * Sanitize error message to prevent sensitive data exposure
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential tokens, emails, or other sensitive data
    return message
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      .replace(/[A-Za-z0-9+/]{20,}/g, '[token]')
      .replace(/\b\d{4,}\b/g, '[number]');
  }

  /**
   * Clear rate limiting data (useful for testing or admin operations)
   */
  clearRateLimit(operation?: string): void {
    if (operation) {
      // Clear specific operation
      for (const [key] of this.rateLimitMap) {
        if (key.startsWith(`${operation}:`)) {
          this.rateLimitMap.delete(key);
        }
      }
    } else {
      // Clear all
      this.rateLimitMap.clear();
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(context: ErrorContext): {
    isLimited: boolean;
    count: number;
    retryAfter: number;
  } {
    const key = this.getRateLimitKey(context);
    const entry = this.rateLimitMap.get(key);
    
    if (!entry) {
      return { isLimited: false, count: 0, retryAfter: 0 };
    }
    
    return {
      isLimited: this.isRateLimited(context),
      count: entry.count,
      retryAfter: this.getRateLimitRetryAfter(context),
    };
  }
}

// Create singleton instance
const authErrorHandler = new AuthErrorHandler();

export default authErrorHandler;
export type { ErrorContext, ErrorResult, AuthErrorCode };