'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import sessionManager from '../../lib/auth/session-manager';
import type { SessionState } from '../../lib/auth/session-manager';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType extends SessionState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<SessionState>(() => sessionManager.getState());

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = sessionManager.onSessionChange((session) => {
      setAuthState(sessionManager.getState());
    });

    // Initialize session recovery
    sessionManager.recoverSession().catch(error => {
      console.error('Failed to recover session:', error);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await sessionManager.clearSession();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect to login even if signOut fails
      window.location.href = '/login';
    }
  };

  const refreshSession = async () => {
    try {
      await sessionManager.refreshSession();
    } catch (error) {
      console.error('Session refresh error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user with loading state
 */
export function useUser(): { user: User | null; loading: boolean; error: Error | null } {
  const { user, loading, error } = useAuth();
  return { user, loading, error };
}

/**
 * Hook to check if user has specific role
 */
export function useRole(requiredRole: string): { hasRole: boolean; loading: boolean } {
  const { user, loading } = useAuth();
  
  const hasRole = user?.user_metadata?.role === requiredRole;
  
  return { hasRole, loading };
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useRoles(requiredRoles: string[]): { hasRole: boolean; loading: boolean; userRole?: string } {
  const { user, loading } = useAuth();
  
  const userRole = user?.user_metadata?.role;
  const hasRole = userRole ? requiredRoles.includes(userRole) : false;
  
  return { hasRole, loading, userRole };
}

/**
 * Component to protect routes based on authentication
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, fallback, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
          <button
            onClick={() => window.location.href = redirectTo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Component to protect routes based on user role
 */
interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  requiredRoles, 
  fallback, 
  redirectTo 
}: RoleProtectedRouteProps) {
  const { user, loading } = useAuth();
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    if (!loading && user && userRole && !requiredRoles.includes(userRole)) {
      // Redirect to user's appropriate dashboard
      const roleRedirects = {
        customer: '/customer',
        admin: '/admin',
        mechanic: '/mechanic',
        owner: '/owner',
      };
      
      const defaultRedirect = roleRedirects[userRole as keyof typeof roleRedirects] || '/';
      window.location.href = redirectTo || defaultRedirect;
    }
  }, [user, loading, userRole, requiredRoles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute redirectTo="/login">
        {children}
      </ProtectedRoute>
    );
  }

  if (userRole && !requiredRoles.includes(userRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Required roles: {requiredRoles.join(', ')}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;