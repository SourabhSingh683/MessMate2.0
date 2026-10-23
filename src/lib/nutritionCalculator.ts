/**
 * Standard Nutritional & Macro Reference Database and Deterministic Calculator
 * Grounded in Indian Food Composition Tables (ICMR-NIN / IFCT) and USDA FoodData Central.
 * Provides predefined values per 100g with deterministic calculation and fallback for AI.
 */

export interface FoodMacros {
  name: string;
  portionGrams: number;
  calories: number;       // kcal
  protein: number;        // grams
  carbs: number;          // grams
  fat: number;            // grams
  fiber?: number;         // grams
  proteinPercent: number; // % of calories from protein
  carbsPercent: number;   // % of calories from carbohydrates
  fatPercent: number;     // % of calories from fat
  source: 'ai' | 'icmr_nin_predefined' | 'provided';
}

export interface MacroReference {
  keywords: string[];
  category: 'staple' | 'dal_curry' | 'paneer_veg' | 'non_veg' | 'breakfast' | 'dairy_side' | 'dessert' | 'beverage';
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  defaultPortionGrams: number;
}

/**
 * Predefined reference nutrition database per 100 grams
 */
export const PREDEFINED_NUTRITION_PER_100G: Record<string, MacroReference> = {
  // 1. Breads & Staples
  roti: {
    keywords: ['roti', 'chapati', 'phulka', 'tandoori roti', 'wheat roti'],
    category: 'staple',
    caloriesPer100g: 297,
    proteinPer100g: 11.5,
    carbsPer100g: 61.2,
    fatPer100g: 2.2,
    fiberPer100g: 9.8,
    defaultPortionGrams: 70, // 2 regular rotis
  },
  paratha: {
    keywords: ['paratha', 'parotta', 'aloo paratha', 'laccha paratha', 'gobi paratha'],
    category: 'staple',
    caloriesPer100g: 310,
    proteinPer100g: 7.2,
    carbsPer100g: 48.5,
    fatPer100g: 11.0,
    fiberPer100g: 4.5,
    defaultPortionGrams: 110,
  },
  steamed_rice: {
    keywords: ['rice', 'steamed rice', 'basmati rice', 'chawal', 'white rice', 'boiled rice'],
    category: 'staple',
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    fiberPer100g: 0.4,
    defaultPortionGrams: 180,
  },
  jeera_rice: {
    keywords: ['jeera rice', 'cumin rice', 'ghee rice', 'fried rice'],
    category: 'staple',
    caloriesPer100g: 148,
    proteinPer100g: 2.8,
    carbsPer100g: 27.5,
    fatPer100g: 2.6,
    defaultPortionGrams: 180,
  },
  veg_biryani: {
    keywords: ['veg biryani', 'vegetable biryani', 'pulao', 'veg pulao', 'peas pulao'],
    category: 'staple',
    caloriesPer100g: 165,
    proteinPer100g: 3.8,
    carbsPer100g: 28.0,
    fatPer100g: 4.8,
    defaultPortionGrams: 220,
  },
  chicken_biryani: {
    keywords: ['chicken biryani', 'murgh biryani', 'hyderabadi biryani'],
    category: 'non_veg',
    caloriesPer100g: 195,
    proteinPer100g: 11.2,
    carbsPer100g: 24.5,
    fatPer100g: 6.8,
    defaultPortionGrams: 260,
  },

  // 2. Dals & Lentil Curries
  dal_tadka: {
    keywords: ['dal tadka', 'toor dal', 'yellow dal', 'dal fry', 'moong dal', 'masoor dal', 'plain dal'],
    category: 'dal_curry',
    caloriesPer100g: 110,
    proteinPer100g: 6.5,
    carbsPer100g: 16.5,
    fatPer100g: 2.8,
    fiberPer100g: 4.2,
    defaultPortionGrams: 200,
  },
  dal_makhani: {
    keywords: ['dal makhani', 'makhani dal', 'urad dal', 'black dal'],
    category: 'dal_curry',
    caloriesPer100g: 160,
    proteinPer100g: 6.0,
    carbsPer100g: 17.5,
    fatPer100g: 8.0,
    fiberPer100g: 4.8,
    defaultPortionGrams: 200,
  },
  chana_masala: {
    keywords: ['chana masala', 'chole', 'chickpea curry', 'kala chana'],
    category: 'dal_curry',
    caloriesPer100g: 142,
    proteinPer100g: 6.8,
    carbsPer100g: 21.0,
    fatPer100g: 3.8,
    fiberPer100g: 5.6,
    defaultPortionGrams: 190,
  },
  rajma_masala: {
    keywords: ['rajma', 'rajma masala', 'kidney bean curry'],
    category: 'dal_curry',
    caloriesPer100g: 135,
    proteinPer100g: 6.4,
    carbsPer100g: 20.8,
    fatPer100g: 3.2,
    fiberPer100g: 5.2,
    defaultPortionGrams: 200,
  },
  sambar: {
    keywords: ['sambar', 'sambhar', 'south indian sambar'],
    category: 'dal_curry',
    caloriesPer100g: 78,
    proteinPer100g: 3.8,
    carbsPer100g: 11.2,
    fatPer100g: 2.0,
    fiberPer100g: 3.0,
    defaultPortionGrams: 200,
  },

  // 3. Paneer & Vegetable Curries
  paneer_butter_masala: {
    keywords: ['paneer butter masala', 'shahi paneer', 'paneer makhani', 'paneer tikka masala'],
    category: 'paneer_veg',
    caloriesPer100g: 220,
    proteinPer100g: 8.8,
    carbsPer100g: 8.2,
    fatPer100g: 17.0,
    defaultPortionGrams: 200,
  },
  matar_paneer: {
    keywords: ['matar paneer', 'kadai paneer', 'palak paneer', 'paneer bhurji', 'paneer curry'],
    category: 'paneer_veg',
    caloriesPer100g: 165,
    proteinPer100g: 8.0,
    carbsPer100g: 10.0,
    fatPer100g: 11.0,
    defaultPortionGrams: 200,
  },
  aloo_gobi: {
    keywords: ['aloo gobi', 'aloo sabzi', 'aloo matar', 'potato curry', 'jeera aloo'],
    category: 'paneer_veg',
    caloriesPer100g: 98,
    proteinPer100g: 2.4,
    carbsPer100g: 14.2,
    fatPer100g: 3.8,
    fiberPer100g: 2.5,
    defaultPortionGrams: 180,
  },
  mixed_veg_curry: {
    keywords: ['mixed veg', 'veg korma', 'bhindi masala', 'baingan bharta', 'lauki', 'cabbage sabzi'],
    category: 'paneer_veg',
    caloriesPer100g: 92,
    proteinPer100g: 2.8,
    carbsPer100g: 12.0,
    fatPer100g: 3.6,
    fiberPer100g: 3.4,
    defaultPortionGrams: 180,
  },

  // 4. Non-Veg & Eggs
  egg_curry: {
    keywords: ['egg curry', 'boiled egg', 'anda curry', 'egg masala', 'omelette', 'egg bhurji'],
    category: 'non_veg',
    caloriesPer100g: 155,
    proteinPer100g: 11.8,
    carbsPer100g: 5.2,
    fatPer100g: 10.4,
    defaultPortionGrams: 190,
  },
  chicken_curry: {
    keywords: ['chicken curry', 'butter chicken', 'chicken masala', 'kadai chicken', 'murgh'],
    category: 'non_veg',
    caloriesPer100g: 178,
    proteinPer100g: 17.2,
    carbsPer100g: 4.8,
    fatPer100g: 10.5,
    defaultPortionGrams: 200,
  },

  // 5. Breakfast & Snacks
  idli: {
    keywords: ['idli', 'steamed idli', 'idly'],
    category: 'breakfast',
    caloriesPer100g: 132,
    proteinPer100g: 4.4,
    carbsPer100g: 27.5,
    fatPer100g: 0.5,
    fiberPer100g: 1.8,
    defaultPortionGrams: 110, // 2 pieces
  },
  dosa: {
    keywords: ['dosa', 'masala dosa', 'plain dosa', 'uttapam'],
    category: 'breakfast',
    caloriesPer100g: 185,
    proteinPer100g: 4.8,
    carbsPer100g: 29.2,
    fatPer100g: 6.2,
    defaultPortionGrams: 140,
  },
  poha: {
    keywords: ['poha', 'flattened rice', 'kanda poha', 'aval'],
    category: 'breakfast',
    caloriesPer100g: 172,
    proteinPer100g: 3.4,
    carbsPer100g: 31.0,
    fatPer100g: 4.2,
    defaultPortionGrams: 160,
  },
  upma: {
    keywords: ['upma', 'rava upma', 'semolina upma'],
    category: 'breakfast',
    caloriesPer100g: 145,
    proteinPer100g: 3.6,
    carbsPer100g: 24.5,
    fatPer100g: 4.0,
    defaultPortionGrams: 160,
  },

  // 6. Dairy & Sides
  curd: {
    keywords: ['curd', 'dahi', 'yogurt', 'plain curd'],
    category: 'dairy_side',
    caloriesPer100g: 68,
    proteinPer100g: 3.5,
    carbsPer100g: 4.7,
    fatPer100g: 3.4,
    defaultPortionGrams: 120,
  },
  raita: {
    keywords: ['raita', 'boondi raita', 'cucumber raita', 'veg raita'],
    category: 'dairy_side',
    caloriesPer100g: 88,
    proteinPer100g: 3.2,
    carbsPer100g: 7.8,
    fatPer100g: 4.5,
    defaultPortionGrams: 140,
  },
  salad: {
    keywords: ['salad', 'green salad', 'kachumber', 'cucumber onion'],
    category: 'dairy_side',
    caloriesPer100g: 28,
    proteinPer100g: 1.1,
    carbsPer100g: 5.5,
    fatPer100g: 0.2,
    defaultPortionGrams: 80,
  },

  // 7. Desserts & Sweets
  gulab_jamun: {
    keywords: ['gulab jamun', 'jamun'],
    category: 'dessert',
    caloriesPer100g: 375,
    proteinPer100g: 4.5,
    carbsPer100g: 62.0,
    fatPer100g: 13.0,
    defaultPortionGrams: 55, // 1 large piece
  },
  kheer: {
    keywords: ['kheer', 'payasam', 'rice kheer', 'sewaiyan kheer'],
    category: 'dessert',
    caloriesPer100g: 165,
    proteinPer100g: 4.2,
    carbsPer100g: 24.0,
    fatPer100g: 5.8,
    defaultPortionGrams: 120,
  },
  halwa: {
    keywords: ['halwa', 'suji halwa', 'sooji halwa', 'moong dal halwa', 'gajar halwa'],
    category: 'dessert',
    caloriesPer100g: 340,
    proteinPer100g: 5.5,
    carbsPer100g: 48.0,
    fatPer100g: 15.0,
    defaultPortionGrams: 90,
  },

  // 8. Beverages
  chai: {
    keywords: ['chai', 'tea', 'masala chai', 'milk tea'],
    category: 'beverage',
    caloriesPer100g: 75,
    proteinPer100g: 2.2,
    carbsPer100g: 10.5,
    fatPer100g: 2.8,
    defaultPortionGrams: 150,
  },
  filter_coffee: {
    keywords: ['coffee', 'filter coffee', 'south indian coffee'],
    category: 'beverage',
    caloriesPer100g: 70,
    proteinPer100g: 2.0,
    carbsPer100g: 9.8,
    fatPer100g: 2.5,
    defaultPortionGrams: 150,
  },
};

