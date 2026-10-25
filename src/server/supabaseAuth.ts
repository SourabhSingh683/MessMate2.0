import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jugczhcvmztcjkjizzzb.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

let _supabaseServer: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!_supabaseServer && SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.length > 20) {
    try {
      _supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Error creating Supabase server client:', err);
      return null;
    }
  }
  return _supabaseServer;
}

export function isSupabaseAuthAvailable(): boolean {
  return Boolean(SUPABASE_KEY && SUPABASE_KEY.length > 20);
}

/**
 * Sends OTP or magic code using Supabase Auth
 */
export async function sendSupabaseOtp(
  email: string,
  shouldCreateUser: boolean = true
): Promise<{ success: boolean; error?: string; message?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase anon key is not configured. Please supply your SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `Supabase verification code sent to ${email}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase OTP dispatch failure' };
  }
}

/**
 * Verifies 6-digit OTP code with Supabase Auth
 */
export async function verifySupabaseOtp(
  email: string,
  token: string
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase anon key is not configured.',
    };
  }

  try {
    // Try 'email' type first (standard OTP/magic code)
    let { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    // If 'email' failed, try 'signup' type
    if (error && (error.message.includes('type') || error.message.includes('signup'))) {
      const retry = await client.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase OTP verification error' };
  }
}

/**
 * Signs in using Supabase email + password
 */
export async function signInWithSupabasePassword(
  email: string,
  password: string
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase anon key is not configured.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase sign in failed' };
  }
}

/**
 * Validates a Supabase JWT Bearer token
 */
export async function verifySupabaseJwt(token: string): Promise<any | null> {
  const client = getSupabaseServerClient();
  if (!client || !token) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}
