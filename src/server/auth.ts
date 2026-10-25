import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { users, sessions, messMemberships } from '../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import crypto from 'crypto';
import { verifySupabaseJwt } from './supabaseAuth.ts';

// Initialize Firebase Admin SDK safely
if (!getApps().length && firebaseConfig?.projectId) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (err) {
    console.warn('Firebase Admin initialization warning:', err);
  }
}

export const adminAuth = getApps().length ? getAuth() : null;

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'owner' | 'admin';
  phone?: string | null;
  avatarUrl?: string | null;
  messIds: number[];
  isDemo?: boolean;
  isEmailVerified?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
}

/**
 * Generates a persistent, salted PBKDF2 password hash with 100,000 iterations.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored salted hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, expectedHash] = storedHash.split(':');
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const calculatedBuf = Buffer.from(calculatedHash, 'hex');
    if (expectedBuf.length !== calculatedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, calculatedBuf);
  } catch {
    return false;
  }
}

/**
 * Creates a persistent database session valid for 7 days.
 */
export async function createSession(userId: number): Promise<string> {
  const token = `mm_sess_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
  });

  return token;
}

/**
 * Invalidates a persistent session across server restarts.
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
  } catch (err) {
    console.error('Error invalidating session in database:', err);
  }
}

/**
 * Middleware: authenticates requests strictly via verified persistent sessions or Firebase.
 * Unauthenticated header spoofing (x-demo-user-id) and default auto-login fallbacks are removed.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sessionTokenHeader = req.headers['x-session-token'] as string;
    const authHeader = req.headers.authorization;

    let matchedUser: any = null;
    let isDemoAccount = false;
    let token = sessionTokenHeader;

    if (!token && authHeader) {
      if (authHeader.startsWith('Bearer mm_sess_')) {
        token = authHeader.slice(7);
      } else if (authHeader.startsWith('Bearer ')) {
        // Potential Firebase or raw token
        const rawToken = authHeader.slice(7);
        if (rawToken.startsWith('mm_sess_')) {
          token = rawToken;
        }
      }
    }

    // 1. Check Persistent Database Session
    if (token) {
      const activeSessions = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
        .limit(1);

      if (activeSessions.length > 0) {
        matchedUser = activeSessions[0].user;
        req.sessionToken = token;
      }
    }

    // 2. Check Supabase Bearer Token if present
    if (!matchedUser && authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('mm_sess_')) {
      const rawToken = authHeader.slice(7);
      try {
        const sbUser = await verifySupabaseJwt(rawToken);
        if (sbUser && sbUser.email) {
          const cleanEmail = sbUser.email.toLowerCase().trim();
          const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
          if (existing.length > 0) {
            matchedUser = existing[0];
          } else {
            const [newUser] = await db
              .insert(users)
              .values({
                uid: `sb_${sbUser.id}`,
                email: cleanEmail,
                name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Campus Student',
                role: 'student',
                avatarUrl: sbUser.user_metadata?.avatar_url || null,
                isEmailVerified: Boolean(sbUser.email_confirmed_at),
              })
              .returning();
            matchedUser = newUser;
          }
        }
      } catch (sbErr) {
        // Fall through to Firebase or rejection
      }
    }

    // 3. Check Firebase Bearer Token if present (real Google sign-in)
    if (!matchedUser && authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('mm_sess_') && adminAuth) {
      const fbToken = authHeader.slice(7);
      try {
        const decoded = await adminAuth.verifyIdToken(fbToken);
        const existing = await db.select().from(users).where(eq(users.uid, decoded.uid)).limit(1);
        if (existing.length > 0) {
          matchedUser = existing[0];
        } else {
          // Provision verified Firebase student user
          const [newUser] = await db
            .insert(users)
            .values({
              uid: decoded.uid,
              email: decoded.email || `${decoded.uid}@campus.edu`,
              name: decoded.name || 'Campus Student',
              role: 'student',
              avatarUrl: decoded.picture || null,
            })
            .returning();
          matchedUser = newUser;
        }
      } catch (tokenErr) {
        // Token invalid, fall through
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    // Fetch user's mess memberships for tenancy checking
    const memberships = await db
      .select({ messId: messMemberships.messId })
      .from(messMemberships)
      .where(eq(messMemberships.userId, matchedUser.id));

    req.user = {
      id: matchedUser.id,
      uid: matchedUser.uid,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role as any,
      phone: matchedUser.phone,
      avatarUrl: matchedUser.avatarUrl,
      messIds: memberships.map((m) => m.messId),
      isDemo: isDemoAccount,
      isEmailVerified: Boolean(matchedUser.isEmailVerified),
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication verification failure' });
  }
}

/**
 * Middleware: requires user to have one of specified roles
 */
export function requireRole(...roles: ('student' | 'owner' | 'admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: role '${req.user.role}' lacks permission for this action` });
    }
    next();
  };
}

/**
 * Middleware: validates that the authenticated owner actually manages the specified mess
 */
export function requireMessOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden: Owner role required' });
  }

  const requestedMessId = Number(req.params.messId || req.body.messId || req.query.messId);

  if (requestedMessId) {
    if (!req.user.messIds.includes(requestedMessId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have management access for this mess' });
    }
    return next();
  }

  if (req.user.messIds.length === 0) {
    return res.status(403).json({ error: 'Forbidden: No registered mess found under your owner account' });
  }

  next();
}