/**
 * Find best matching predefined macro profile using keyword scoring
 */
export function matchPredefinedMacro(dishName: string): MacroReference {
  const norm = dishName.toLowerCase().trim();

  // 1. Direct key match
  for (const [key, ref] of Object.entries(PREDEFINED_NUTRITION_PER_100G)) {
    for (const kw of ref.keywords) {
      if (norm === kw || norm.includes(kw)) {
        return ref;
      }
    }
  }

  // 2. Tokenized word overlap
  const words = norm.split(/[\s,/-]+/);
  let bestRef: MacroReference | null = null;
  let maxScore = 0;

  for (const ref of Object.values(PREDEFINED_NUTRITION_PER_100G)) {
    let score = 0;
    for (const kw of ref.keywords) {
      for (const w of words) {
        if (w.length > 2 && kw.includes(w)) score += 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestRef = ref;
    }
  }

  if (bestRef && maxScore > 0) return bestRef;

  // 3. Fallback generic balanced meal item
  return {
    keywords: ['generic'],
    category: 'dal_curry',
    caloriesPer100g: 125,
    proteinPer100g: 5.5,
    carbsPer100g: 16.0,
    fatPer100g: 4.5,
    fiberPer100g: 3.0,
    defaultPortionGrams: 180,
  };
}

/**
 * Calculates exact macros for a dish using predefined values per 100g.
 * Formula: Macro = (ValuePer100g * portionGrams) / 100
 */
export function calculateFoodMacros(
  dishName: string,
  portionGrams?: number,
  providedEstimates?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
): FoodMacros {
  const ref = matchPredefinedMacro(dishName);
  const grams = portionGrams && portionGrams > 0 ? portionGrams : ref.defaultPortionGrams;

  let calories = Math.round((ref.caloriesPer100g * grams) / 100);
  let protein = Number(((ref.proteinPer100g * grams) / 100).toFixed(1));
  let carbs = Number(((ref.carbsPer100g * grams) / 100).toFixed(1));
  let fat = Number(((ref.fatPer100g * grams) / 100).toFixed(1));
  let source: FoodMacros['source'] = 'icmr_nin_predefined';

  // If explicit estimates are provided and valid, honor them
  if (
    providedEstimates &&
    providedEstimates.calories &&
    providedEstimates.calories > 0 &&
    (providedEstimates.protein !== undefined || providedEstimates.carbs !== undefined)
  ) {
    calories = Math.round(providedEstimates.calories);
    protein = Number((providedEstimates.protein ?? protein).toFixed(1));
    carbs = Number((providedEstimates.carbs ?? carbs).toFixed(1));
    fat = Number((providedEstimates.fat ?? fat).toFixed(1));
    source = 'provided';
  }

  // Energy distribution percentages
  const safeCalories = Math.max(calories, 1);
  const proteinPercent = Math.min(100, Math.round(((protein * 4) / safeCalories) * 100));
  const carbsPercent = Math.min(100, Math.round(((carbs * 4) / safeCalories) * 100));
  const fatPercent = Math.min(100, Math.round(((fat * 9) / safeCalories) * 100));

  return {
    name: dishName,
    portionGrams: grams,
    calories,
    protein,
    carbs,
    fat,
    fiber: ref.fiberPer100g ? Number(((ref.fiberPer100g * grams) / 100).toFixed(1)) : undefined,
    proteinPercent,
    carbsPercent,
    fatPercent,
    source,
  };
}

/**
 * Sums up totals across multiple dishes in a meal or menu
 */
export function calculateMealTotals(
  items: Array<{
    name: string;
    standardPortionGrams?: number;
    caloriesEst?: number;
    proteinGramsEst?: number;
    carbsGramsEst?: number;
    fatGramsEst?: number;
  }>
): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  items: FoodMacros[];
} {
  const calculatedItems = items.map((it) =>
    calculateFoodMacros(it.name, it.standardPortionGrams, {
      calories: it.caloriesEst,
      protein: it.proteinGramsEst,
      carbs: it.carbsGramsEst,
      fat: it.fatGramsEst,
    })
  );

  const totalCalories = calculatedItems.reduce((acc, c) => acc + c.calories, 0);
  const totalProtein = Number(calculatedItems.reduce((acc, c) => acc + c.protein, 0).toFixed(1));
  const totalCarbs = Number(calculatedItems.reduce((acc, c) => acc + c.carbs, 0).toFixed(1));
  const totalFat = Number(calculatedItems.reduce((acc, c) => acc + c.fat, 0).toFixed(1));

  const safeCal = Math.max(totalCalories, 1);
  const proteinPct = Math.min(100, Math.round(((totalProtein * 4) / safeCal) * 100));
  const carbsPct = Math.min(100, Math.round(((totalCarbs * 4) / safeCal) * 100));
  const fatPct = Math.min(100, Math.round(((totalFat * 9) / safeCal) * 100));

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    proteinPct,
    carbsPct,
    fatPct,
    items: calculatedItems,
  };
}
