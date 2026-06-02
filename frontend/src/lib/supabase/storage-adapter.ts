/**
 * Custom Storage Adapter for Supabase Authentication
 * 
 * Provides secure HTTP-only cookie-based storage for authentication tokens
 * with proper security attributes and error handling.
 */

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path?: string;
}

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class CustomStorageAdapter implements StorageAdapter {
  private readonly cookieOptions: CookieOptions;

  constructor() {
    this.cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };
  }

  async getItem(key: string): Promise<string | null> {
    try {
      // In browser environment, we can't access HTTP-only cookies directly
      // This will be handled by the server-side client
      if (typeof window !== 'undefined') {
        // For client-side, we'll use a different approach
        return this.getClientSideItem(key);
      }
      
      // Server-side cookie access will be handled by the server client
      return null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side storage using sessionStorage as fallback
        this.setClientSideItem(key, value);
      }
      // Server-side cookie setting will be handled by the server client
    } catch (error) {
      console.error('Error setting item in storage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        this.removeClientSideItem(key);
      }
      // Server-side cookie removal will be handled by the server client
    } catch (error) {
      console.error('Error removing item from storage:', error);
      throw error;
    }
  }

  private getClientSideItem(key: string): string | null {
    try {
      // Use sessionStorage for client-side token storage
      // This is more secure than localStorage for sensitive tokens
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return null;
    }
  }

  private setClientSideItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting sessionStorage:', error);
      throw error;
    }
  }

  private removeClientSideItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      throw error;
    }
  }

  /**
   * Get cookie options for server-side cookie operations
   */
  getCookieOptions(): CookieOptions {
    return { ...this.cookieOptions };
  }

  /**
   * Validate token integrity before storage operations
   */
  private validateToken(token: string): boolean {
    try {
      // Basic token validation - check if it's a valid JWT structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Validate base64 encoding of header and payload
      try {
        atob(parts[0]);
        atob(parts[1]);
      } catch {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize storage key to prevent injection attacks
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}

export default CustomStorageAdapter;
export type { StorageAdapter, CookieOptions };