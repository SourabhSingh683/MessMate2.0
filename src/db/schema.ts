import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// 1. Identity & Tenancy
// -----------------------------------------------------------------------------

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or demo unique key
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('student'), // 'student' | 'owner' | 'admin'
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  hostelBlock: text('hostel_block').default('Block-A'),
  roomNumber: text('room_number').default('101'),
  collegeId: text('college_id').default('COL2026-089'),
  dietaryPref: text('dietary_pref').default('veg').notNull(), // 'veg' | 'non_veg' | 'egg_veg'
  allergies: text('allergies'),
  dailyCalorieTarget: integer('daily_calorie_target').default(2200),
  dailyProteinTarget: integer('daily_protein_target').default(70),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messes = pgTable('messes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  distanceKm: doublePrecision('distance_km').default(0.4),
  contactPhone: text('contact_phone').notNull(),
  contactEmail: text('contact_email').notNull(),
  operatingHours: text('operating_hours').default('7:30 AM - 10:00 PM').notNull(),
  rating: doublePrecision('rating').default(4.5).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  cuisineTypes: text('cuisine_types').default('North Indian, South Indian').notNull(),
  isPureVeg: boolean('is_pure_veg').default(false).notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'pending' | 'suspended'
  monthlyBasePricePaise: integer('monthly_base_price_paise').default(320000).notNull(),
  selectionCutoffHours: integer('selection_cutoff_hours').default(12).notNull(), // Hours before slot start
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messMemberships = pgTable('mess_memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').default('owner').notNull(), // 'owner' | 'manager' | 'chef'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 2. Catalog & Menu
// -----------------------------------------------------------------------------

export const mealPlans = pgTable('meal_plans', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  planType: text('plan_type').notNull(), // 'monthly' | 'flex_meals' | 'weekly'
  pricePaise: integer('price_paise').notNull(), // in paise (INR cents)
  validityDays: integer('validity_days').notNull(),
  totalMeals: integer('total_meals').notNull(), // for flex meals or expected in monthly
  mealsPerDay: integer('meals_per_day').default(3).notNull(),
  coveredSlots: text('covered_slots').default('breakfast,lunch,dinner').notNull(),
  maxSkipsAllowed: integer('max_skips_allowed').default(10).notNull(),
  creditsPerSkipPaise: integer('credits_per_skip_paise').default(5000).notNull(), // 50 INR default per skipped meal
  isActive: boolean('is_active').default(true).notNull(),
  features: text('features').default('Advance skipping, Rollover credits, Real-time nutrition'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dishes = pgTable('dishes', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'breakfast' | 'main_course' | 'bread_rice' | 'dal_curry' | 'dessert' | 'beverage'
  dietaryType: text('dietary_type').default('veg').notNull(), // 'veg' | 'non_veg' | 'egg'
  standardPortionGrams: integer('standard_portion_grams').default(180).notNull(),
  caloriesEst: integer('calories_est').default(240).notNull(),
  proteinGramsEst: doublePrecision('protein_grams_est').default(8.5).notNull(),
  carbsGramsEst: doublePrecision('carbs_grams_est').default(32.0).notNull(),
  fatGramsEst: doublePrecision('fat_grams_est').default(7.0).notNull(),
  description: text('description'),
  isSignature: boolean('is_signature').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  unit: text('unit').default('kg').notNull(), // 'kg' | 'liter' | 'pieces'
  costPerUnitPaise: integer('cost_per_unit_paise').default(6000).notNull(),
  stockQuantity: doublePrecision('stock_quantity').default(50.0).notNull(),
  shelfLifeDays: integer('shelf_life_days').default(7).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dishIngredients = pgTable('dish_ingredients', {
  id: serial('id').primaryKey(),
  dishId: integer('dish_id')
    .references(() => dishes.id, { onDelete: 'cascade' })
    .notNull(),
  ingredientId: integer('ingredient_id')
    .references(() => ingredients.id, { onDelete: 'cascade' })
    .notNull(),
  quantityPerPortion: doublePrecision('quantity_per_portion').notNull(), // in ingredient unit
  unit: text('unit').notNull(),
});

export const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  slotType: text('slot_type').notNull(), // 'breakfast' | 'lunch' | 'dinner'
  title: text('title').notNull(),
  specialNote: text('special_note'),
  status: text('status').default('published').notNull(), // 'draft' | 'published'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  menuId: integer('menu_id')
    .references(() => menus.id, { onDelete: 'cascade' })
    .notNull(),
  dishId: integer('dish_id')
    .references(() => dishes.id, { onDelete: 'cascade' })
    .notNull(),
  isMain: boolean('is_main').default(true).notNull(),
  isOptional: boolean('is_optional').default(false).notNull(),
});

// -----------------------------------------------------------------------------
// 3. Subscriptions & Simulated Billing
// -----------------------------------------------------------------------------

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  mealPlanId: integer('meal_plan_id')
    .references(() => mealPlans.id)
    .notNull(),
  planNameSnapshot: text('plan_name_snapshot').notNull(),
  planTypeSnapshot: text('plan_type_snapshot').notNull(),
  pricePaidPaise: integer('price_paid_paise').notNull(),
  remainingMeals: integer('remaining_meals').notNull(),
  totalMealsInitial: integer('total_meals_initial').notNull(),
  skipsUsed: integer('skips_used').default(0).notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(), // YYYY-MM-DD
  status: text('status').default('active').notNull(), // 'active' | 'expired' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const demoPayments = pgTable('demo_payments', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id')
    .references(() => subscriptions.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: integer('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amountPaise: integer('amount_paise').notNull(),
  paymentReference: text('payment_reference').notNull().unique(),
  paymentMethod: text('payment_method').default('simulated_upi').notNull(),
  status: text('status').default('succeeded').notNull(),
  isDemo: boolean('is_demo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 4. Operational Meal Slots, Selections & Attendance
// -----------------------------------------------------------------------------

export const mealSlots = pgTable('meal_slots', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  slotType: text('slot_type').notNull(), // 'breakfast' | 'lunch' | 'dinner'
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(), // HH:MM
  cutoffTimestamp: timestamp('cutoff_timestamp').notNull(),
  status: text('status').default('open').notNull(), // 'open' | 'closed' | 'completed'
  expectedDiners: integer('expected_diners').default(0).notNull(),
  actualDiners: integer('actual_diners').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mealSelections = pgTable(
  'meal_selections',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subscriptionId: integer('subscription_id')
      .references(() => subscriptions.id, { onDelete: 'cascade' })
      .notNull(),
    mealSlotId: integer('meal_slot_id')
      .references(() => mealSlots.id, { onDelete: 'cascade' })
      .notNull(),
    messId: integer('mess_id')
      .references(() => messes.id, { onDelete: 'cascade' })
      .notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    slotType: text('slot_type').notNull(), // 'breakfast' | 'lunch' | 'dinner'
    status: text('status').default('selected').notNull(), // 'selected' | 'skipped'
    skippedAt: timestamp('skipped_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('meal_sel_sub_slot_idx').on(table.subscriptionId, table.mealSlotId),
  ]
);

export const mealAttendances = pgTable(
  'meal_attendances',
  {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subscriptionId: integer('subscription_id')
      .references(() => subscriptions.id, { onDelete: 'cascade' })
      .notNull(),
    mealSlotId: integer('meal_slot_id')
      .references(() => mealSlots.id, { onDelete: 'cascade' })
      .notNull(),
    messId: integer('mess_id')
      .references(() => messes.id, { onDelete: 'cascade' })
      .notNull(),
    markedBy: integer('marked_by').references(() => users.id),
    verificationMethod: text('verification_method').default('qr_scan').notNull(), // 'qr_scan' | 'manual_id'
    markedAt: timestamp('marked_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('meal_att_sub_slot_idx').on(table.subscriptionId, table.mealSlotId),
  ]
);

export const mealCreditLedger = pgTable('meal_credit_ledger', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: integer('subscription_id')
    .references(() => subscriptions.id, { onDelete: 'cascade' })
    .notNull(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  transactionType: text('transaction_type').notNull(), // 'credit_earned_skip' | 'credit_redeemed_plan' | 'credit_refund'
  amountPaise: integer('amount_paise').notNull(),
  balancePaiseAfter: integer('balance_paise_after').notNull(),
  reason: text('reason').notNull(),
  sourceSelectionId: integer('source_selection_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// 5. Kitchen Production, Waste & Intelligence
// -----------------------------------------------------------------------------

export const demandForecasts = pgTable('demand_forecasts', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  mealSlotId: integer('meal_slot_id')
    .references(() => mealSlots.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(),
  slotType: text('slot_type').notNull(),
  predictedDiners: integer('predicted_diners').notNull(),
  recommendedBuffer: integer('recommended_buffer').default(5).notNull(),
  baselineDiners: integer('baseline_diners').notNull(),
  forecastMethod: text('forecast_method').default('deterministic_baseline').notNull(), // 'deterministic_baseline' | 'ai_enhanced'
  confidenceScore: doublePrecision('confidence_score').default(0.85).notNull(),
  featuresSnapshot: text('features_snapshot'), // JSON string of features
  actualDiners: integer('actual_diners'),
  forecastErrorAbs: integer('forecast_error_abs'),
  forecastErrorPct: doublePrecision('forecast_error_pct'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kitchenProductionRecords = pgTable('kitchen_production_records', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  mealSlotId: integer('meal_slot_id')
    .references(() => mealSlots.id, { onDelete: 'cascade' })
    .notNull(),
  dishId: integer('dish_id')
    .references(() => dishes.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(),
  slotType: text('slot_type').notNull(),
  portionsPrepared: integer('portions_prepared').notNull(),
  portionsServed: integer('portions_served').notNull(),
  leftoverPortions: integer('leftover_portions').default(0).notNull(),
  discardedPortions: integer('discarded_portions').default(0).notNull(),
  wasteReason: text('waste_reason').default('none'), // 'overcooking' | 'unexpected_absenteeism' | 'quality_defect' | 'late_spoilage' | 'none'
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ingredientUsages = pgTable('ingredient_usages', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  mealSlotId: integer('meal_slot_id')
    .references(() => mealSlots.id, { onDelete: 'cascade' })
    .notNull(),
  ingredientId: integer('ingredient_id')
    .references(() => ingredients.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(),
  quantityUsed: doublePrecision('quantity_used').notNull(),
  unit: text('unit').notNull(),
  estimatedWasteKg: doublePrecision('estimated_waste_kg').default(0.0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: integer('subscription_id')
    .references(() => subscriptions.id, { onDelete: 'set null' }),
  mealSlotId: integer('meal_slot_id')
    .references(() => mealSlots.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(), // 1 to 5
  foodQualityRating: integer('food_quality_rating').default(4).notNull(),
  hygieneRating: integer('hygiene_rating').default(4).notNull(),
  tasteRating: integer('taste_rating').default(4).notNull(),
  category: text('category').default('taste').notNull(), // 'taste' | 'hygiene' | 'portion' | 'menu_variety' | 'service' | 'general'
  comment: text('comment').notNull(),
  complaintStatus: text('complaint_status').default('none').notNull(), // 'none' | 'opened' | 'investigating' | 'resolved'
  ownerResponse: text('owner_response'),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const feedbackAnalyses = pgTable('feedback_analyses', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  summary: text('summary').notNull(),
  sentimentScore: doublePrecision('sentiment_score').default(0.8).notNull(),
  topStrengths: text('top_strengths').notNull(), // JSON or comma-separated
  topComplaints: text('top_complaints').notNull(), // JSON or comma-separated
  suggestedActions: text('suggested_actions').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiInsights = pgTable('ai_insights', {
  id: serial('id').primaryKey(),
  messId: integer('mess_id')
    .references(() => messes.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(), // 'demand_shift' | 'waste_reduction' | 'menu_optimization' | 'cost_saving'
  title: text('title').notNull(),
  description: text('description').notNull(),
  actionableRecommendations: text('actionable_recommendations').notNull(),
  metricsSnapshot: text('metrics_snapshot'), // JSON
  isAcknowledged: boolean('is_acknowledged').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('general').notNull(), // 'skip_deadline' | 'credit_earned' | 'menu_update' | 'complaint_reply' | 'demand_alert'
  isRead: boolean('is_read').default(false).notNull(),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUserId: integer('actor_user_id'),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(), // 'user_login' | 'skip_meal' | 'issue_credit' | 'mark_attendance' | 'record_production' | 'admin_reset'
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// Relations
// -----------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  memberships: many(messMemberships),
  subscriptions: many(subscriptions),
  selections: many(mealSelections),
  attendances: many(mealAttendances),
  credits: many(mealCreditLedger),
  feedbacks: many(feedbacks),
  notifications: many(notifications),
}));

export const messesRelations = relations(messes, ({ many }) => ({
  memberships: many(messMemberships),
  mealPlans: many(mealPlans),
  dishes: many(dishes),
  ingredients: many(ingredients),
  menus: many(menus),
  subscriptions: many(subscriptions),
  mealSlots: many(mealSlots),
  productionRecords: many(kitchenProductionRecords),
  feedbacks: many(feedbacks),
  forecasts: many(demandForecasts),
  aiInsights: many(aiInsights),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  mess: one(messes, {
    fields: [mealPlans.messId],
    references: [messes.id],
  }),
  subscriptions: many(subscriptions),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  mess: one(messes, {
    fields: [dishes.messId],
    references: [messes.id],
  }),
  dishIngredients: many(dishIngredients),
  menuItems: many(menuItems),
  productionRecords: many(kitchenProductionRecords),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  mess: one(messes, {
    fields: [ingredients.messId],
    references: [messes.id],
  }),
  dishIngredients: many(dishIngredients),
  usages: many(ingredientUsages),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  mess: one(messes, {
    fields: [menus.messId],
    references: [messes.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
  dish: one(dishes, {
    fields: [menuItems.dishId],
    references: [dishes.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  student: one(users, {
    fields: [subscriptions.studentId],
    references: [users.id],
  }),
  mess: one(messes, {
    fields: [subscriptions.messId],
    references: [messes.id],
  }),
  mealPlan: one(mealPlans, {
    fields: [subscriptions.mealPlanId],
    references: [mealPlans.id],
  }),
  payments: many(demoPayments),
  selections: many(mealSelections),
  credits: many(mealCreditLedger),
}));

export const mealSlotsRelations = relations(mealSlots, ({ one, many }) => ({
  mess: one(messes, {
    fields: [mealSlots.messId],
    references: [messes.id],
  }),
  selections: many(mealSelections),
  attendances: many(mealAttendances),
  productionRecords: many(kitchenProductionRecords),
  forecasts: many(demandForecasts),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  student: one(users, {
    fields: [feedbacks.studentId],
    references: [users.id],
  }),
  mess: one(messes, {
    fields: [feedbacks.messId],
    references: [messes.id],
  }),
}));
