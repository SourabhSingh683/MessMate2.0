export type UserRole = 'student' | 'owner';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  messIds: number[];
}

export interface StudentProfile {
  id: number;
  userId: number;
  hostelBlock: string;
  roomNumber: string;
  collegeId: string;
  dietaryPref: 'veg' | 'non_veg' | 'egg_veg';
  allergies?: string | null;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
}

export interface MealPlan {
  id: number;
  messId: number;
  name: string;
  description: string;
  planType: 'monthly' | 'flex_meals' | 'weekly';
  pricePaise: number;
  validityDays: number;
  totalMeals: number;
  mealsPerDay: number;
  coveredSlots: string;
  maxSkipsAllowed: number;
  creditsPerSkipPaise: number;
  isActive: boolean;
  features?: string;
}

export interface Mess {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  distanceKm: number;
  contactPhone: string;
  contactEmail: string;
  operatingHours: string;
  rating: number;
  reviewCount: number;
  cuisineTypes: string;
  isPureVeg: boolean;
  status: 'active' | 'pending' | 'suspended';
  monthlyBasePricePaise: number;
  selectionCutoffHours: number;
  plans?: MealPlan[];
}

export interface Dish {
  id: number;
  messId: number;
  name: string;
  category: 'breakfast' | 'main_course' | 'bread_rice' | 'dal_curry' | 'dessert' | 'beverage';
  dietaryType: 'veg' | 'non_veg' | 'egg';
  standardPortionGrams: number;
  caloriesEst: number;
  proteinGramsEst: number;
  carbsGramsEst: number;
  fatGramsEst: number;
  description?: string | null;
  isSignature: boolean;
}

export interface MealSlot {
  id: number;
  messId: number;
  date: string;
  slotType: 'breakfast' | 'lunch' | 'dinner';
  startTime: string;
  endTime: string;
  cutoffTimestamp: string;
  status: 'open' | 'closed' | 'completed';
  expectedDiners: number;
  actualDiners: number;
}

export interface MealCreditEntry {
  id: number;
  studentId: number;
  subscriptionId: number;
  messId: number;
  idempotencyKey: string;
  transactionType: string;
  amountPaise: number;
  balancePaiseAfter: number;
  reason: string;
  createdAt: string;
  messName?: string;
}

export interface FeedbackItem {
  id: number;
  rating: number;
  foodQualityRating: number;
  hygieneRating: number;
  tasteRating: number;
  category: string;
  comment: string;
  complaintStatus: 'none' | 'opened' | 'investigating' | 'resolved';
  ownerResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
}

export interface ProductionRecord {
  id: number;
  messId: number;
  mealSlotId: number;
  dishId: number;
  date: string;
  slotType: string;
  portionsPrepared: number;
  portionsServed: number;
  leftoverPortions: number;
  discardedPortions: number;
  wasteReason: string;
  notes?: string | null;
  createdAt: string;
  dish?: Dish;
}
