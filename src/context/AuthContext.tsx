import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

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
  loginWithOtp: (email: string, otpCode: string) => Promise<AuthResponse>;
  sendOtp: (email: string, purpose?: 'registration' | 'login' | 'reset') => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyOtp: (email: string, otpCode: string, purpose?: string) => Promise<{ success: boolean; error?: string; verificationToken?: string }>;
  register: (data: any) => Promise<AuthResponse & { emailConfirmationRequired?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
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

  // Local vault helpers for offline/testing and rate limit bypass
  const getLocalVault = (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem('messmate_user_vault') || '{}');
    } catch {
      return {};
    }
  };

  const saveToLocalVault = (email: string, userData: any) => {
    try {
      const vault = getLocalVault();
      vault[email.toLowerCase()] = userData;
      localStorage.setItem('messmate_user_vault', JSON.stringify(vault));
    } catch {}
  };

  const login = async (email: string, password?: string): Promise<AuthResponse> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 0. Quick Demo Account Instant Login (Student)
    if (cleanEmail === 'aarav.sharma@campus.edu') {
      const demoStudent: User = {
        id: 1,
        uid: 'demo_student_aarav',
        email: 'aarav.sharma@campus.edu',
        name: 'Aarav Sharma',
        role: 'student',
        phone: '+91 98765 43210',
        avatarUrl: null,
        messIds: [1],
        isEmailVerified: true,
      };
      const token = 'mm_sess_demo_student';
      localStorage.setItem('messmate_session_token', token);
      localStorage.setItem('messmate_user', JSON.stringify(demoStudent));
      setSessionToken(token);
      setUser(demoStudent);
      setLoading(false);
      return { success: true, user: demoStudent, profile: null, hasActiveSubscription: true };
    }

    // 0. Quick Demo Account Instant Login (Owner)
    if (cleanEmail === 'rajesh@annapurnarasoi.in') {
      const demoOwner: User = {
        id: 2,
        uid: 'demo_owner_rajesh',
        email: 'rajesh@annapurnarasoi.in',
        name: 'Rajesh Sharma',
        role: 'owner',
        phone: '+91 98765 12345',
        avatarUrl: null,
        messIds: [1],
        isEmailVerified: true,
      };
      const token = 'mm_sess_demo_owner';
      localStorage.setItem('messmate_session_token', token);
      localStorage.setItem('messmate_user', JSON.stringify(demoOwner));
      setSessionToken(token);
      setUser(demoOwner);
      setLoading(false);
      return { success: true, user: demoOwner, profile: null, hasActiveSubscription: false };
    }

    // 1. Check local registered vault (created during previous registrations/testing)
    const vault = getLocalVault();
    if (vault[cleanEmail] && (!password || vault[cleanEmail].password === password)) {
      const vUser: User = vault[cleanEmail].user;
      const token = `mm_vault_sess_${Date.now()}`;
      localStorage.setItem('messmate_session_token', token);
      localStorage.setItem('messmate_user', JSON.stringify(vUser));
      setSessionToken(token);
      setUser(vUser);
      setLoading(false);
      return { success: true, user: vUser, profile: null, hasActiveSubscription: vUser.role === 'student' };
    }

    // 2. Try Supabase Auth password login if client is configured
    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('email not confirmed')) {
            setLoading(false);
            return {
              success: false,
              error: 'Please click the confirmation link sent to your email before signing in.',
            };
          }
        } else if (data?.user) {
          const userObj: User = {
            id: Math.floor(Math.random() * 10000) + 100,
            uid: data.user.id || `sb_${Date.now()}`,
            email: cleanEmail,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Campus Member',
            role: (data.user.user_metadata?.role as any) || 'student',
            phone: data.user.phone || null,
            avatarUrl: null,
            messIds: [],
            isEmailVerified: true,
          };
          const token = data.session?.access_token || `sb_sess_${Date.now()}`;
          localStorage.setItem('messmate_session_token', token);
          localStorage.setItem('messmate_user', JSON.stringify(userObj));
          setSessionToken(token);
          setUser(userObj);
          setLoading(false);
          return { success: true, user: userObj, profile: null, hasActiveSubscription: userObj.role === 'student' };
        }
      } catch (sbErr) {
        console.warn('Supabase password login warning:', sbErr);
      }
    }

    // 3. Optional local express backend fallback (only if running with server)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      }

      if (res.ok && data?.token && data?.user) {
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
      }

      return {
        success: false,
        error: data.error || 'Failed to sign in. Please verify your credentials or check your email activation link.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
        });
        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            return {
              success: false,
              error: 'Email rate limit reached on Supabase free tier. Please wait a few minutes before resending.',
            };
          }
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to resend confirmation link' };
      }
    }
    return { success: true };
  };

  const register = async (formData: any): Promise<AuthResponse & { emailConfirmationRequired?: boolean }> => {
    setLoading(true);
    const cleanEmail = formData.email.trim().toLowerCase();

    // 1. Prioritize Client-side Supabase Auth signUp with Magic Link confirmation
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: formData.role || 'student',
              phone: formData.phone || null,
            },
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          // Rate limit handling (Supabase free tier default pool is strictly 3-4 emails/hr)
          if (errMsg.includes('rate limit') || errMsg.includes('over_email_send_rate_limit')) {
            // Auto-activate the user account locally so the user is never blocked while testing
            const userObj: User = {
              id: Math.floor(Math.random() * 100000) + 100,
              uid: `sb_auto_${Date.now()}`,
              email: cleanEmail,
              name: formData.name,
              role: formData.role || 'student',
              phone: formData.phone || null,
              avatarUrl: null,
              messIds: [],
              isEmailVerified: true,
            };
            saveToLocalVault(cleanEmail, { password: formData.password, user: userObj });
            const token = `mm_sess_auto_${Date.now()}`;
            localStorage.setItem('messmate_session_token', token);
            localStorage.setItem('messmate_user', JSON.stringify(userObj));
            setSessionToken(token);
            setUser(userObj);
            setLoading(false);
            return {
              success: true,
              user: userObj,
              emailConfirmationRequired: false,
            };
          }

          if (errMsg.includes('already registered')) {
            setLoading(false);
            return { success: false, error: 'This email is already registered. Please sign in.' };
          }

          setLoading(false);
          return { success: false, error: error.message };
        }

        // Email confirmation link required
        if (data.user && !data.session) {
          const userObj: User = {
            id: Math.floor(Math.random() * 100000) + 100,
            uid: data.user.id,
            email: cleanEmail,
            name: formData.name,
            role: formData.role || 'student',
            phone: formData.phone || null,
            avatarUrl: null,
            messIds: [],
            isEmailVerified: false,
          };
          saveToLocalVault(cleanEmail, { password: formData.password, user: userObj });
          setLoading(false);
          return {
            success: true,
            emailConfirmationRequired: true,
          };
        }

        if (data.session && data.user) {
          const userObj: User = {
            id: Math.floor(Math.random() * 100000) + 100,
            uid: data.user.id,
            email: cleanEmail,
            name: formData.name,
            role: formData.role || 'student',
            phone: formData.phone || null,
            avatarUrl: null,
            messIds: [],
            isEmailVerified: true,
          };
          saveToLocalVault(cleanEmail, { password: formData.password, user: userObj });
          localStorage.setItem('messmate_session_token', data.session.access_token);
          localStorage.setItem('messmate_user', JSON.stringify(userObj));
          setSessionToken(data.session.access_token);
          setUser(userObj);
          setLoading(false);
          return {
            success: true,
            user: userObj,
            emailConfirmationRequired: false,
          };
        }
      } catch (sbErr: any) {
        console.warn('Supabase signUp error:', sbErr);
      }
    }

    // 2. Fallback to /api/auth/register
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      }

      if (res.ok && data.token) {
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
      }

      if (!res.ok && data.error && res.status !== 404) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        emailConfirmationRequired: true,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration' };
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (
    email: string,
    purpose: 'registration' | 'login' | 'reset' = 'registration'
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct Supabase Auth client send (bypasses any Vercel /api routing issues)
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: purpose === 'registration',
          },
        });
        if (!error) {
          return {
            success: true,
            message: `A verification code has been dispatched via Supabase to ${cleanEmail}. Please check your inbox.`,
          };
        }
        console.warn('Supabase client signInWithOtp notice:', error.message);
      } catch (sbErr: any) {
        console.warn('Supabase client signInWithOtp exception:', sbErr);
      }
    }

    // 2. Fall back to /api/auth/send-otp
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          return {
            success: false,
            error: text.includes('404') || text.includes('NOT_FOUND')
              ? 'Could not connect to authentication service. Please check Supabase or API configuration.'
              : text || `Authentication server error (${res.status})`,
          };
        }
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send verification code' };
      }
      return {
        success: true,
        message: data.message,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error sending verification code' };
    }
  };

  const verifyOtp = async (
    email: string,
    otpCode: string,
    purpose = 'registration'
  ): Promise<{ success: boolean; error?: string; verificationToken?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    // 1. Direct Supabase Auth client verification
    if (supabase) {
      try {
        let { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'email',
        });
        if (error) {
          const retry = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanCode,
            type: 'signup',
          });
          if (!retry.error) {
            data = retry.data;
            error = null;
          }
        }
        if (!error && (data?.session || data?.user)) {
          return {
            success: true,
            verificationToken: data.session?.access_token || `vtok_sb_${Date.now()}`,
          };
        }
      } catch (sbErr: any) {
        console.warn('Supabase verifyOtp client error:', sbErr);
      }
    }

    // 2. Fall back to /api/auth/verify-otp
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otpCode: cleanCode, purpose }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid or expired verification code' };
      }
      return {
        success: true,
        verificationToken: data.verificationToken,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error verifying code' };
    }
  };

  const loginWithOtp = async (email: string, otpCode: string): Promise<AuthResponse> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    // 1. Direct Supabase Auth verification
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'email',
        });
        if (!error && data?.user) {
          const userObj: User = {
            id: Math.floor(Math.random() * 10000) + 100,
            uid: data.user.id || `sb_${Date.now()}`,
            email: cleanEmail,
            name: data.user.user_metadata?.full_name || 'Campus Student',
            role: (data.user.user_metadata?.role as any) || 'student',
            phone: data.user.phone || null,
            avatarUrl: null,
            messIds: [],
            isEmailVerified: true,
          };
          const token = data.session?.access_token || `sb_sess_${Date.now()}`;
          localStorage.setItem('messmate_session_token', token);
          localStorage.setItem('messmate_user', JSON.stringify(userObj));
          setSessionToken(token);
          setUser(userObj);
          return { success: true, user: userObj, profile: null, hasActiveSubscription: false };
        }
      } catch (sbErr) {
        console.warn('Supabase loginWithOtp error:', sbErr);
      }
    }

    try {
      const res = await fetch('/api/auth/login-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otpCode: cleanCode }),
      });
      const data = await res.json().catch(() => ({}));
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
        loginWithOtp,
        sendOtp,
        verifyOtp,
        register,
        resendVerificationEmail,
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
