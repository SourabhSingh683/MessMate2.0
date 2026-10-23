import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createPool } from '../src/db/index.ts';
import { prisma } from '../src/lib/prisma.ts';
import {
  createSession,
  invalidateSession,
  setStoredPassword,
  verifyStoredPassword,
} from '../src/server/auth.ts';
import {
  users,
  messes,
  mealPlans,
  subscriptions,
  demoPayments,
  mealSlots,
  mealSelections,
  mealAttendances,
  mealCreditLedger,
  feedbacks,
  kitchenProductionRecords,
} from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { matchMessesWithAI, analyzeMealNutritionWithAI } from '../src/server/ai.ts';

describe('MessMate 2.0 - Core Business Logic & End-to-End Sequence', () => {
  let testStudent: any;
  let testOwner: any;
  let testMess: any;
  let testPlan: any;
  let testSlot: any;
  let testSub: any;

  beforeAll(async () => {
    // 1. Verify Seeded Personas Exist in PostgreSQL
    const studentList = await db.select().from(users).where(eq(users.role, 'student')).limit(1);
    expect(studentList.length).toBeGreaterThan(0);
    testStudent = studentList[0];

    const ownerList = await db.select().from(users).where(eq(users.role, 'owner')).limit(1);
    expect(ownerList.length).toBeGreaterThan(0);
    testOwner = ownerList[0];

    const messList = await db.select().from(messes).where(eq(messes.status, 'active')).limit(1);
    expect(messList.length).toBeGreaterThan(0);
    testMess = messList[0];

    const planList = await db.select().from(mealPlans).where(eq(mealPlans.messId, testMess.id)).limit(1);
    expect(planList.length).toBeGreaterThan(0);
    testPlan = planList[0];
  });

  it('Step 1 & 2: Student finds a mess and activates a demo subscription with simulated payment', async () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];

    // Create Subscription
    const [sub] = await db
      .insert(subscriptions)
      .values({
        studentId: testStudent.id,
        messId: testMess.id,
        mealPlanId: testPlan.id,
        planNameSnapshot: testPlan.name,
        planTypeSnapshot: testPlan.planType,
        pricePaidPaise: testPlan.pricePaise,
        remainingMeals: testPlan.totalMeals,
        totalMealsInitial: testPlan.totalMeals,
        skipsUsed: 0,
        startDate,
        endDate,
        status: 'active',
      })
      .returning();

    testSub = sub;
    expect(sub.id).toBeDefined();
    expect(sub.remainingMeals).toBe(testPlan.totalMeals);

    // Create Simulated Payment
    const paymentRef = `TEST-DEMO-PAY-${Date.now()}`;
    const [payment] = await db
      .insert(demoPayments)
      .values({
        subscriptionId: sub.id,
        studentId: testStudent.id,
        amountPaise: testPlan.pricePaise,
        paymentReference: paymentRef,
        paymentMethod: 'simulated_upi',
        status: 'succeeded',
        isDemo: true,
      })
      .returning();

    expect(payment.status).toBe('succeeded');
    expect(payment.isDemo).toBe(true);
    expect(payment.amountPaise).toBe(testPlan.pricePaise);
  });

  it('Step 3 & 4: Student skips an eligible meal before cutoff and earns exactly one credit', async () => {
    // Create future meal slot
    const futureDate = new Date(Date.now() + 2 * 86400000);
    const dateStr = futureDate.toISOString().split('T')[0];
    const cutoffTime = new Date(futureDate.getTime() - 12 * 3600000);

    const [slot] = await db
      .insert(mealSlots)
      .values({
        messId: testMess.id,
        date: dateStr,
        slotType: 'dinner',
        startTime: '19:30',
        endTime: '21:30',
        cutoffTimestamp: cutoffTime,
        status: 'open',
        expectedDiners: 50,
        actualDiners: 0,
      })
      .returning();

    testSlot = slot;

    // Record Advance Skip
    const idempotencyKey = `TEST-SKIP-${testSub.id}-${testSlot.id}`;

    // Verify cutoff boundary: cutoff is in future
    expect(new Date() < new Date(testSlot.cutoffTimestamp)).toBe(true);

    // Insert selection as skipped
    const [selection] = await db
      .insert(mealSelections)
      .values({
        studentId: testStudent.id,
        subscriptionId: testSub.id,
        mealSlotId: testSlot.id,
        messId: testMess.id,
        date: testSlot.date,
        slotType: testSlot.slotType,
        status: 'skipped',
        skippedAt: new Date(),
      })
      .returning();

    expect(selection.status).toBe('skipped');

    // Credit Ledger Entry
    const [creditEntry] = await db
      .insert(mealCreditLedger)
      .values({
        studentId: testStudent.id,
        subscriptionId: testSub.id,
        messId: testMess.id,
        idempotencyKey,
        transactionType: 'credit_earned_skip',
        amountPaise: 5000, // ₹50
        balancePaiseAfter: 20000,
        reason: `Advance skip recorded for ${testSlot.date} dinner`,
        sourceSelectionId: selection.id,
      })
      .returning();

    expect(creditEntry.amountPaise).toBe(5000);
    expect(creditEntry.idempotencyKey).toBe(idempotencyKey);

    // DUPLICATE SKIP PREVENTION: Attempting to insert duplicate credit with same idempotency key must fail
    await expect(
      db.insert(mealCreditLedger).values({
        studentId: testStudent.id,
        subscriptionId: testSub.id,
        messId: testMess.id,
        idempotencyKey, // Duplicate!
        transactionType: 'credit_earned_skip',
        amountPaise: 5000,
        balancePaiseAfter: 25000,
        reason: 'Duplicate attempt',
      })
    ).rejects.toThrow();
  });

  it('Step 5 & 6: Owner records prepared, served, and leftover quantities with valid reasons', async () => {
    const [record] = await db
      .insert(kitchenProductionRecords)
      .values({
        messId: testMess.id,
        mealSlotId: testSlot.id,
        dishId: 1,
        date: testSlot.date,
        slotType: testSlot.slotType,
        portionsPrepared: 48,
        portionsServed: 45,
        leftoverPortions: 3,
        discardedPortions: 0,
        wasteReason: 'none',
        notes: 'Balanced student turnout adhering to skip forecasts.',
        recordedBy: testOwner.id,
      })
      .returning();

    expect(record.portionsPrepared).toBe(48);
    expect(record.portionsServed).toBe(45);
    expect(record.leftoverPortions).toBe(3);
    expect(record.discardedPortions).toBe(0);
  });

  it('Step 7: Duplicate attendance prevention on the same slot', async () => {
    // 1st Attendance Mark
    const [att1] = await db
      .insert(mealAttendances)
      .values({
        studentId: testStudent.id,
        subscriptionId: testSub.id,
        mealSlotId: testSlot.id,
        messId: testMess.id,
        markedBy: testOwner.id,
        verificationMethod: 'manual_id',
      })
      .returning();

    expect(att1.id).toBeDefined();

    // 2nd Attendance Mark on SAME (subscriptionId, mealSlotId) must be rejected by unique index
    await expect(
      db.insert(mealAttendances).values({
        studentId: testStudent.id,
        subscriptionId: testSub.id,
        mealSlotId: testSlot.id, // Duplicate!
        messId: testMess.id,
        markedBy: testOwner.id,
        verificationMethod: 'manual_id',
      })
    ).rejects.toThrow();
  });

  it('Step 8 & 9: Student submits feedback and owner responds to resolve complaint', async () => {
    const [fb] = await db
      .insert(feedbacks)
      .values({
        studentId: testStudent.id,
        messId: testMess.id,
        rating: 4,
        foodQualityRating: 4,
        hygieneRating: 5,
        tasteRating: 4,
        category: 'taste',
        comment: 'Rotis were hot and soft. Paneer curry was fresh.',
        complaintStatus: 'none',
      })
      .returning();

    expect(fb.rating).toBe(4);

    // Owner reply
    const [updated] = await db
      .update(feedbacks)
      .set({
        ownerResponse: 'Thank you for your feedback! We are delighted you enjoyed the fresh phulkas.',
        complaintStatus: 'resolved',
        respondedAt: new Date(),
      })
      .where(eq(feedbacks.id, fb.id))
      .returning();

    expect(updated.ownerResponse).toContain('Thank you');
    expect(updated.complaintStatus).toBe('resolved');
  });

  it('Step 10: AI Services handle fallbacks deterministically and validate structure', async () => {
    // Test AI Mess Finder ranking validation
    const finderResult = await matchMessesWithAI({
      dietaryPref: 'veg',
      monthlyBudget: 3500,
      priorities: ['High Protein', 'Homestyle'],
      targetMesses: [testMess],
    });

    expect(finderResult.recommendations).toBeDefined();
    expect(Array.isArray(finderResult.recommendations)).toBe(true);
    expect(finderResult.recommendations[0].messId).toBe(testMess.id);
    expect(finderResult.recommendations[0].matchPercentage).toBeGreaterThanOrEqual(50);

    // Test AI Nutrition Companion
    const nutritionResult = await analyzeMealNutritionWithAI({
      dishes: [
        {
          name: 'Dal Tadka',
          standardPortionGrams: 200,
          caloriesEst: 210,
          proteinGramsEst: 9.5,
          carbsGramsEst: 26.0,
          fatGramsEst: 6.5,
        },
      ],
      studentGoal: { dailyCalories: 2200, dailyProtein: 75 },
    });

    expect(nutritionResult.totalCalories).toBe(210);
    expect(nutritionResult.totalProtein).toBe(9.5);
    expect(nutritionResult.disclaimer).toBeDefined();
  }, 35000);

  it('Step 11: Singleton Prisma Client connects and executes query', async () => {
    expect(prisma).toBeDefined();
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThan(0);

    const firstStudent = await prisma.user.findFirst({
      where: { role: 'student' },
    });
    expect(firstStudent).toBeDefined();
    expect(firstStudent?.email).toBeDefined();
  });

  it('Step 12: Real User Session and Password Authentication Lifecycle', async () => {
    // 1. Password hashing & validation
    const testEmail = 'real.student.test@campus.edu';
    setStoredPassword(testEmail, 'SecretPass@2026');

    expect(verifyStoredPassword(testEmail, 'SecretPass@2026')).toBe(true);
    expect(verifyStoredPassword(testEmail, 'WrongPassword!')).toBe(false);

    // 2. Session Token generation and validation
    const token = createSession(testStudent.id);
    expect(token).toMatch(/^mm_sess_[0-9a-f]{64}$/);

    // Invalidate session
    invalidateSession(token);
  });

  afterAll(async () => {
    const pool = createPool();
    await pool.end();
    await prisma.$disconnect();
  });
});
