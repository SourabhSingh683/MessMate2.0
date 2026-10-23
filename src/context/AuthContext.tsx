import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types.ts';

interface AuthResponse {
  success: boolean;
  user?: User;
  profile?: StudentProfile | null;
  hasActiveSubscription?: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  isRealUser: boolean;
  login: (email: string, password?: string) => Promise<AuthResponse>;
  register: (data: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('messmate_session_token');
  });

  const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    const activeToken = sessionToken || localStorage.getItem('messmate_session_token');

    if (activeToken) {
      headers.set('x-session-token', activeToken);
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...options, headers });
  };

  const refreshAuth = async () => {
    const activeToken = sessionToken || localStorage.getItem('messmate_session_token');
    if (!activeToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else if (res.status === 401) {
        localStorage.removeItem('messmate_session_token');
        setSessionToken(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load authenticated user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      localStorage.setItem('messmate_session_token', data.token);
      setSessionToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      return {
        success: true,
        user: data.user,
        profile: data.profile,
        hasActiveSubscription: Boolean(data.hasActiveSubscription),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: any): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      localStorage.setItem('messmate_session_token', data.token);
      setSessionToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      return {
        success: true,
        user: data.user,
        profile: data.profile,
        hasActiveSubscription: Boolean(data.hasActiveSubscription),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const activeToken = sessionToken || localStorage.getItem('messmate_session_token');
      if (activeToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'x-session-token': activeToken },
        });
      }
    } catch (e) {
      // Continue cleanup
    } finally {
      localStorage.removeItem('messmate_session_token');
      setSessionToken(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, [sessionToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isRealUser: Boolean(user),
        login,
        register,
        logout,
        refreshAuth,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
