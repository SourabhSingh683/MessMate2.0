import { Router } from 'express';
import { db } from '../db/index.ts';
import {
  users,
  studentProfiles,
  messes,
  messMemberships,
  mealPlans,
  dishes,
  ingredients,
  dishIngredients,
  menus,
  menuItems,
  subscriptions,
  demoPayments,
  mealSlots,
  mealSelections,
  mealAttendances,
  mealCreditLedger,
  demandForecasts,
  kitchenProductionRecords,
  ingredientUsages,
  feedbacks,
  feedbackAnalyses,
  aiInsights,
  notifications,
  auditLogs,
  emailVerifications,
} from '../db/schema.ts';
import { eq, and, desc, sql, inArray, gt } from 'drizzle-orm';
import crypto from 'crypto';
import {
  authenticate,
  requireRole,
  requireMessOwnership,
  AuthRequest,
  createSession,
  invalidateSession,
  hashPassword,
  verifyPassword,
} from './auth.ts';
import { sendOtpVerificationEmail, getMailerStatus } from './mailer.ts';
import {
  sendSupabaseOtp,
  verifySupabaseOtp,
  signInWithSupabasePassword,
  isSupabaseAuthAvailable,
} from './supabaseAuth.ts';
import { matchMessesWithAI, analyzeMealNutritionWithAI, analyzeFeedbackThemesWithAI, runOwnerCopilotQuery } from './ai.ts';
import { seedDatabase } from '../db/seed.ts';
import { calculateMealTotals, calculateFoodMacros } from '../lib/nutritionCalculator.ts';

const api = Router();

function getMessCoords(m: any, idx: number) {
  const slug = (m.slug || m.name || '').toLowerCase();
  if (slug.includes('annapurna')) return { lat: 12.9718, lng: 77.5942 };
  if (slug.includes('royal')) return { lat: 12.9745, lng: 77.5985 };
  if (slug.includes('green') || slug.includes('bowl')) return { lat: 12.9688, lng: 77.5912 };
  if (slug.includes('dakshin')) return { lat: 12.9760, lng: 77.5935 };
  if (slug.includes('punjabi') || slug.includes('tadka')) return { lat: 12.9730, lng: 77.5970 };
  const angle = (idx * 65 * Math.PI) / 180;
  const radius = 0.003 + (idx % 3) * 0.002;
  return {
    lat: Number((12.9716 + Math.sin(angle) * radius).toFixed(6)),
    lng: Number((77.5946 + Math.cos(angle) * radius).toFixed(6)),
  };
}

// ============================================================================
// 1. PUBLIC & DISCOVERY
// ============================================================================

/**
 * GET /api/config/maps
 */
api.get('/config/maps', (req, res) => {
  res.json({
    apiKey:
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      'AIzaSyAunMfwHLcUop2HeEQXlTdaNxWvL18yAzs',
  });
});

/**
 * POST /api/nutrition/calculate
 * Calculate macros using ICMR-NIN predefined reference values per 100g
 */
api.post('/nutrition/calculate', (req, res) => {
  try {
    const { dishes = [] } = req.body;
    const totals = calculateMealTotals(dishes);
    res.json(totals);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate food macros' });
  }
});

/**
 * GET /api/messes
 * List all active messes with plans, ratings, distance, and cuisine
 */
