/**
 * Session Manager for Authentication
 * 
 * Provides centralized session state management with cross-tab synchronization,
 * automatic token refresh, and robust error handling.
 */

import { supabase } from '../supabase/client';
import type { Session, User, AuthError } from '@supabase/supabase-js';

interface SessionState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  lastRefresh: Date | null;
}

interface SessionChangeCallback {
  (session: Session | null): void;
}

class SessionManager {
  private state: SessionState;
  private callbacks: Set<SessionChangeCallback>;
  private broadcastChannel: BroadcastChannel | null;
  private refreshPromise: Promise<Session | null> | null;
  private refreshTimeout: NodeJS.Timeout | null;

  constructor() {
    this.state = {
      user: null,
      session: null,
      loading: true,
      error: null,
      lastRefresh: null,
    };
    
    this.callbacks = new Set();
    this.refreshPromise = null;
    this.refreshTimeout = null;
    
    // Initialize cross-tab communication
    this.broadcastChannel = typeof window !== 'undefined' 
      ? new BroadcastChannel('supabase-auth') 
      : null;
    
    this.initialize();
  }

  /**
   * Initialize session manager
   */
  private async initialize(): Promise<void> {
    try {
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

      // Set up cross-tab communication listener
      if (this.broadcastChannel) {
        this.broadcastChannel.addEventListener('message', (event) => {
          this.handleBroadcastMessage(event);
        });
      }

      // Attempt to recover existing session
      await this.recoverSession();
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
      this.updateState({ 
        loading: false, 
        error: error as AuthError 
      });
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting current session:', error);
        this.updateState({ error });
        return null;
      }

      if (session) {
        this.updateState({ 
          session, 
          user: session.user, 
          error: null,
          loading: false 
        });
      }

      return session;
    } catch (error) {
      console.error('Failed to get current session:', error);
      this.updateState({ 
        error: error as AuthError,
        loading: false 
      });
      return null;
    }
  }

  /**
   * Refresh session with concurrency protection
   */
  async refreshSession(): Promise<Session | null> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual session refresh
   */
  private async performRefresh(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // Handle specific refresh token errors
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          await this.clearSession();
          return null;
        }
        
        this.updateState({ error });
        return null;
      }

      if (session) {
        this.updateState({ 
          session, 
          user: session.user, 
          error: null,
          lastRefresh: new Date()
        });
        
        // Schedule next proactive refresh
        this.scheduleProactiveRefresh(session);
        
        // Broadcast session change to other tabs
        this.broadcastSessionChange(session);
      }

      return session;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      this.updateState({ error: error as AuthError });
      return null;
    }
  }

  /**
   * Clear session and clean up
   */
  async clearSession(): Promise<void> {
    try {
      // Clear refresh timeout
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Update state
      this.updateState({
        user: null,
        session: null,
        error: null,
        loading: false,
        lastRefresh: null,
      });

      // Broadcast session clear to other tabs
      this.broadcastSessionChange(null);
    } catch (error) {
      console.error('Error clearing session:', error);
      // Still update state even if signOut fails
      this.updateState({
        user: null,
        session: null,
        error: error as AuthError,
        loading: false,
      });
    }
  }

  /**
   * Register callback for session changes
   */
  onSessionChange(callback: SessionChangeCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Broadcast session change to other tabs
   */
  broadcastSessionChange(session: Session | null): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'session-change',
          session: session ? {
            user: session.user,
            access_token: session.access_token,
            expires_at: session.expires_at,
          } : null,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error broadcasting session change:', error);
      }
    }
  }

  /**
   * Recover session on application startup
   */
  async recoverSession(): Promise<Session | null> {
    try {
      this.updateState({ loading: true });
      
      const session = await this.getCurrentSession();
      
      if (session) {
        // Validate session is not expired
        const now = Date.now();
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        
        if (expiresAt > now) {
          // Session is valid, schedule proactive refresh
          this.scheduleProactiveRefresh(session);
          return session;
        } else {
          // Session expired, try to refresh
          return await this.refreshSession();
        }
      }
      
      this.updateState({ loading: false });
      return null;
    } catch (error) {
      console.error('Failed to recover session:', error);
      this.updateState({ 
        error: error as AuthError,
        loading: false 
      });
      return null;
    }
  }

  /**
   * Handle session errors with recovery logic
   */
  async handleSessionError(error: AuthError): Promise<void> {
    console.error('Session error:', error);
    
    // Check if error is recoverable
    const isRecoverable = this.isRecoverableError(error);
    
    if (isRecoverable) {
      // Attempt recovery
      try {
        await this.refreshSession();
      } catch (recoveryError) {
        console.error('Session recovery failed:', recoveryError);
        await this.clearSession();
      }
    } else {
      // Non-recoverable error, clear session
      await this.clearSession();
    }
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: AuthError): boolean {
    const recoverableErrors = [
      'network_error',
      'timeout',
      'temporary_unavailable',
    ];
    
    return recoverableErrors.some(errorType => 
      error.message?.toLowerCase().includes(errorType)
    );
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateState(updates: Partial<SessionState>): void {
    this.state = { ...this.state, ...updates };
    
    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(this.state.session);
      } catch (error) {
        console.error('Error in session change callback:', error);
      }
    });
  }

  /**
   * Handle auth state changes from Supabase
   */
  private handleAuthStateChange(event: string, session: Session | null): void {
    console.log('Auth state change:', event, session?.user?.id);
    
    this.updateState({
      session,
      user: session?.user || null,
      loading: false,
      error: null,
    });

    // Schedule proactive refresh for new sessions
    if (session && event === 'SIGNED_IN') {
      this.scheduleProactiveRefresh(session);
    }

    // Clear refresh timeout on sign out
    if (event === 'SIGNED_OUT' && this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    // Broadcast to other tabs
    this.broadcastSessionChange(session);
  }

  /**
   * Handle broadcast messages from other tabs
   */
  private handleBroadcastMessage(event: MessageEvent): void {
    try {
      const { type, session } = event.data;
      
      if (type === 'session-change') {
        // Update local state to match other tabs
        this.updateState({
          session,
          user: session?.user || null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error handling broadcast message:', error);
    }
  }

  /**
   * Schedule proactive token refresh
   */
  private scheduleProactiveRefresh(session: Session): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!session.expires_at) return;

    // Refresh 5 minutes before expiration
    const expiresAt = session.expires_at * 1000;
    const refreshAt = expiresAt - (5 * 60 * 1000);
    const delay = refreshAt - Date.now();

    if (delay > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshSession();
      }, delay);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    this.callbacks.clear();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
export type { SessionState, SessionChangeCallback };