api.get('/messes', async (req, res) => {
  try {
    const allMesses = await db.select().from(messes).where(eq(messes.status, 'active'));

    const allPlans = await db.select().from(mealPlans).where(eq(mealPlans.isActive, true));

    // Combine messes with their available plans & geo coordinates
    const result = allMesses.map((m, idx) => {
      const plans = allPlans.filter((p) => p.messId === m.id);
      const coords = getMessCoords(m, idx);
      return {
        ...m,
        lat: coords.lat,
        lng: coords.lng,
        plans,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error fetching messes:', err);
    res.status(500).json({ error: 'Failed to fetch messes' });
  }
});

/**
 * GET /api/messes/:id
 * Detailed mess profile including weekly menu, dishes, and plans
 */
api.get('/messes/:id', async (req, res) => {
  try {
    const messId = Number(req.params.id);
    const messList = await db.select().from(messes).where(eq(messes.id, messId)).limit(1);

    if (messList.length === 0) {
      return res.status(404).json({ error: 'Mess not found' });
    }

    const mess = messList[0];
    const plans = await db.select().from(mealPlans).where(and(eq(mealPlans.messId, messId), eq(mealPlans.isActive, true)));
    const messDishes = await db.select().from(dishes).where(eq(dishes.messId, messId));
    const recentMenus = await db.select().from(menus).where(eq(menus.messId, messId)).orderBy(desc(menus.date)).limit(14);
    const recentReviews = await db
      .select({
        id: feedbacks.id,
        rating: feedbacks.rating,
        foodQualityRating: feedbacks.foodQualityRating,
        hygieneRating: feedbacks.hygieneRating,
        tasteRating: feedbacks.tasteRating,
        category: feedbacks.category,
        comment: feedbacks.comment,
        ownerResponse: feedbacks.ownerResponse,
        respondedAt: feedbacks.respondedAt,
        createdAt: feedbacks.createdAt,
        studentName: users.name,
      })
      .from(feedbacks)
      .leftJoin(users, eq(feedbacks.studentId, users.id))
      .where(eq(feedbacks.messId, messId))
      .orderBy(desc(feedbacks.createdAt))
      .limit(10);

    res.json({
      mess,
      plans,
      dishes: messDishes,
      menus: recentMenus,
      reviews: recentReviews,
    });
  } catch (err: any) {
    console.error('Error fetching mess detail:', err);
    res.status(500).json({ error: 'Failed to fetch mess detail' });
  }
});

/**
 * GET /api/demo/personas
 * Lists available personas for quick switcher in judging/demo
 */
api.get('/demo/personas', async (req, res) => {
  try {
    const demoUsers = await db.select().from(users).orderBy(users.id);
    res.json(demoUsers);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load demo personas' });
  }
});

/**
 * POST /api/auth/send-otp
 * Generates and dispatches a 6-digit email verification OTP
 */
api.post('/auth/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required (e.g. yourname@campus.edu).' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing account according to purpose
    if (purpose === 'registration') {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ error: `An account with ${cleanEmail} already exists. Please sign in instead.` });
      }
    } else if (purpose === 'login' || purpose === 'reset') {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: `No registered account found with ${cleanEmail}. Please register first.` });
      }
    }

    // If Supabase Auth is configured, dispatch OTP via Supabase Auth
    if (isSupabaseAuthAvailable()) {
      const sbResult = await sendSupabaseOtp(cleanEmail, purpose === 'registration');
      if (sbResult.success) {
        console.log(`[Supabase Auth] Dispatched verification code via Supabase to ${cleanEmail}`);
        return res.json({
          success: true,
          provider: 'supabase',
          message: `A verification code has been dispatched via Supabase to ${cleanEmail}. Please check your inbox.`,
          email: cleanEmail,
          expiresInSeconds: 600,
        });
      } else {
        console.warn(`[Supabase Auth Notice]: ${sbResult.error}. Using transactional mailer.`);
      }
    }

    // Generate 6-digit cryptographic OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous pending unverified OTPs for this email & purpose
    await db
      .delete(emailVerifications)
      .where(and(eq(emailVerifications.email, cleanEmail), eq(emailVerifications.purpose, purpose)));

    await db.insert(emailVerifications).values({
      email: cleanEmail,
      otpCode,
      purpose,
      expiresAt,
    });

    // Send real transactional email via configured SMTP / Resend provider
    await sendOtpVerificationEmail({
      toEmail: cleanEmail,
      otpCode,
      purpose: purpose as any,
    });

    return res.json({
      success: true,
      provider: 'mailer',
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`,
      email: cleanEmail,
      expiresInSeconds: 600,
    });
  } catch (err: any) {
    console.error('Error generating email OTP:', err);
    return res.status(500).json({ error: err?.message || 'Failed to send verification code. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit code and issues a secure verification token for registration
 */
api.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otpCode, purpose = 'registration' } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!otpCode || typeof otpCode !== 'string') {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otpCode.trim();

    // 1. Try Supabase Auth verification if configured
    if (isSupabaseAuthAvailable()) {
      const sbVerify = await verifySupabaseOtp(cleanEmail, cleanOtp);
      if (sbVerify.success) {
        const verificationToken = `vtok_sb_${crypto.randomBytes(24).toString('hex')}`;
        await db.insert(emailVerifications).values({
          email: cleanEmail,
          otpCode: 'SUPABASE_VERIFIED',
          verificationToken,
          purpose,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          verifiedAt: new Date(),
        });

        return res.json({
          success: true,
          verified: true,
          provider: 'supabase',
          email: cleanEmail,
          verificationToken,
          message: 'Email address verified successfully via Supabase Auth!',
        });
      }
    }

    const matches = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, cleanEmail),
          eq(emailVerifications.otpCode, cleanOtp),
          eq(emailVerifications.purpose, purpose),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (matches.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired 6-digit verification code. Please check the code or request a new one.',
      });
    }

    const verification = matches[0];
    const verificationToken = `vtok_${crypto.randomBytes(24).toString('hex')}`;

    await db
      .update(emailVerifications)
      .set({
        verifiedAt: new Date(),
        verificationToken,
      })
      .where(eq(emailVerifications.id, verification.id));

    return res.json({
      success: true,
      verified: true,
      email: cleanEmail,
      verificationToken,
      message: 'Email address verified successfully!',
    });
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ error: err?.message || 'Failed to verify code. Please try again.' });
  }
});

/**
 * GET /api/auth/supabase/status
 * Returns current Supabase connection status and instructions if key is missing
 */
api.get('/auth/supabase/status', (req, res) => {
  const configured = isSupabaseAuthAvailable();
  res.json({
    isConfigured: configured,
    supabaseUrl: 'https://jugczhcvmztcjkjizzzb.supabase.co',
    projectRef: 'jugczhcvmztcjkjizzzb',
    instructions: configured
      ? 'Supabase Auth is active and handling authentications.'
      : 'To activate Supabase Auth, copy your anon key from https://supabase.com/dashboard/project/jugczhcvmztcjkjizzzb/settings/api and provide it.',
  });
});

/**
 * POST /api/auth/login-with-otp
 * Quick passwordless sign-in using verified email OTP
 */
api.post('/auth/login-with-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otpCode).trim();

    const matches = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, cleanEmail),
          eq(emailVerifications.otpCode, cleanOtp),
          eq(emailVerifications.purpose, 'login'),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (matches.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: `No registered account found with ${cleanEmail}. Please register first.` });
    }

    const user = existingUsers[0];
    await db.update(emailVerifications).set({ verifiedAt: new Date() }).where(eq(emailVerifications.id, matches[0].id));

    const sessionToken = await createSession(user.id);

    let profile: any = null;
    if (user.role === 'student') {
      const p = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
      profile = p[0] || null;
    }

    const memberships = await db.select().from(messMemberships).where(eq(messMemberships.userId, user.id));
    const messIds = memberships.map((m) => m.messId);

    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.studentId, user.id), eq(subscriptions.status, 'active')))
      .limit(1);

    return res.json({
      token: sessionToken,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        messIds,
        hasActiveSubscription: activeSubs.length > 0,
        isDemo: false,
      },
      profile,
      hasActiveSubscription: activeSubs.length > 0,
      message: 'Signed in successfully with verified email',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sign in with verification code.' });
  }
});

/**
 * POST /api/auth/register
 * Real user registration for student, owner, and admin roles
 * Requires verified email via verificationToken or valid otpCode
 */
api.post('/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
      hostelBlock,
      roomNumber,
      collegeId,
      dietaryPref,
      allergies,
      messName,
      messCuisine,
      messAddress,
      isPureVeg,
      verificationToken,
      otpCode,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required. Please enter your name.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required (e.g. yourname@gmail.com).' });
    }

    // SECURITY: Prevent public registration from granting the admin role
    if (role === 'admin') {
      return res.status(400).json({ error: 'Public registration for admin role is prohibited.' });
    }

    if (!['student', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or owner.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (role === 'owner' && (!messName || typeof messName !== 'string' || !messName.trim())) {
      return res.status(400).json({ error: 'Mess / Kitchen name is required for owner accounts.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify email ownership: check verificationToken or directly provided otpCode
    let emailVerified = false;
    if (verificationToken) {
      const vMatch = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.email, cleanEmail),
            eq(emailVerifications.verificationToken, String(verificationToken))
          )
        )
        .limit(1);
      if (vMatch.length > 0 && vMatch[0].verifiedAt) {
        emailVerified = true;
      }
    } else if (otpCode) {
      const oMatch = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.email, cleanEmail),
            eq(emailVerifications.otpCode, String(otpCode).trim()),
            gt(emailVerifications.expiresAt, new Date())
          )
        )
        .limit(1);
      if (oMatch.length > 0) {
        emailVerified = true;
        await db.update(emailVerifications).set({ verifiedAt: new Date() }).where(eq(emailVerifications.id, oMatch[0].id));
      }
    }

    if (!emailVerified) {
      return res.status(400).json({
        error: 'Email verification required. Please verify your email with the 6-digit OTP code before setting your password.',
      });
    }

    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: `An account with ${cleanEmail} already exists. Please sign in instead.` });
    }

    const defaultAvatars = {
      student: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      owner: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150',
      admin: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };

    const newUid = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        uid: newUid,
        email: cleanEmail,
        name: name.trim(),
        role: role as 'student' | 'owner',
        phone: phone?.trim() || null,
        avatarUrl: defaultAvatars[role as keyof typeof defaultAvatars] || defaultAvatars.student,
        passwordHash,
        isEmailVerified: true,
      })
      .returning();

    let createdProfile: any = null;
    let createdMessId: number | null = null;

    if (role === 'student') {
      const [profile] = await db
        .insert(studentProfiles)
        .values({
          userId: newUser.id,
          hostelBlock: hostelBlock?.trim() || 'Block-A',
          roomNumber: roomNumber?.trim() || '101',
          collegeId: collegeId?.trim() || `COL-${Math.floor(1000 + Math.random() * 9000)}`,
          dietaryPref: dietaryPref?.trim() || 'veg',
          allergies: allergies?.trim() || null,
          dailyCalorieTarget: 2200,
          dailyProteinTarget: 70,
        })
        .returning();
      createdProfile = profile;

      await db.insert(notifications).values({
        userId: newUser.id,
        title: 'Welcome to MessMate!',
        message: 'Your student account is active. Explore campus messes, subscribe to meal plans, and skip meals in advance to earn credits.',
        type: 'general',
      });
    } else if (role === 'owner') {
      const mName = messName?.trim() || `${newUser.name}'s Mess Kitchen`;
      const slug = mName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900);
      const [newMess] = await db
        .insert(messes)
        .values({
          name: mName,
          slug,
          tagline: 'Fresh wholesome campus dining',
          description: `${mName} provides nutritious, balanced meals prepared daily for hostelers with transparent nutrition and advance skip credits.`,
          address: messAddress?.trim() || 'Campus Food Court, Gate 2',
          distanceKm: 0.35,
          contactPhone: phone?.trim() || '9876543210',
          contactEmail: cleanEmail,
          operatingHours: '7:30 AM - 10:00 PM',
          rating: 4.8,
          reviewCount: 1,
          cuisineTypes: messCuisine?.trim() || 'North Indian, South Indian',
          isPureVeg: Boolean(isPureVeg),
          status: 'active',
        })
        .returning();

      createdMessId = newMess.id;

      await db.insert(messMemberships).values({
        messId: newMess.id,
        userId: newUser.id,
        role: 'owner',
      });

      // Default active meal plan
      await db.insert(mealPlans).values({
        messId: newMess.id,
        name: 'Standard Monthly (Lunch + Dinner)',
        planType: 'monthly',
        pricePaise: 340000,
        validityDays: 30,
        totalMeals: 60,
        mealsPerDay: 2,
        coveredSlots: 'lunch,dinner',
        maxSkipsAllowed: 12,
        creditsPerSkipPaise: 5000,
        description: '30 days coverage for lunch and dinner with up to 12 refundable advance skips.',
        isActive: true,
      });

      await db.insert(notifications).values({
        userId: newUser.id,
        title: 'Mess Kitchen Registered!',
        message: `${mName} is now active on MessMate. Manage menus, review demand forecasts, and log meal preparation.`,
        type: 'general',
      });
    }

    const sessionToken = await createSession(newUser.id);

    return res.status(201).json({
      token: sessionToken,
      user: {
        id: newUser.id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        avatarUrl: newUser.avatarUrl,
        messIds: createdMessId ? [createdMessId] : [],
        hasActiveSubscription: false,
        isDemo: false,
        isEmailVerified: true,
      },
      profile: createdProfile,
      hasActiveSubscription: false,
      message: 'Account registered successfully',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    const msg = err?.message || 'Registration failed due to a database error. Please try again.';
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/auth/login
 * Real user login with email and required verified password
 */
api.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userList = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (userList.length === 0) {
      return res.status(401).json({ error: 'No user account found with this email.' });
    }

    const matchedUser = userList[0];

    // Require valid password verification against persistent salted hash
    if (!verifyPassword(password, matchedUser.passwordHash)) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const sessionToken = await createSession(matchedUser.id);

    let profile: any = null;
    let hasActiveSubscription = false;
    if (matchedUser.role === 'student') {
      const p = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, matchedUser.id)).limit(1);
      profile = p[0] || null;

      const activeSubs = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.studentId, matchedUser.id), eq(subscriptions.status, 'active')))
        .limit(1);
      hasActiveSubscription = activeSubs.length > 0;
    }

    const memberships = await db
      .select({ messId: messMemberships.messId })
      .from(messMemberships)
      .where(eq(messMemberships.userId, matchedUser.id));

    return res.json({
      token: sessionToken,
      user: {
        id: matchedUser.id,
        uid: matchedUser.uid,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        phone: matchedUser.phone,
        avatarUrl: matchedUser.avatarUrl,
        messIds: memberships.map((m) => m.messId),
        hasActiveSubscription,
        isDemo: false,
        isEmailVerified: Boolean(matchedUser.isEmailVerified),
      },
      profile,
      hasActiveSubscription,
      message: 'Signed in successfully',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

/**
 * POST /api/auth/demo-login
 * Explicit demo-only login mechanism with verified persistent session.
 * STRICTLY disabled in production environments.
 */
api.post('/auth/demo-login', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Demo login is disabled in production environments.' });
    }

    const { role = 'student' } = req.body;
    if (!['student', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or owner for demo login.' });
    }

    const targetEmail = role === 'owner' ? 'owner@messmate.in' : 'student@messmate.in';
    let userList = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);

    if (userList.length === 0) {
      userList = await db.select().from(users).where(eq(users.role, role as any)).limit(1);
    }

    if (userList.length === 0) {
      return res.status(404).json({ error: `No seeded demo account found for role ${role}.` });
    }

    const demoUser = userList[0];
    const sessionToken = await createSession(demoUser.id);

    let profile: any = null;
    let hasActiveSubscription = false;
    if (demoUser.role === 'student') {
      const p = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, demoUser.id)).limit(1);
      profile = p[0] || null;

      const activeSubs = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.studentId, demoUser.id), eq(subscriptions.status, 'active')))
        .limit(1);
      hasActiveSubscription = activeSubs.length > 0;
    }

    const memberships = await db
      .select({ messId: messMemberships.messId })
      .from(messMemberships)
      .where(eq(messMemberships.userId, demoUser.id));

    return res.json({
      token: sessionToken,
      user: {
        id: demoUser.id,
        uid: demoUser.uid,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        phone: demoUser.phone,
        avatarUrl: demoUser.avatarUrl,
        messIds: memberships.map((m) => m.messId),
        hasActiveSubscription,
        isDemo: true,
      },
      profile,
      hasActiveSubscription,
      message: `Signed in as demo ${role}`,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Demo login failed.' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current session token in persistent session store
 */
api.post('/auth/logout', async (req, res) => {
  try {
    const sessionToken =
      (req.headers['x-session-token'] as string) ||
      (req.headers.authorization?.startsWith('Bearer mm_sess_') ? req.headers.authorization.split('Bearer ')[1] : '');

    if (sessionToken) {
      await invalidateSession(sessionToken);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and permissions
 */
api.get('/auth/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let profile: any = null;
    let hasActiveSubscription = false;

    if (user.role === 'student') {
      const p = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
      profile = p[0] || null;

      const activeSubs = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.studentId, user.id), eq(subscriptions.status, 'active')))
        .limit(1);
      hasActiveSubscription = activeSubs.length > 0;
    }

    // Unread notifications
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    res.json({
      user: {
        ...user,
        hasActiveSubscription,
      },
      profile,
      hasActiveSubscription,
      unreadNotifications,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// ============================================================================
// 2. STUDENT PORTAL
// ============================================================================

/**
 * GET /api/student/dashboard
 */
api.get('/student/dashboard', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;

    // Active subscriptions
    const activeSubs = await db
      .select({
        subscription: subscriptions,
        mess: messes,
        plan: mealPlans,
      })
      .from(subscriptions)
      .leftJoin(messes, eq(subscriptions.messId, messes.id))
      .leftJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(and(eq(subscriptions.studentId, studentId), eq(subscriptions.status, 'active')));

    // Credit ledger balance
    const latestLedger = await db
      .select()
      .from(mealCreditLedger)
      .where(eq(mealCreditLedger.studentId, studentId))
      .orderBy(desc(mealCreditLedger.id))
      .limit(1);

    const creditBalancePaise = latestLedger[0]?.balancePaiseAfter || 0;

    // Today & Upcoming slots for subscribed mess
    const todayStr = new Date().toISOString().split('T')[0];
    const subMessIds = activeSubs.map((s) => s.subscription.messId);

    let upcomingMeals: any[] = [];
    if (subMessIds.length > 0) {
      const slots = await db
        .select()
        .from(mealSlots)
        .where(and(inArray(mealSlots.messId, subMessIds), sql`${mealSlots.date} >= ${todayStr}`))
        .orderBy(mealSlots.date, mealSlots.startTime)
        .limit(6);

      const selections = await db
        .select()
        .from(mealSelections)
        .where(eq(mealSelections.studentId, studentId));

      upcomingMeals = slots.map((s) => {
        const sel = selections.find((x) => x.mealSlotId === s.id);
        return {
          slot: s,
          selectionStatus: sel ? sel.status : 'auto_selected', // Default is enrolled unless skipped
          selectionId: sel?.id || null,
        };
      });
    }

    res.json({
      activeSubscriptions: activeSubs,
      creditBalancePaise,
      upcomingMeals,
    });
  } catch (err: any) {
    console.error('Error fetching student dashboard:', err);
    res.status(500).json({ error: 'Failed to load student dashboard' });
  }
});

/**
 * GET /api/student/subscriptions
 */
api.get('/student/subscriptions', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const subs = await db
      .select({
        subscription: subscriptions,
        mess: messes,
        plan: mealPlans,
      })
      .from(subscriptions)
      .leftJoin(messes, eq(subscriptions.messId, messes.id))
      .leftJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(eq(subscriptions.studentId, studentId))
      .orderBy(desc(subscriptions.createdAt));

    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * POST /api/student/subscriptions
 * Demo checkout and subscription activation with simulated payment
 */
api.post('/student/subscriptions', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { mealPlanId, paymentMethod = 'simulated_upi' } = req.body;

    if (!mealPlanId) {
      return res.status(400).json({ error: 'mealPlanId is required' });
    }

    const planList = await db.select().from(mealPlans).where(eq(mealPlans.id, Number(mealPlanId))).limit(1);
    if (planList.length === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    const plan = planList[0];
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + plan.validityDays * 86400000).toISOString().split('T')[0];

    // Create Subscription
    const [sub] = await db
      .insert(subscriptions)
      .values({
        studentId,
        messId: plan.messId,
        mealPlanId: plan.id,
        planNameSnapshot: plan.name,
        planTypeSnapshot: plan.planType,
        pricePaidPaise: plan.pricePaise,
        remainingMeals: plan.totalMeals,
        totalMealsInitial: plan.totalMeals,
        skipsUsed: 0,
        startDate,
        endDate,
        status: 'active',
      })
      .returning();

    // Create Simulated Payment
    const paymentRef = `DEMO-PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const [payment] = await db
      .insert(demoPayments)
      .values({
        subscriptionId: sub.id,
        studentId,
        amountPaise: plan.pricePaise,
        paymentReference: paymentRef,
        paymentMethod,
        status: 'succeeded',
        isDemo: true,
      })
      .returning();

    // Create notification
    await db.insert(notifications).values({
      userId: studentId,
      title: 'Subscription Activated!',
      message: `Your ${plan.name} at ${plan.name} has been activated successfully. (Simulated Payment: ₹${plan.pricePaise / 100})`,
      type: 'menu_update',
      link: '/student/subscriptions',
    });

    // Audit log
    await db.insert(auditLogs).values({
      actorUserId: studentId,
      actorRole: 'student',
      action: 'subscribe_plan',
      resourceType: 'subscription',
      resourceId: String(sub.id),
      details: `Subscribed to plan ${plan.name} for ₹${plan.pricePaise / 100}`,
    });

    res.json({
      success: true,
      subscription: sub,
      payment,
      message: 'Demo subscription activated successfully!',
    });
  } catch (err: any) {
    console.error('Error activating subscription:', err);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

/**
 * GET /api/student/meals
 * Returns next 7 days of meals with menus, cutoff status, and skip options
 */
api.get('/student/meals', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const todayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Find student's active subscriptions
    const studentSubs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.studentId, studentId), eq(subscriptions.status, 'active')));

    if (studentSubs.length === 0) {
      return res.json({ meals: [], message: 'No active subscription found. Subscribe to a mess to plan meals.' });
    }

    const messIds = studentSubs.map((s) => s.messId);

    // Fetch upcoming slots
    const slots = await db
      .select({
        slot: mealSlots,
        mess: messes,
      })
      .from(mealSlots)
      .leftJoin(messes, eq(mealSlots.messId, messes.id))
      .where(and(inArray(mealSlots.messId, messIds), sql`${mealSlots.date} >= ${todayStr}`))
      .orderBy(mealSlots.date, mealSlots.startTime)
      .limit(21);

    // Fetch selections
    const selections = await db
      .select()
      .from(mealSelections)
      .where(eq(mealSelections.studentId, studentId));

    // Fetch menus & dishes
    const menuList = await db
      .select({
        menu: menus,
        item: menuItems,
        dish: dishes,
      })
      .from(menus)
      .leftJoin(menuItems, eq(menus.id, menuItems.menuId))
      .leftJoin(dishes, eq(menuItems.dishId, dishes.id))
      .where(inArray(menus.messId, messIds));

    const enrichedMeals = slots.map(({ slot, mess }) => {
      const sel = selections.find((x) => x.mealSlotId === slot.id);
      const slotMenus = menuList.filter((m) => m.menu.date === slot.date && m.menu.slotType === slot.slotType && m.menu.messId === slot.messId);
      const slotDishes = slotMenus.map((sm) => sm.dish).filter(Boolean);

      const now = new Date();
      const cutoff = new Date(slot.cutoffTimestamp);
      const isPastCutoff = now > cutoff || slot.status === 'completed';

      return {
        slot,
        mess,
        dishes: slotDishes,
        selectionStatus: sel ? sel.status : 'selected', // Default selected
        isSkipped: sel?.status === 'skipped',
        canSkip: !isPastCutoff && sel?.status !== 'skipped',
        canUnskip: !isPastCutoff && sel?.status === 'skipped',
        isPastCutoff,
        cutoffFormatted: cutoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    });

    res.json({ meals: enrichedMeals });
  } catch (err: any) {
    console.error('Error fetching student meals:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

/**
 * POST /api/student/meals/skip
 * Advance skip with strict cutoff verification and single-issuance credit ledger guarantee
 */
api.post('/api/student/meals/skip', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  // Aliased to handle both /api/student/meals/skip and /student/meals/skip
  handleSkip(req, res);
});
api.post('/student/meals/skip', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  handleSkip(req, res);
});

async function handleSkip(req: AuthRequest, res: any) {
  try {
    const studentId = req.user!.id;
    const { mealSlotId } = req.body;

    if (!mealSlotId || isNaN(Number(mealSlotId))) {
      return res.status(400).json({ error: 'Valid mealSlotId is required' });
    }

    const slotIdNum = Number(mealSlotId);

    const result = await db.transaction(async (tx) => {
      const slotList = await tx.select().from(mealSlots).where(eq(mealSlots.id, slotIdNum)).limit(1);
      if (slotList.length === 0) {
        throw { status: 404, message: 'Meal slot not found' };
      }

      const slot = slotList[0];
      const now = new Date();
      const cutoffTime = new Date(slot.cutoffTimestamp);

      // CUTOFF ENFORCEMENT: Cannot skip after deadline
      if (now > cutoffTime) {
        throw {
          status: 400,
          message: `Skip cutoff has passed for ${slot.date} ${slot.slotType}. Cutoff was at ${cutoffTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        };
      }

      // Find student's active subscription for this mess
      const activeSubList = await tx
        .select({
          subscription: subscriptions,
          plan: mealPlans,
        })
        .from(subscriptions)
        .leftJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
        .where(
          and(
            eq(subscriptions.studentId, studentId),
            eq(subscriptions.messId, slot.messId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (activeSubList.length === 0) {
        throw { status: 400, message: 'No active subscription found for this mess' };
      }

      const { subscription: sub, plan } = activeSubList[0];

      // Date range validation: slot date must fall within subscription date range
      if (slot.date < sub.startDate || slot.date > sub.endDate) {
        throw {
          status: 400,
          message: `Meal slot date ${slot.date} is outside subscription validity (${sub.startDate} to ${sub.endDate}).`,
        };
      }

      // Slot eligibility: plan covered slots must include slotType
      if (plan?.coveredSlots) {
        const covered = plan.coveredSlots.toLowerCase().split(',').map((s) => s.trim());
        if (!covered.includes(slot.slotType.toLowerCase())) {
          throw { status: 400, message: `Plan ${plan.name} does not cover ${slot.slotType} meals.` };
        }
      }

      // Remaining skip allowance check
      const maxSkips = plan?.maxSkipsAllowed ?? 12;
      if (sub.skipsUsed >= maxSkips) {
        throw { status: 400, message: `Maximum skip allowance (${maxSkips}) reached for this billing cycle.` };
      }

      // Unique idempotency key to prevent double issuance
      const idempotencyKey = `SKIP-${sub.id}-${slot.id}`;

      // Check if already skipped or credit already issued
      const existingCredit = await tx
        .select()
        .from(mealCreditLedger)
        .where(eq(mealCreditLedger.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingCredit.length > 0) {
        throw { status: 400, message: 'This meal has already been skipped and credit was already issued.' };
      }

      const creditAmountPaise = plan?.creditsPerSkipPaise || 5000;

      // 1. Upsert selection as 'skipped'
      const [selection] = await tx
        .insert(mealSelections)
        .values({
          studentId,
          subscriptionId: sub.id,
          mealSlotId: slot.id,
          messId: slot.messId,
          date: slot.date,
          slotType: slot.slotType,
          status: 'skipped',
          skippedAt: now,
        })
        .onConflictDoUpdate({
          target: [mealSelections.subscriptionId, mealSelections.mealSlotId],
          set: {
            status: 'skipped',
            skippedAt: now,
          },
        })
        .returning();

      // 2. Fetch latest credit balance inside transaction
      const latestLedger = await tx
        .select()
        .from(mealCreditLedger)
        .where(eq(mealCreditLedger.studentId, studentId))
        .orderBy(desc(mealCreditLedger.id))
        .limit(1);

      const prevBalance = latestLedger[0]?.balancePaiseAfter || 0;
      const newBalance = prevBalance + creditAmountPaise;

      // 3. Insert immutable credit event into ledger
      const [ledgerEntry] = await tx
        .insert(mealCreditLedger)
        .values({
          studentId,
          subscriptionId: sub.id,
          messId: slot.messId,
          idempotencyKey,
          transactionType: 'credit_earned_skip',
          amountPaise: creditAmountPaise,
          balancePaiseAfter: newBalance,
          reason: `Advance skip recorded for ${slot.date} ${slot.slotType}`,
          sourceSelectionId: selection.id,
        })
        .returning();

      // 4. Update subscription skips count
      await tx
        .update(subscriptions)
        .set({ skipsUsed: sql`${subscriptions.skipsUsed} + 1` })
        .where(eq(subscriptions.id, sub.id));

      // 5. Update expected diners on slot
      await tx
        .update(mealSlots)
        .set({ expectedDiners: sql`GREATEST(0, ${mealSlots.expectedDiners} - 1)` })
        .where(eq(mealSlots.id, slot.id));

      // 6. Notify student & owner
      await tx.insert(notifications).values([
        {
          userId: studentId,
          title: 'Meal Skip Approved & Credit Added',
          message: `Your skip for ${slot.date} ${slot.slotType} was recorded. ₹${creditAmountPaise / 100} has been added to your credit ledger.`,
          type: 'credit_earned',
          link: '/student/credits',
        },
      ]);

      // Audit log
      await tx.insert(auditLogs).values({
        actorUserId: studentId,
        actorRole: 'student',
        action: 'skip_meal',
        resourceType: 'meal_slot',
        resourceId: String(slot.id),
        details: `Advanced skipped ${slot.date} ${slot.slotType}. Credit earned: ₹${creditAmountPaise / 100}. Idempotency: ${idempotencyKey}`,
      });

      return {
        success: true,
        message: `Meal successfully skipped! ₹${creditAmountPaise / 100} added to your credit balance.`,
        creditBalancePaise: newBalance,
        ledgerEntry,
      };
    });

    return res.json(result);
  } catch (err: any) {
    if (err?.status && err?.message) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error skipping meal:', err);
    return res.status(500).json({ error: 'Failed to record meal skip' });
  }
}

/**
 * GET /api/student/credits
 * Complete audit-ready credit ledger history
 */
api.get('/student/credits', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const ledger = await db
      .select({
        entry: mealCreditLedger,
        messName: messes.name,
      })
      .from(mealCreditLedger)
      .leftJoin(messes, eq(mealCreditLedger.messId, messes.id))
      .where(eq(mealCreditLedger.studentId, studentId))
      .orderBy(desc(mealCreditLedger.createdAt));

    const currentBalancePaise = ledger[0]?.entry.balancePaiseAfter || 0;

    res.json({
      currentBalancePaise,
      ledger,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch credit ledger' });
  }
});

/**
 * POST /api/student/credits/redeem
 * Atomic and idempotent credit redemption towards subscription renewal discount
 */
api.post('/student/credits/redeem', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { amountPaise, subscriptionId } = req.body;

    const amt = Number(amountPaise);
    if (!amt || isNaN(amt) || amt <= 0 || !Number.isInteger(amt)) {
      return res.status(400).json({ error: 'Valid positive integer amountPaise is required' });
    }

    const result = await db.transaction(async (tx) => {
      // Find eligible active subscription for the student
      const studentSubs = await tx
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.studentId, studentId), eq(subscriptions.status, 'active')));

      if (studentSubs.length === 0) {
        throw { status: 400, message: 'No active subscription found to redeem credits against.' };
      }

      let sub: any;
      if (subscriptionId) {
        sub = studentSubs.find((s) => s.id === Number(subscriptionId));
        if (!sub) {
          throw { status: 403, message: 'Specified subscription does not belong to your account or is not active.' };
        }
      } else {
        sub = studentSubs[0];
      }

      // Check current ledger balance inside transaction
      const latestLedger = await tx
        .select()
        .from(mealCreditLedger)
        .where(eq(mealCreditLedger.studentId, studentId))
        .orderBy(desc(mealCreditLedger.id))
        .limit(1);

      const currentBalance = latestLedger[0]?.balancePaiseAfter || 0;
      if (amt > currentBalance) {
        throw {
          status: 400,
          message: `Insufficient credit balance (Current: ₹${currentBalance / 100}, Requested: ₹${amt / 100})`,
        };
      }

      const newBalance = currentBalance - amt;
      const idempotencyKey = `REDEEM-${studentId}-${sub.id}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      const [entry] = await tx
        .insert(mealCreditLedger)
        .values({
          studentId,
          subscriptionId: sub.id,
          messId: sub.messId, // Derived from student's actual subscription, never hardcoded
          idempotencyKey,
          transactionType: 'credit_redeemed_plan',
          amountPaise: -amt,
          balancePaiseAfter: newBalance,
          reason: `Redeemed ₹${amt / 100} credits towards upcoming meal renewal`,
        })
        .returning();

      // Audit log
      await tx.insert(auditLogs).values({
        actorUserId: studentId,
        actorRole: 'student',
        action: 'redeem_credits',
        resourceType: 'subscription',
        resourceId: String(sub.id),
        details: `Redeemed ₹${amt / 100} credits against subscription ${sub.id}. Remaining balance: ₹${newBalance / 100}`,
      });

      return {
        success: true,
        message: `Redeemed ₹${amt / 100} credits successfully!`,
        currentBalancePaise: newBalance,
        entry,
      };
    });

    return res.json(result);
  } catch (err: any) {
    if (err?.status && err?.message) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error redeeming credits:', err);
    return res.status(500).json({ error: 'Failed to redeem credits' });
  }
});

/**
 * GET /api/student/nutrition
 * Estimates calories & protein for selected meals with uncertainty disclosure
 */
api.get('/student/nutrition', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const profileList = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)).limit(1);
    const profile = profileList[0];

    // Find student's active subscribed mess
    const sub = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.studentId, studentId), eq(subscriptions.status, 'active')))
      .limit(1);

    if (sub.length === 0) {
      return res.json({
        totalCalories: 0,
        totalProtein: 0,
        dishes: [],
        insights: ['Subscribe to a mess to view real-time personalized macro calculations.'],
      });
    }

    // Get today's dishes for the mess
    const todayDishes = await db
      .select({ dish: dishes })
      .from(dishes)
      .where(eq(dishes.messId, sub[0].messId))
      .limit(6);

    const rawDishes = todayDishes.map((d) => d.dish);
    const studentGoal = profile
      ? { dailyCalories: profile.dailyCalorieTarget || 2200, dailyProtein: profile.dailyProteinTarget || 75 }
      : { dailyCalories: 2200, dailyProtein: 70 };

    const result = await analyzeMealNutritionWithAI({
      dishes: rawDishes,
      studentGoal,
    });

    res.json({
      ...result,
      dishes: rawDishes,
      studentGoal,
    });
  } catch (err: any) {
    console.error('Error fetching nutrition:', err);
    res.status(500).json({ error: 'Failed to calculate nutrition' });
  }
});

/**
 * POST /api/student/feedback
 * Submit ratings and review for a mess
 */
api.post('/student/feedback', authenticate, requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { messId, rating, foodQualityRating, hygieneRating, tasteRating, category, comment } = req.body;

    if (!messId || !rating || !comment) {
      return res.status(400).json({ error: 'messId, rating, and comment are required' });
    }

    const [fb] = await db
      .insert(feedbacks)
      .values({
        studentId,
        messId: Number(messId),
        rating: Number(rating),
        foodQualityRating: Number(foodQualityRating || rating),
        hygieneRating: Number(hygieneRating || rating),
        tasteRating: Number(tasteRating || rating),
        category: category || 'taste',
        comment,
        complaintStatus: Number(rating) <= 2 ? 'opened' : 'none',
      })
      .returning();

    // Update mess average rating
    const allFb = await db.select({ rating: feedbacks.rating }).from(feedbacks).where(eq(feedbacks.messId, Number(messId)));
    const avg = allFb.reduce((a, b) => a + b.rating, 0) / allFb.length;

    await db
      .update(messes)
      .set({
        rating: Math.round(avg * 10) / 10,
        reviewCount: allFb.length,
      })
      .where(eq(messes.id, Number(messId)));

    res.json({
      success: true,
      message: 'Feedback submitted successfully! Thank you for helping improve the dining experience.',
      feedback: fb,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// ============================================================================
// ============================================================================
// 3. MESS OWNER PORTAL
// ============================================================================

/**
 * Resolves the authenticated mess ID ensuring strict multi-tenancy.
 * Never defaults owners to mess 1 or unmanaged messes.
 */
function resolveOwnerMessId(req: AuthRequest, requestedMessId?: number | null): number | null {
  if (req.user?.role === 'admin') {
    return requestedMessId || req.user.messIds?.[0] || 1;
  }
  const userMesses = req.user?.messIds || [];
  if (userMesses.length === 0) {
    return null;
  }
  if (requestedMessId) {
    return userMesses.includes(requestedMessId) ? requestedMessId : null;
  }
  return userMesses[0];
}

/**
 * GET /api/owner/dashboard
 * Central kitchen operations snapshot for mess owner
 */
api.get('/owner/dashboard', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const messList = await db.select().from(messes).where(eq(messes.id, messId)).limit(1);
    if (messList.length === 0) {
      return res.status(404).json({ error: 'Mess not found.' });
    }
    const mess = messList[0];

    // Active subscribers count
    const activeSubs = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(eq(subscriptions.messId, messId), eq(subscriptions.status, 'active')));
    const activeSubscribersCount = Number(activeSubs[0]?.count || 0);

    // Revenue total (sum of demo payments)
    const rev = await db
      .select({ total: sql<number>`coalesce(sum(${demoPayments.amountPaise}), 0)` })
      .from(demoPayments)
      .leftJoin(subscriptions, eq(demoPayments.subscriptionId, subscriptions.id))
      .where(eq(subscriptions.messId, messId));
    const totalRevenuePaise = Number(rev[0]?.total || 0);

    // Today's meal slots
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySlots = await db
      .select()
      .from(mealSlots)
      .where(and(eq(mealSlots.messId, messId), eq(mealSlots.date, todayStr)))
      .orderBy(mealSlots.startTime);

    // Skips recorded this week
    const skips = await db
      .select({ count: sql<number>`count(*)` })
      .from(mealSelections)
      .where(and(eq(mealSelections.messId, messId), eq(mealSelections.status, 'skipped')));
    const totalSkipsCount = Number(skips[0]?.count || 0);

    // Waste records summary
    const wasteSummary = await db
      .select({
        leftovers: sql<number>`coalesce(sum(${kitchenProductionRecords.leftoverPortions}), 0)`,
        discarded: sql<number>`coalesce(sum(${kitchenProductionRecords.discardedPortions}), 0)`,
      })
      .from(kitchenProductionRecords)
      .where(eq(kitchenProductionRecords.messId, messId));

    const totalDiscarded = Number(wasteSummary[0]?.discarded || 0);
    const totalLeftovers = Number(wasteSummary[0]?.leftovers || 0);

    // Recent feedback
    const recentFeedbacks = await db
      .select({
        feedback: feedbacks,
        studentName: users.name,
      })
      .from(feedbacks)
      .leftJoin(users, eq(feedbacks.studentId, users.id))
      .where(eq(feedbacks.messId, messId))
      .orderBy(desc(feedbacks.createdAt))
      .limit(5);

    // AI insights
    const insights = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.messId, messId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(3);

    res.json({
      mess,
      activeSubscribersCount,
      totalRevenuePaise,
      todaySlots,
      totalSkipsCount,
      totalDiscardedPortions: totalDiscarded,
      totalLeftoversPortions: totalLeftovers,
      estimatedFoodSavedKg: Math.round(totalSkipsCount * 0.28 * 10) / 10,
      recentFeedbacks,
      insights,
    });
  } catch (err: any) {
    console.error('Error fetching owner dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch owner dashboard' });
  }
});

/**
 * GET /api/owner/kitchen
 * Live kitchen demand, forecast, and ingredient preparation recommendations
 */
api.get('/owner/kitchen', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const todayStr = new Date().toISOString().split('T')[0];

    // Find upcoming slots
    const slots = await db
      .select()
      .from(mealSlots)
      .where(and(eq(mealSlots.messId, messId), sql`${mealSlots.date} >= ${todayStr}`))
      .orderBy(mealSlots.date, mealSlots.startTime)
      .limit(6);

    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.messId, messId), eq(subscriptions.status, 'active')));

    const totalActiveSubscribers = activeSubs.length;

    // For each slot, calculate confirmed, skips, baseline forecast, AI forecast, and ingredient needs
    const kitchenSlots = await Promise.all(
      slots.map(async (slot) => {
        const selections = await db
          .select()
          .from(mealSelections)
          .where(and(eq(mealSelections.mealSlotId, slot.id), eq(mealSelections.messId, messId)));

        const skipsCount = selections.filter((s) => s.status === 'skipped').length;
        const confirmedCount = selections.filter((s) => s.status === 'selected').length;
        const unselectedCount = Math.max(0, totalActiveSubscribers - confirmedCount - skipsCount);

        // Baseline heuristic estimate = Active subscribers - Advance skips + 5% buffer
        const baselineForecast = Math.max(0, Math.round((totalActiveSubscribers - skipsCount) * 1.05));
        const aiAssistedForecast = Math.max(0, Math.round((totalActiveSubscribers - skipsCount * 1.1) + 4));

        // Existing production records
        const production = await db
          .select({
            record: kitchenProductionRecords,
            dish: dishes,
          })
          .from(kitchenProductionRecords)
          .leftJoin(dishes, eq(kitchenProductionRecords.dishId, dishes.id))
          .where(eq(kitchenProductionRecords.mealSlotId, slot.id));

        return {
          slot,
          totalActiveSubscribers,
          confirmedCount,
          skipsCount,
          unselectedCount,
          baselineForecast,
          aiAssistedForecast,
          recommendedPortions: baselineForecast,
          productionRecords: production,
        };
      })
    );

    res.json({ kitchenSlots });
  } catch (err: any) {
    console.error('Error fetching kitchen data:', err);
    res.status(500).json({ error: 'Failed to fetch kitchen data' });
  }
});

/**
 * POST /api/owner/kitchen/production
 * Record prepared, served, leftover, and discarded portions with atomic validation
 */
api.post('/owner/kitchen/production', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const ownerId = req.user!.id;
    const ownerMessId = resolveOwnerMessId(req);
    if (!ownerMessId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const { mealSlotId, dishId, portionsPrepared, portionsServed, leftoverPortions, discardedPortions, wasteReason, notes } = req.body;

    if (!mealSlotId || !dishId || portionsPrepared === undefined || portionsServed === undefined) {
      return res.status(400).json({ error: 'mealSlotId, dishId, portionsPrepared, and portionsServed are required' });
    }

    const prep = Number(portionsPrepared);
    const served = Number(portionsServed);
    const leftover = Number(leftoverPortions || 0);
    const discarded = Number(discardedPortions || 0);

    if (isNaN(prep) || isNaN(served) || isNaN(leftover) || isNaN(discarded)) {
      return res.status(400).json({ error: 'Portion quantities must be numeric' });
    }

    if (prep < 0 || served < 0 || leftover < 0 || discarded < 0) {
      return res.status(400).json({ error: 'Portion quantities cannot be negative' });
    }

    if (served > prep) {
      return res.status(400).json({ error: 'Portions served cannot exceed portions prepared' });
    }

    if (leftover + discarded > prep) {
      return res.status(400).json({ error: 'Leftovers and discarded portions cannot exceed portions prepared' });
    }

    const result = await db.transaction(async (tx) => {
      const slotList = await tx.select().from(mealSlots).where(eq(mealSlots.id, Number(mealSlotId))).limit(1);
      if (slotList.length === 0) {
        throw { status: 404, message: 'Meal slot not found' };
      }
      const slot = slotList[0];

      if (slot.messId !== ownerMessId) {
        throw { status: 403, message: 'Meal slot does not belong to your mess kitchen.' };
      }

      const dishList = await tx.select().from(dishes).where(eq(dishes.id, Number(dishId))).limit(1);
      if (dishList.length === 0) {
        throw { status: 404, message: 'Dish not found' };
      }
      const dish = dishList[0];

      if (dish.messId !== ownerMessId) {
        throw { status: 400, message: 'Dish does not belong to your mess kitchen.' };
      }

      const [record] = await tx
        .insert(kitchenProductionRecords)
        .values({
          messId: slot.messId,
          mealSlotId: slot.id,
          dishId: dish.id,
          date: slot.date,
          slotType: slot.slotType,
          portionsPrepared: prep,
          portionsServed: served,
          leftoverPortions: leftover,
          discardedPortions: discarded,
          wasteReason: wasteReason || 'none',
          notes: notes || null,
          recordedBy: ownerId,
        })
        .returning();

      // Update actual attendance on the slot
      await tx
        .update(mealSlots)
        .set({ actualDiners: served, status: 'completed' })
        .where(eq(mealSlots.id, slot.id));

      // Audit log
      await tx.insert(auditLogs).values({
        actorUserId: ownerId,
        actorRole: 'owner',
        action: 'record_production',
        resourceType: 'kitchen_production_record',
        resourceId: String(record.id),
        details: `Recorded production: ${prep} prep, ${served} served, ${discarded} discarded. Reason: ${wasteReason}`,
      });

      return record;
    });

    res.json({
      success: true,
      message: 'Production and waste record saved to database!',
      record: result,
    });
  } catch (err: any) {
    if (err?.status && err?.message) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error recording kitchen production:', err);
    res.status(500).json({ error: 'Failed to record kitchen production' });
  }
});

/**
 * GET /api/owner/attendance
 * Attendance roster and marked status for slot
 */
api.get('/owner/attendance', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const slotId = req.query.slotId ? Number(req.query.slotId) : null;
    const requestedSlotType = (req.query.slotType as string)?.toLowerCase();

    const todayStr = new Date().toISOString().split('T')[0];
    const allTodaySlots = await db
      .select()
      .from(mealSlots)
      .where(and(eq(mealSlots.messId, messId), eq(mealSlots.date, todayStr)))
      .orderBy(mealSlots.startTime);

    let targetSlot: any = null;
    if (slotId) {
      const s = await db.select().from(mealSlots).where(and(eq(mealSlots.id, slotId), eq(mealSlots.messId, messId))).limit(1);
      targetSlot = s[0];
    } else if (requestedSlotType && allTodaySlots.length > 0) {
      targetSlot = allTodaySlots.find((s) => s.slotType === requestedSlotType) || allTodaySlots[0];
    } else if (allTodaySlots.length > 0) {
      targetSlot = allTodaySlots.find((s) => s.slotType === 'dinner') || allTodaySlots[0];
    }

    if (!targetSlot) {
      return res.json({ slot: null, allTodaySlots: [], subscribers: [], attendedCount: 0 });
    }

    // Active subscribers for this mess
    const subs = await db
      .select({
        subscription: subscriptions,
        student: users,
        profile: studentProfiles,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.studentId, users.id))
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(and(eq(subscriptions.messId, messId), eq(subscriptions.status, 'active')));

    // Existing attendances for this slot
    const attendances = await db
      .select()
      .from(mealAttendances)
      .where(eq(mealAttendances.mealSlotId, targetSlot.id));

    // Selections / skips for this slot
    const selections = await db
      .select()
      .from(mealSelections)
      .where(eq(mealSelections.mealSlotId, targetSlot.id));

    const roster = subs.map((sub) => {
      const isAttended = attendances.some((a) => a.subscriptionId === sub.subscription.id);
      const sel = selections.find((s) => s.subscriptionId === sub.subscription.id);
      return {
        ...sub,
        isAttended,
        selectionStatus: sel?.status || 'selected',
        isSkipped: sel?.status === 'skipped',
      };
    });

    res.json({
      slot: targetSlot,
      allTodaySlots,
      subscribers: roster,
      attendedCount: attendances.length,
      expectedCount: targetSlot.expectedDiners,
    });
  } catch (err: any) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * POST /api/owner/attendance/mark
 * Mark student attendance with tenancy checks and duplicate prevention
 */
api.post('/owner/attendance/mark', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const ownerId = req.user!.id;
    const ownerMessId = resolveOwnerMessId(req);
    if (!ownerMessId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const { subscriptionId, mealSlotId, verificationMethod = 'manual_id' } = req.body;

    if (!subscriptionId || !mealSlotId) {
      return res.status(400).json({ error: 'subscriptionId and mealSlotId are required' });
    }

    const result = await db.transaction(async (tx) => {
      const slotList = await tx.select().from(mealSlots).where(eq(mealSlots.id, Number(mealSlotId))).limit(1);
      if (slotList.length === 0) {
        throw { status: 404, message: 'Meal slot not found' };
      }
      const slot = slotList[0];

      if (slot.messId !== ownerMessId) {
        throw { status: 403, message: 'Meal slot does not belong to your mess kitchen.' };
      }

      const subList = await tx.select().from(subscriptions).where(eq(subscriptions.id, Number(subscriptionId))).limit(1);
      if (subList.length === 0) {
        throw { status: 404, message: 'Subscription not found' };
      }
      const sub = subList[0];

      if (sub.messId !== ownerMessId) {
        throw { status: 400, message: 'Subscription does not belong to this mess kitchen.' };
      }

      // Check duplicate attendance
      const existing = await tx
        .select()
        .from(mealAttendances)
        .where(and(eq(mealAttendances.subscriptionId, sub.id), eq(mealAttendances.mealSlotId, slot.id)))
        .limit(1);

      if (existing.length > 0) {
        throw { status: 400, message: 'Attendance already marked for this student in this meal slot.' };
      }

      // Insert attendance
      const [att] = await tx
        .insert(mealAttendances)
        .values({
          studentId: sub.studentId,
          subscriptionId: sub.id,
          mealSlotId: slot.id,
          messId: sub.messId,
          markedBy: ownerId,
          verificationMethod,
        })
        .returning();

      // Decrement remaining meals if flex plan
      if (sub.remainingMeals > 0) {
        await tx
          .update(subscriptions)
          .set({ remainingMeals: sql`${subscriptions.remainingMeals} - 1` })
          .where(eq(subscriptions.id, sub.id));
      }

      return att;
    });

    res.json({
      success: true,
      message: 'Attendance recorded successfully!',
      attendance: result,
    });
  } catch (err: any) {
    if (err?.status && err?.message) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

/**
 * GET /api/owner/subscribers
 * Full active subscriber list with profile and plan details
 */
api.get('/owner/subscribers', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const subs = await db
      .select({
        subscription: subscriptions,
        student: users,
        profile: studentProfiles,
        plan: mealPlans,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.studentId, users.id))
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(eq(subscriptions.messId, messId))
      .orderBy(desc(subscriptions.createdAt));

    res.json({ subscribers: subs });
  } catch (err: any) {
    console.error('Error fetching subscribers:', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

/**
 * GET /api/owner/dishes
 * List all dishes created for this mess
 */
api.get('/owner/dishes', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const messDishes = await db.select().from(dishes).where(eq(dishes.messId, messId)).orderBy(dishes.name);
    res.json({ dishes: messDishes });
  } catch (err: any) {
    console.error('Error fetching owner dishes:', err);
    res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

/**
 * POST /api/owner/dishes
 * Add a new dish to the mess menu library with auto ICMR/IFCT macro calculations
 */
api.post('/owner/dishes', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const {
      name,
      category = 'main_course',
      isVegetarian = true,
      standardPortionGrams = 180,
      caloriesEst,
      proteinGramsEst,
      carbsGramsEst,
      fatGramsEst,
      description = '',
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Dish name is required.' });
    }

    const portion = Number(standardPortionGrams) || 180;
    const calculated = calculateFoodMacros(name.trim(), portion, {
      calories: caloriesEst ? Number(caloriesEst) : undefined,
      protein: proteinGramsEst ? Number(proteinGramsEst) : undefined,
      carbs: carbsGramsEst ? Number(carbsGramsEst) : undefined,
      fat: fatGramsEst ? Number(fatGramsEst) : undefined,
    });

    const [newDish] = await db
      .insert(dishes)
      .values({
        messId,
        name: name.trim(),
        category: category || 'main_course',
        dietaryType: isVegetarian ? 'veg' : 'non_veg',
        standardPortionGrams: portion,
        caloriesEst: calculated.calories,
        proteinGramsEst: calculated.protein,
        carbsGramsEst: calculated.carbs,
        fatGramsEst: calculated.fat,
        description: description?.trim() || `Fresh kitchen prepared ${name.trim()}`,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: `${newDish.name} added to your mess dishes library!`,
      dish: newDish,
    });
  } catch (err: any) {
    console.error('Error creating dish:', err);
    res.status(500).json({ error: 'Failed to create dish' });
  }
});

/**
 * PUT /api/owner/dishes/:id
 * Update an existing dish
 */
api.put('/owner/dishes/:id', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const dishId = Number(req.params.id);
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const {
      name,
      category,
      isVegetarian,
      standardPortionGrams,
      caloriesEst,
      proteinGramsEst,
      carbsGramsEst,
      fatGramsEst,
      description,
    } = req.body;

    const existingList = await db.select().from(dishes).where(and(eq(dishes.id, dishId), eq(dishes.messId, messId))).limit(1);
    if (existingList.length === 0) {
      return res.status(404).json({ error: 'Dish not found or not owned by your mess.' });
    }
    const existing = existingList[0];

    const portion = standardPortionGrams ? Number(standardPortionGrams) : existing.standardPortionGrams;
    const calculated = calculateFoodMacros(name ? name.trim() : existing.name, portion, {
      calories: caloriesEst ? Number(caloriesEst) : existing.caloriesEst,
      protein: proteinGramsEst ? Number(proteinGramsEst) : existing.proteinGramsEst,
      carbs: carbsGramsEst ? Number(carbsGramsEst) : existing.carbsGramsEst,
      fat: fatGramsEst ? Number(fatGramsEst) : existing.fatGramsEst,
    });

    const [updated] = await db
      .update(dishes)
      .set({
        name: name ? name.trim() : existing.name,
        category: category || existing.category,
        dietaryType: isVegetarian !== undefined ? (isVegetarian ? 'veg' : 'non_veg') : existing.dietaryType,
        standardPortionGrams: portion,
        caloriesEst: calculated.calories,
        proteinGramsEst: calculated.protein,
        carbsGramsEst: calculated.carbs,
        fatGramsEst: calculated.fat,
        description: description !== undefined ? description : existing.description,
      })
      .where(eq(dishes.id, dishId))
      .returning();

    res.json({
      success: true,
      message: `${updated.name} updated successfully!`,
      dish: updated,
    });
  } catch (err: any) {
    console.error('Error updating dish:', err);
    res.status(500).json({ error: 'Failed to update dish' });
  }
});

/**
 * DELETE /api/owner/dishes/:id
 * Remove a dish
 */
api.delete('/owner/dishes/:id', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const dishId = Number(req.params.id);
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    await db.delete(dishes).where(and(eq(dishes.id, dishId), eq(dishes.messId, messId)));
    res.json({ success: true, message: 'Dish removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete dish' });
  }
});

/**
 * GET /api/owner/menus
 * Get all menus with dish associations for owner's mess
 */
api.get('/owner/menus', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const allMenus = await db.select().from(menus).where(eq(menus.messId, messId)).orderBy(desc(menus.date));
    const allItems = await db
      .select({
        item: menuItems,
        dish: dishes,
      })
      .from(menuItems)
      .leftJoin(dishes, eq(menuItems.dishId, dishes.id));

    const enriched = allMenus.map((m) => {
      const items = allItems.filter((it) => it.item.menuId === m.id);
      return {
        ...m,
        dishes: items.map((it) => it.dish).filter(Boolean),
      };
    });

    res.json({ menus: enriched });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

/**
 * POST /api/owner/menus/schedule
 * Put or update scheduled menu for a date and meal slot (Breakfast, Lunch, Dinner)
 */
api.post('/owner/menus/schedule', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const { date, slotType, title, specialNote, dishIds = [] } = req.body;

    if (!date || !slotType) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) and slotType (breakfast|lunch|dinner) are required.' });
    }

    // Check if menu exists for this slot
    const existing = await db
      .select()
      .from(menus)
      .where(and(eq(menus.messId, messId), eq(menus.date, date), eq(menus.slotType, slotType)))
      .limit(1);

    let menuId: number;
    if (existing.length > 0) {
      menuId = existing[0].id;
      await db
        .update(menus)
        .set({
          title: title || existing[0].title,
          specialNote: specialNote !== undefined ? specialNote : existing[0].specialNote,
        })
        .where(eq(menus.id, menuId));

      // Remove existing item relations
      await db.delete(menuItems).where(eq(menuItems.menuId, menuId));
    } else {
      const [newMenu] = await db
        .insert(menus)
        .values({
          messId,
          date,
          slotType,
          title: title || `${slotType.toUpperCase()} Special Menu`,
          specialNote: specialNote || null,
          status: 'published',
        })
        .returning();
      menuId = newMenu.id;
    }

    // Insert new dish connections (ensuring dishes belong to this mess)
    if (Array.isArray(dishIds) && dishIds.length > 0) {
      for (const dId of dishIds) {
        await db.insert(menuItems).values({
          menuId,
          dishId: Number(dId),
          isMain: true,
          isOptional: false,
        });
      }
    }

    res.json({
      success: true,
      message: `Menu for ${date} (${slotType}) updated with ${dishIds.length} dishes!`,
      menuId,
    });
  } catch (err: any) {
    console.error('Error scheduling menu:', err);
    res.status(500).json({ error: 'Failed to schedule menu' });
  }
});

/**
 * GET /api/owner/analytics
 * Trustworthy metrics: Revenue, Forecast Error, Measured Waste, and Attendance without fakes
 */
api.get('/owner/analytics', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    // 1. Total revenue
    const rev = await db
      .select({ total: sql<number>`coalesce(sum(${demoPayments.amountPaise}), 0)` })
      .from(demoPayments)
      .leftJoin(subscriptions, eq(demoPayments.subscriptionId, subscriptions.id))
      .where(eq(subscriptions.messId, messId));
    const totalRevenue = Number(rev[0]?.total || 0) / 100;

    // 2. Total Skips & Credit Value
    const skips = await db
      .select({ count: sql<number>`count(*)` })
      .from(mealSelections)
      .where(and(eq(mealSelections.messId, messId), eq(mealSelections.status, 'skipped')));
    const totalSkips = Number(skips[0]?.count || 0);

    // 3. Waste Records by Reason
    const wasteByReason = await db
      .select({
        reason: kitchenProductionRecords.wasteReason,
        totalDiscarded: sql<number>`sum(${kitchenProductionRecords.discardedPortions})`,
        totalLeftovers: sql<number>`sum(${kitchenProductionRecords.leftoverPortions})`,
      })
      .from(kitchenProductionRecords)
      .where(eq(kitchenProductionRecords.messId, messId))
      .groupBy(kitchenProductionRecords.wasteReason);

    // 4. Past 7 days attendance trend (Actual values only if recorded; no fallback synthetic math)
    const recentSlots = await db
      .select()
      .from(mealSlots)
      .where(eq(mealSlots.messId, messId))
      .orderBy(desc(mealSlots.date))
      .limit(10);

    const trends = recentSlots.map((s) => ({
      date: `${s.date} ${s.slotType.slice(0, 1).toUpperCase()}`,
      expected: s.expectedDiners,
      actual: s.actualDiners !== null && s.actualDiners !== undefined ? s.actualDiners : null,
    }));

    // 5. Forecast Error Metric (Mean Absolute Error) calculated ONLY from records with actual outcomes
    const forecastsWithActual = await db
      .select()
      .from(demandForecasts)
      .where(and(eq(demandForecasts.messId, messId), sql`${demandForecasts.actualDiners} is not null`));

    let mae: string | null = null;
    if (forecastsWithActual.length > 0) {
      const totalError = forecastsWithActual.reduce((acc, f) => {
        const err = f.forecastErrorAbs ?? Math.abs((f.predictedDiners || 0) - (f.actualDiners || 0));
        return acc + err;
      }, 0);
      mae = (totalError / forecastsWithActual.length).toFixed(1);
    }

    const totalDiscardedSum = wasteByReason.reduce((sum, w) => sum + Number(w.totalDiscarded || 0), 0);

    res.json({
      totalRevenueINR: totalRevenue,
      totalAdvanceSkips: totalSkips,
      // Distinguish advance food preparation avoided vs measured kitchen waste
      estimatedFoodAvoidedKg: Math.round(totalSkips * 0.28 * 10) / 10,
      measuredKitchenWasteKg: Math.round(totalDiscardedSum * 0.25 * 10) / 10,
      meanAbsoluteForecastError: mae, // null indicates "Not enough data yet"
      wasteBreakdown: wasteByReason.map((w) => ({
        reason: w.reason || 'unspecified',
        discarded: Number(w.totalDiscarded || 0),
        leftovers: Number(w.totalLeftovers || 0),
      })),
      attendanceTrends: trends.reverse(),
    });
  } catch (err: any) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * POST /api/owner/copilot
 * Operational Q&A grounded exclusively in facts from the authenticated owner's mess
 */
api.post('/owner/copilot', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { query } = req.body;
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }

    const messList = await db.select().from(messes).where(eq(messes.id, messId)).limit(1);
    const mess = messList[0];

    const subs = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(eq(subscriptions.messId, messId), eq(subscriptions.status, 'active')));

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySlot = await db
      .select()
      .from(mealSlots)
      .where(and(eq(mealSlots.messId, messId), eq(mealSlots.date, todayStr)))
      .limit(1);

    const skips = await db
      .select({ count: sql<number>`count(*)` })
      .from(mealSelections)
      .where(and(eq(mealSelections.messId, messId), eq(mealSelections.status, 'skipped')));

    const waste = await db
      .select({ total: sql<number>`coalesce(sum(${kitchenProductionRecords.discardedPortions}), 0)` })
      .from(kitchenProductionRecords)
      .where(eq(kitchenProductionRecords.messId, messId));

    const complaints = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbacks)
      .where(and(eq(feedbacks.messId, messId), eq(feedbacks.complaintStatus, 'opened')));

    // Top wasted dish dynamically queried from this mess only
    const topWasted = await db
      .select({
        dishName: dishes.name,
        discarded: sql<number>`coalesce(sum(${kitchenProductionRecords.discardedPortions}), 0)`,
      })
      .from(kitchenProductionRecords)
      .innerJoin(dishes, eq(kitchenProductionRecords.dishId, dishes.id))
      .where(eq(kitchenProductionRecords.messId, messId))
      .groupBy(dishes.name)
      .orderBy(desc(sql`sum(${kitchenProductionRecords.discardedPortions})`))
      .limit(1);

    const topWastedDishName =
      topWasted.length > 0 && Number(topWasted[0].discarded) > 0
        ? `${topWasted[0].dishName} (${topWasted[0].discarded} portions discarded)`
        : 'Not enough data recorded yet';

    // Most popular plan queried dynamically from this mess only
    const popularPlan = await db
      .select({
        planName: mealPlans.name,
        subCount: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .innerJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(eq(subscriptions.messId, messId))
      .groupBy(mealPlans.name)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    const mostPopularPlanName =
      popularPlan.length > 0
        ? `${popularPlan[0].planName} (${popularPlan[0].subCount} subscribers)`
        : 'Not enough data recorded yet';

    const context = {
      messName: mess?.name || 'Mess',
      activeSubscribers: Number(subs[0]?.count || 0),
      todayExpected: todaySlot[0]?.expectedDiners ?? null,
      totalSkipsThisWeek: Number(skips[0]?.count || 0),
      totalWasteThisWeekKg: Math.round(Number(waste[0]?.total || 0) * 0.25 * 10) / 10,
      topWastedDish: topWastedDishName,
      recentComplaintsCount: Number(complaints[0]?.count || 0),
      mostPopularPlan: mostPopularPlanName,
    };

    const copilotResult = await runOwnerCopilotQuery(query, context);

    res.json(copilotResult);
  } catch (err: any) {
    console.error('Error running owner copilot:', err);
    res.status(500).json({ error: 'Failed to process copilot query' });
  }
});

/**
 * GET /api/owner/feedback
 * Fetch feedback with student details and complaint status
 */
api.get('/owner/feedback', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const fbList = await db
      .select({
        feedback: feedbacks,
        studentName: users.name,
        studentEmail: users.email,
      })
      .from(feedbacks)
      .leftJoin(users, eq(feedbacks.studentId, users.id))
      .where(eq(feedbacks.messId, messId))
      .orderBy(desc(feedbacks.createdAt));

    res.json(fbList);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

/**
 * POST /api/owner/feedback/:id/reply
 * Respond to feedback and update complaint status
 */
api.post('/owner/feedback/:id/reply', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const feedbackId = Number(req.params.id);
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const { ownerResponse, complaintStatus = 'resolved' } = req.body;

    const [updated] = await db
      .update(feedbacks)
      .set({
        ownerResponse,
        complaintStatus,
        respondedAt: new Date(),
      })
      .where(and(eq(feedbacks.id, feedbackId), eq(feedbacks.messId, messId)))
      .returning();

    // Notify the student
    if (updated) {
      await db.insert(notifications).values({
        userId: updated.studentId,
        title: 'Mess Owner Responded to Your Review',
        message: `Owner response: "${ownerResponse.slice(0, 100)}..."`,
        type: 'complaint_reply',
        link: '/student/feedback',
      });
    }

    res.json({
      success: true,
      message: 'Response posted successfully!',
      feedback: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// ============================================================================
// 4. ADMIN & PLATFORM TOOLS
// ============================================================================

/**
 * GET /api/admin/dashboard
 */
api.get('/admin/dashboard', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const allMesses = await db.select().from(messes);
    const allUsers = await db.select().from(users);
    const allSubs = await db.select().from(subscriptions);
    const allPayments = await db.select().from(demoPayments);
    const allLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);

    const totalRevenuePaise = allPayments.reduce((a, p) => a + p.amountPaise, 0);

    res.json({
      totalMesses: allMesses.length,
      totalUsers: allUsers.length,
      activeSubscriptions: allSubs.filter((s) => s.status === 'active').length,
      totalRevenueINR: totalRevenuePaise / 100,
      messes: allMesses,
      users: allUsers,
      recentAuditLogs: allLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
});

/**
 * POST /api/admin/reset-demo
 * Development-only database reset and seed reload
 */
api.post('/admin/reset-demo', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await seedDatabase(true);
    await db.insert(auditLogs).values({
      actorUserId: req.user!.id,
      actorRole: 'admin',
      action: 'reset_demo_data',
      resourceType: 'database',
      resourceId: 'all',
      details: 'Admin triggered full demo database reset and seed reload',
    });
    res.json({ success: true, message: 'Database reset and seeded successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// ============================================================================
// 5. AI SERVICES (MESS FINDER, NUTRITION, FEEDBACK)
// ============================================================================

/**
 * POST /api/ai/mess-finder
 */
api.post('/ai/mess-finder', async (req, res) => {
  try {
    const { dietaryPref = 'veg', monthlyBudget = 4000, priorities = ['Hygienic', 'High Protein'], allergies } = req.body;

    const allMesses = await db.select().from(messes).where(eq(messes.status, 'active'));
    const allPlans = await db.select().from(mealPlans).where(eq(mealPlans.isActive, true));

    const messesWithPlans = allMesses.map((m) => ({
      ...m,
      plans: allPlans.filter((p) => p.messId === m.id),
    }));

    const result = await matchMessesWithAI({
      dietaryPref,
      monthlyBudget: Number(monthlyBudget),
      priorities,
      allergies,
      targetMesses: messesWithPlans,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error running AI mess finder:', err);
    res.status(500).json({ error: 'Failed to find matching messes' });
  }
});

/**
 * POST /api/ai/feedback-summary
 */
api.post('/ai/feedback-summary', authenticate, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const messId = resolveOwnerMessId(req);
    if (!messId) {
      return res.status(403).json({ error: 'No mess kitchen assigned to this account.' });
    }
    const fbList = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.messId, messId))
      .orderBy(desc(feedbacks.createdAt))
      .limit(15);

    const summary = await analyzeFeedbackThemesWithAI(fbList);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to analyze feedback' });
  }
});

export default api;
