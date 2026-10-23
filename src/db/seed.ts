import { db } from './index.ts';
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
} from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function seedDatabase(forceReset = false) {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0 && !forceReset) {
      console.log('Database already contains records. Skipping seed.');
      return { success: true, message: 'Database already seeded' };
    }

    if (forceReset) {
      console.log('Resetting and re-seeding database...');
      // Clean tables in reverse dependency order
      await db.delete(auditLogs);
      await db.delete(notifications);
      await db.delete(aiInsights);
      await db.delete(feedbackAnalyses);
      await db.delete(feedbacks);
      await db.delete(ingredientUsages);
      await db.delete(kitchenProductionRecords);
      await db.delete(demandForecasts);
      await db.delete(mealCreditLedger);
      await db.delete(mealAttendances);
      await db.delete(mealSelections);
      await db.delete(mealSlots);
      await db.delete(demoPayments);
      await db.delete(subscriptions);
      await db.delete(menuItems);
      await db.delete(menus);
      await db.delete(dishIngredients);
      await db.delete(ingredients);
      await db.delete(dishes);
      await db.delete(mealPlans);
      await db.delete(messMemberships);
      await db.delete(messes);
      await db.delete(studentProfiles);
      await db.delete(users);
    }

    console.log('Seeding MessMate 2.0 database with realistic college data...');

    // 1. Users
    const seededUsers = await db
      .insert(users)
      .values([
        {
          uid: 'demo-student-1',
          email: 'aarav.sharma@campus.edu',
          name: 'Aarav Sharma',
          role: 'student',
          phone: '+91 98765 43210',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
        {
          uid: 'demo-student-2',
          email: 'ananya.iyer@campus.edu',
          name: 'Ananya Iyer',
          role: 'student',
          phone: '+91 98765 43211',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        {
          uid: 'demo-student-3',
          email: 'rohan.verma@campus.edu',
          name: 'Rohan Verma',
          role: 'student',
          phone: '+91 98765 43212',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        },
        {
          uid: 'demo-owner-1',
          email: 'rajesh@annapurnarasoi.in',
          name: 'Rajesh Gupta',
          role: 'owner',
          phone: '+91 98111 22334',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        },
        {
          uid: 'demo-owner-2',
          email: 'gurpreet@royalfeast.in',
          name: 'Gurpreet Singh',
          role: 'owner',
          phone: '+91 98222 33445',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        },
        {
          uid: 'demo-owner-3',
          email: 'vikram@campusbowl.in',
          name: 'Vikram Nair',
          role: 'owner',
          phone: '+91 98333 44556',
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        },
        {
          uid: 'demo-admin-1',
          email: 'admin.dean@campus.edu',
          name: 'Dr. Meenakshi Sundaram',
          role: 'admin',
          phone: '+91 98000 11223',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        },
      ])
      .returning();

    const uStudent1 = seededUsers[0];
    const uStudent2 = seededUsers[1];
    const uStudent3 = seededUsers[2];
    const uOwner1 = seededUsers[3];
    const uOwner2 = seededUsers[4];
    const uOwner3 = seededUsers[5];
    const uAdmin = seededUsers[6];

    // 2. Student Profiles
    await db.insert(studentProfiles).values([
      {
        userId: uStudent1.id,
        hostelBlock: 'Block-B (Tagore Hall)',
        roomNumber: '204',
        collegeId: 'GIT-2024-CS042',
        dietaryPref: 'veg',
        allergies: 'Peanuts',
        dailyCalorieTarget: 2200,
        dailyProteinTarget: 75,
      },
      {
        userId: uStudent2.id,
        hostelBlock: 'Block-C (Sarojini Hall)',
        roomNumber: '108',
        collegeId: 'GIT-2025-BT019',
        dietaryPref: 'egg_veg',
        allergies: 'None',
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 80,
      },
      {
        userId: uStudent3.id,
        hostelBlock: 'Block-A (Raman Hall)',
        roomNumber: '312',
        collegeId: 'GIT-2023-ME114',
        dietaryPref: 'non_veg',
        allergies: 'Mushroom',
        dailyCalorieTarget: 2600,
        dailyProteinTarget: 110,
      },
    ]);

    // 3. Messes
    const seededMesses = await db
      .insert(messes)
      .values([
        {
          name: 'Annapurna Rasoi',
          slug: 'annapurna-rasoi',
          tagline: 'Homestyle Pure Vegetarian North & South Indian Staples',
          description:
            'Serving authentic, hygienic, motherly meals since 2018. Known for slow-cooked dals, hot phulkas with desi ghee, and wholesome regional thalis designed for students.',
          address: 'North Gate Lane, Opp. Tagore Hostel, South Campus',
          distanceKm: 0.2,
          contactPhone: '+91 98111 22334',
          contactEmail: 'contact@annapurnarasoi.in',
          operatingHours: '7:00 AM - 9:45 PM',
          rating: 4.8,
          reviewCount: 342,
          cuisineTypes: 'North Indian, Rajasthani, Homestyle Thali',
          isPureVeg: true,
          status: 'active',
          monthlyBasePricePaise: 340000, // 3,400 INR
          selectionCutoffHours: 10,
        },
        {
          name: 'Royal Feast Mess',
          slug: 'royal-feast-mess',
          tagline: 'Rich Punjabi Flavors, Paneer Specialties & Chicken Curries',
          description:
            'Hearty portions crafted for hungry minds. Featuring butter naan, shahi paneer, Amritsari kulche, and tender tandoori chicken weekends with unlimited buttermilk.',
          address: 'Central Campus Plaza, Food Court Block 2',
          distanceKm: 0.45,
          contactPhone: '+91 98222 33445',
          contactEmail: 'hello@royalfeast.in',
          operatingHours: '7:30 AM - 10:30 PM',
          rating: 4.6,
          reviewCount: 420,
          cuisineTypes: 'North Indian, Punjabi, Mughlai (Non-Veg Available)',
          isPureVeg: false,
          status: 'active',
          monthlyBasePricePaise: 380000, // 3,800 INR
          selectionCutoffHours: 12,
        },
        {
          name: 'Campus Bowl & Grill',
          slug: 'campus-bowl-and-grill',
          tagline: 'High-Protein Macro-Balanced Bowls & Clean Grilled Eats',
          description:
            'Designed by sports nutritionists for gym goers and active students. Clean ingredients, accurate macro breakdowns, tofu/soya bowls, grilled chicken breasts, and brown rice combos.',
          address: 'Hostel Complex C, Near University Gymnasium',
          distanceKm: 0.35,
          contactPhone: '+91 98333 44556',
          contactEmail: 'fitness@campusbowl.in',
          operatingHours: '6:45 AM - 10:00 PM',
          rating: 4.7,
          reviewCount: 289,
          cuisineTypes: 'Macro-Balanced, Bowls, Continental, High Protein',
          isPureVeg: false,
          status: 'active',
          monthlyBasePricePaise: 420000, // 4,200 INR
          selectionCutoffHours: 8,
        },
        {
          name: 'Dakshin Flavors',
          slug: 'dakshin-flavors',
          tagline: 'Authentic Tamil, Kerala & Andhra Spice Heritage',
          description:
            'Crisp ghee roast dosas, fragrant sambar, Kerala parotta with vegetable kurma, and Andhra gongura rice. Served on banana-leaf lining with 4 types of fresh chutneys.',
          address: 'East Block Promenade, Ground Floor',
          distanceKm: 0.6,
          contactPhone: '+91 98444 55667',
          contactEmail: 'order@dakshinflavors.in',
          operatingHours: '7:00 AM - 9:30 PM',
          rating: 4.5,
          reviewCount: 198,
          cuisineTypes: 'South Indian, Chettinad, Kerala Sadya',
          isPureVeg: true,
          status: 'active',
          monthlyBasePricePaise: 310000, // 3,100 INR
          selectionCutoffHours: 12,
        },
      ])
      .returning();

    const mAnnapurna = seededMesses[0];
    const mRoyal = seededMesses[1];
    const mCampusBowl = seededMesses[2];
    const mDakshin = seededMesses[3];

    // 4. Mess Memberships
    await db.insert(messMemberships).values([
      { userId: uOwner1.id, messId: mAnnapurna.id, role: 'owner' },
      { userId: uOwner2.id, messId: mRoyal.id, role: 'owner' },
      { userId: uOwner3.id, messId: mCampusBowl.id, role: 'owner' },
    ]);

    // 5. Meal Plans
    const seededPlans = await db
      .insert(mealPlans)
      .values([
        // Annapurna Plans
        {
          messId: mAnnapurna.id,
          name: 'Classic Full Board (30 Days)',
          description: 'Unlimited breakfast, lunch and dinner with Sunday feast special.',
          planType: 'monthly',
          pricePaise: 340000,
          validityDays: 30,
          totalMeals: 90,
          mealsPerDay: 3,
          coveredSlots: 'breakfast,lunch,dinner',
          maxSkipsAllowed: 12,
          creditsPerSkipPaise: 5000, // Rs 50 credit per advance skip
          isActive: true,
          features: 'Unlimited chapati & rice, Desi ghee included, Sunday dessert special, 12 skips eligible',
        },
        {
          messId: mAnnapurna.id,
          name: 'Flexi-45 Meals Pack',
          description: 'Ideal for day-scholars and selective eaters. Valid for 45 meals across 60 days.',
          planType: 'flex_meals',
          pricePaise: 210000,
          validityDays: 60,
          totalMeals: 45,
          mealsPerDay: 2,
          coveredSlots: 'lunch,dinner',
          maxSkipsAllowed: 8,
          creditsPerSkipPaise: 4500,
          isActive: true,
          features: 'Use whenever you like, 60 days validity, Rollover unused meals',
        },
        // Royal Feast Plans
        {
          messId: mRoyal.id,
          name: 'Royal Shahi Monthly Plan',
          description: '3 meals/day including bi-weekly chicken or paneer butter masala feasts.',
          planType: 'monthly',
          pricePaise: 380000,
          validityDays: 30,
          totalMeals: 90,
          mealsPerDay: 3,
          coveredSlots: 'breakfast,lunch,dinner',
          maxSkipsAllowed: 10,
          creditsPerSkipPaise: 6000,
          isActive: true,
          features: 'Tandoori roti & naan, 2x Chicken/Paneer feasts per week, Sweet lassi every lunch',
        },
        // Campus Bowl Plans
        {
          messId: mCampusBowl.id,
          name: 'Pro-Athlete Macro Plan',
          description: 'High protein nutrition: minimum 100g protein/day tracked with certified macro cards.',
          planType: 'monthly',
          pricePaise: 420000,
          validityDays: 30,
          totalMeals: 60,
          mealsPerDay: 2,
          coveredSlots: 'lunch,dinner',
          maxSkipsAllowed: 14,
          creditsPerSkipPaise: 6500,
          isActive: true,
          features: 'Certified macro count, Grilled chicken breast / Paneer & Tofu, Quinoa & brown rice',
        },
      ])
      .returning();

    const pAnnapurnaMonthly = seededPlans[0];
    const pAnnapurnaFlex = seededPlans[1];
    const pRoyalMonthly = seededPlans[2];
    const pCampusMonthly = seededPlans[3];

    // 6. Dishes
    const seededDishes = await db
      .insert(dishes)
      .values([
        // Annapurna
        {
          messId: mAnnapurna.id,
          name: 'Dal Tadka with Desi Ghee',
          category: 'dal_curry',
          dietaryType: 'veg',
          standardPortionGrams: 200,
          caloriesEst: 210,
          proteinGramsEst: 9.5,
          carbsGramsEst: 26.0,
          fatGramsEst: 6.5,
          description: 'Yellow lentils tempered with cumin, garlic, and fresh Kashmiri chili ghee.',
          isSignature: true,
        },
        {
          messId: mAnnapurna.id,
          name: 'Paneer Butter Masala',
          category: 'main_course',
          dietaryType: 'veg',
          standardPortionGrams: 220,
          caloriesEst: 340,
          proteinGramsEst: 14.0,
          carbsGramsEst: 16.0,
          fatGramsEst: 24.0,
          description: 'Cottage cheese cubes simmered in creamy tomato-cashew satin gravy.',
          isSignature: true,
        },
        {
          messId: mAnnapurna.id,
          name: 'Fresh Tawa Phulka (Set of 3)',
          category: 'bread_rice',
          dietaryType: 'veg',
          standardPortionGrams: 120,
          caloriesEst: 230,
          proteinGramsEst: 7.2,
          carbsGramsEst: 44.0,
          fatGramsEst: 2.0,
          description: 'Whole wheat flatbreads puffed over direct flame with light ghee brush.',
          isSignature: false,
        },
        {
          messId: mAnnapurna.id,
          name: 'Jeera Pulao',
          category: 'bread_rice',
          dietaryType: 'veg',
          standardPortionGrams: 200,
          caloriesEst: 260,
          proteinGramsEst: 4.8,
          carbsGramsEst: 48.0,
          fatGramsEst: 5.0,
          description: 'Long grain aged Basmati steamed with roasted royal cumin and whole spices.',
          isSignature: false,
        },
        {
          messId: mAnnapurna.id,
          name: 'Aloo Gobhi Adraki',
          category: 'main_course',
          dietaryType: 'veg',
          standardPortionGrams: 180,
          caloriesEst: 160,
          proteinGramsEst: 4.2,
          carbsGramsEst: 22.0,
          fatGramsEst: 6.0,
          description: 'Cauliflower florets and diced potatoes tossed with julienned ginger and cilantro.',
          isSignature: false,
        },
        {
          messId: mAnnapurna.id,
          name: 'Gulab Jamun (2 pcs)',
          category: 'dessert',
          dietaryType: 'veg',
          standardPortionGrams: 80,
          caloriesEst: 280,
          proteinGramsEst: 4.0,
          carbsGramsEst: 52.0,
          fatGramsEst: 7.0,
          description: 'Fried milk solid dumplings soaked in cardamom rose syrup.',
          isSignature: false,
        },
        // Royal Feast
        {
          messId: mRoyal.id,
          name: 'Butter Chicken Amritsari',
          category: 'main_course',
          dietaryType: 'non_veg',
          standardPortionGrams: 250,
          caloriesEst: 420,
          proteinGramsEst: 28.0,
          carbsGramsEst: 14.0,
          fatGramsEst: 28.0,
          description: 'Char-grilled chicken pieces simmered in rich buttery makhani gravy.',
          isSignature: true,
        },
        {
          messId: mRoyal.id,
          name: 'Dal Makhani',
          category: 'dal_curry',
          dietaryType: 'veg',
          standardPortionGrams: 220,
          caloriesEst: 320,
          proteinGramsEst: 12.0,
          carbsGramsEst: 34.0,
          fatGramsEst: 16.0,
          description: 'Black urad lentils slow-cooked overnight with white butter and fresh cream.',
          isSignature: true,
        },
        // Campus Bowl
        {
          messId: mCampusBowl.id,
          name: 'Grilled Herb Chicken & Quinoa Bowl',
          category: 'main_course',
          dietaryType: 'non_veg',
          standardPortionGrams: 320,
          caloriesEst: 480,
          proteinGramsEst: 46.0,
          carbsGramsEst: 42.0,
          fatGramsEst: 11.0,
          description: 'Skinless marinated chicken breast, tri-color quinoa, sauteed broccoli and lemon dip.',
          isSignature: true,
        },
        {
          messId: mCampusBowl.id,
          name: 'High-Protein Paneer & Soya Power Bowl',
          category: 'main_course',
          dietaryType: 'veg',
          standardPortionGrams: 320,
          caloriesEst: 440,
          proteinGramsEst: 38.0,
          carbsGramsEst: 38.0,
          fatGramsEst: 13.0,
          description: 'Grilled spiced paneer, roasted soya chunks, edamame beans and brown rice.',
          isSignature: true,
        },
      ])
      .returning();

    // 7. Ingredients for Annapurna
    const seededIngredients = await db
      .insert(ingredients)
      .values([
        { messId: mAnnapurna.id, name: 'Toor Dal (Arhar)', unit: 'kg', costPerUnitPaise: 14000, stockQuantity: 85.0 },
        { messId: mAnnapurna.id, name: 'Fresh Paneer', unit: 'kg', costPerUnitPaise: 38000, stockQuantity: 42.0 },
        { messId: mAnnapurna.id, name: 'Atta (Whole Wheat Flour)', unit: 'kg', costPerUnitPaise: 4200, stockQuantity: 180.0 },
        { messId: mAnnapurna.id, name: 'Basmati Rice', unit: 'kg', costPerUnitPaise: 9500, stockQuantity: 120.0 },
        { messId: mAnnapurna.id, name: 'Fresh Tomatoes', unit: 'kg', costPerUnitPaise: 3200, stockQuantity: 65.0 },
        { messId: mAnnapurna.id, name: 'Cauliflower & Potato', unit: 'kg', costPerUnitPaise: 3500, stockQuantity: 70.0 },
        { messId: mAnnapurna.id, name: 'Pure Desi Ghee', unit: 'liter', costPerUnitPaise: 65000, stockQuantity: 28.0 },
      ])
      .returning();

    // 8. Dish Ingredients links
    await db.insert(dishIngredients).values([
      { dishId: seededDishes[0].id, ingredientId: seededIngredients[0].id, quantityPerPortion: 0.06, unit: 'kg' }, // Toor Dal
      { dishId: seededDishes[0].id, ingredientId: seededIngredients[6].id, quantityPerPortion: 0.015, unit: 'liter' }, // Ghee
      { dishId: seededDishes[1].id, ingredientId: seededIngredients[1].id, quantityPerPortion: 0.1, unit: 'kg' }, // Paneer
      { dishId: seededDishes[1].id, ingredientId: seededIngredients[4].id, quantityPerPortion: 0.08, unit: 'kg' }, // Tomatoes
      { dishId: seededDishes[2].id, ingredientId: seededIngredients[2].id, quantityPerPortion: 0.09, unit: 'kg' }, // Atta
      { dishId: seededDishes[3].id, ingredientId: seededIngredients[3].id, quantityPerPortion: 0.08, unit: 'kg' }, // Rice
    ]);

    // 9. Subscriptions
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const prevDate = new Date(today.getTime() - 15 * 86400000).toISOString().split('T')[0];
    const nextDate = new Date(today.getTime() + 15 * 86400000).toISOString().split('T')[0];

    const seededSubs = await db
      .insert(subscriptions)
      .values([
        {
          studentId: uStudent1.id,
          messId: mAnnapurna.id,
          mealPlanId: pAnnapurnaMonthly.id,
          planNameSnapshot: 'Classic Full Board (30 Days)',
          planTypeSnapshot: 'monthly',
          pricePaidPaise: 340000,
          remainingMeals: 48,
          totalMealsInitial: 90,
          skipsUsed: 3,
          startDate: prevDate,
          endDate: nextDate,
          status: 'active',
        },
        {
          studentId: uStudent2.id,
          messId: mCampusBowl.id,
          mealPlanId: pCampusMonthly.id,
          planNameSnapshot: 'Pro-Athlete Macro Plan',
          planTypeSnapshot: 'monthly',
          pricePaidPaise: 420000,
          remainingMeals: 34,
          totalMealsInitial: 60,
          skipsUsed: 2,
          startDate: prevDate,
          endDate: nextDate,
          status: 'active',
        },
        {
          studentId: uStudent3.id,
          messId: mRoyal.id,
          mealPlanId: pRoyalMonthly.id,
          planNameSnapshot: 'Royal Shahi Monthly Plan',
          planTypeSnapshot: 'monthly',
          pricePaidPaise: 380000,
          remainingMeals: 52,
          totalMealsInitial: 90,
          skipsUsed: 1,
          startDate: prevDate,
          endDate: nextDate,
          status: 'active',
        },
      ])
      .returning();

    const subStudent1 = seededSubs[0];

    // Demo Payments
    await db.insert(demoPayments).values([
      {
        subscriptionId: seededSubs[0].id,
        studentId: uStudent1.id,
        amountPaise: 340000,
        paymentReference: 'DEMO-UPI-9823412-ANNAPURNA',
        paymentMethod: 'simulated_upi',
        status: 'succeeded',
      },
      {
        subscriptionId: seededSubs[1].id,
        studentId: uStudent2.id,
        amountPaise: 420000,
        paymentReference: 'DEMO-UPI-9823413-CAMPUSBOWL',
        paymentMethod: 'simulated_card',
        status: 'succeeded',
      },
      {
        subscriptionId: seededSubs[2].id,
        studentId: uStudent3.id,
        amountPaise: 380000,
        paymentReference: 'DEMO-UPI-9823414-ROYALFEAST',
        paymentMethod: 'simulated_netbanking',
        status: 'succeeded',
      },
    ]);

    // 10. Meal Slots (Past 3 days, Today, Next 4 days)
    const slotTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
    const slotTimes = {
      breakfast: { start: '07:30', end: '09:30', cutoffOffsetHours: 10 },
      lunch: { start: '12:30', end: '14:30', cutoffOffsetHours: 4 },
      dinner: { start: '19:30', end: '21:30', cutoffOffsetHours: 4 },
    };

    const createdSlots = [];

    // Loop through -3 to +4 days
    for (let dayOffset = -3; dayOffset <= 4; dayOffset++) {
      const slotDay = new Date(today.getTime() + dayOffset * 86400000);
      const slotDateStr = slotDay.toISOString().split('T')[0];

      for (const st of slotTypes) {
        const timeInfo = slotTimes[st];
        const [hour, min] = timeInfo.start.split(':').map(Number);
        const slotStartTime = new Date(slotDay);
        slotStartTime.setHours(hour, min, 0, 0);

        const cutoffTime = new Date(slotStartTime.getTime() - timeInfo.cutoffOffsetHours * 3600000);

        let status = 'open';
        if (dayOffset < 0) status = 'completed';
        else if (dayOffset === 0 && new Date() > slotStartTime) status = 'completed';

        // For Annapurna
        const [slot] = await db
          .insert(mealSlots)
          .values({
            messId: mAnnapurna.id,
            date: slotDateStr,
            slotType: st,
            startTime: timeInfo.start,
            endTime: timeInfo.end,
            cutoffTimestamp: cutoffTime,
            status,
            expectedDiners: dayOffset < 0 ? 82 : 88,
            actualDiners: dayOffset < 0 ? 79 : 0,
          })
          .returning();

        createdSlots.push(slot);

        // Also create Menu for today & tomorrow
        if (dayOffset >= -1 && dayOffset <= 2) {
          const [menu] = await db
            .insert(menus)
            .values({
              messId: mAnnapurna.id,
              date: slotDateStr,
              slotType: st,
              title: st === 'lunch' ? 'Homestyle Royal Thali' : st === 'dinner' ? 'Comforting Khichdi & Dal' : 'Desi Poha & Masala Chai',
              status: 'published',
            })
            .returning();

          if (st === 'lunch') {
            await db.insert(menuItems).values([
              { menuId: menu.id, dishId: seededDishes[0].id, isMain: true, isOptional: false }, // Dal Tadka
              { menuId: menu.id, dishId: seededDishes[1].id, isMain: true, isOptional: false }, // Paneer Butter Masala
              { menuId: menu.id, dishId: seededDishes[2].id, isMain: true, isOptional: false }, // Phulka
              { menuId: menu.id, dishId: seededDishes[3].id, isMain: true, isOptional: false }, // Jeera Rice
              { menuId: menu.id, dishId: seededDishes[5].id, isMain: false, isOptional: true }, // Gulab Jamun
            ]);
          } else if (st === 'dinner') {
            await db.insert(menuItems).values([
              { menuId: menu.id, dishId: seededDishes[0].id, isMain: true, isOptional: false },
              { menuId: menu.id, dishId: seededDishes[4].id, isMain: true, isOptional: false }, // Aloo Gobhi
              { menuId: menu.id, dishId: seededDishes[2].id, isMain: true, isOptional: false },
            ]);
          }
        }
      }
    }

    // 11. Selections & Attendance for Student 1
    // Let's find past lunch slot (dayOffset = -1) and upcoming lunch slot (dayOffset = +1)
    const pastSlot = createdSlots.find((s) => s.status === 'completed' && s.slotType === 'lunch');
    const todayLunchSlot = createdSlots.find((s) => s.date === todayStr && s.slotType === 'lunch');
    const tomorrowLunchSlot = createdSlots.find(
      (s) => s.date === new Date(today.getTime() + 86400000).toISOString().split('T')[0] && s.slotType === 'lunch'
    );
    const dayAfterLunchSlot = createdSlots.find(
      (s) => s.date === new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0] && s.slotType === 'lunch'
    );

    if (pastSlot) {
      // Past meal selected and attended
      await db.insert(mealSelections).values({
        studentId: uStudent1.id,
        subscriptionId: subStudent1.id,
        mealSlotId: pastSlot.id,
        messId: mAnnapurna.id,
        date: pastSlot.date,
        slotType: pastSlot.slotType,
        status: 'selected',
      });

      await db.insert(mealAttendances).values({
        studentId: uStudent1.id,
        subscriptionId: subStudent1.id,
        mealSlotId: pastSlot.id,
        messId: mAnnapurna.id,
        markedBy: uOwner1.id,
        verificationMethod: 'qr_scan',
      });
    }

    if (tomorrowLunchSlot) {
      // Advance skip example with credit issuance!
      const [skipSel] = await db
        .insert(mealSelections)
        .values({
          studentId: uStudent1.id,
          subscriptionId: subStudent1.id,
          mealSlotId: tomorrowLunchSlot.id,
          messId: mAnnapurna.id,
          date: tomorrowLunchSlot.date,
          slotType: tomorrowLunchSlot.slotType,
          status: 'skipped',
          skippedAt: new Date(today.getTime() - 3600000),
        })
        .returning();

      // Credit ledger entry for skip
      await db.insert(mealCreditLedger).values({
        studentId: uStudent1.id,
        subscriptionId: subStudent1.id,
        messId: mAnnapurna.id,
        idempotencyKey: `SKIP-CREDIT-${subStudent1.id}-${tomorrowLunchSlot.id}`,
        transactionType: 'credit_earned_skip',
        amountPaise: 5000, // 50 INR
        balancePaiseAfter: 15000, // 150 INR total credits
        reason: `Advance skip recorded for ${tomorrowLunchSlot.date} Lunch`,
        sourceSelectionId: skipSel.id,
      });
    }

    if (dayAfterLunchSlot) {
      // Normal selected
      await db.insert(mealSelections).values({
        studentId: uStudent1.id,
        subscriptionId: subStudent1.id,
        mealSlotId: dayAfterLunchSlot.id,
        messId: mAnnapurna.id,
        date: dayAfterLunchSlot.date,
        slotType: dayAfterLunchSlot.slotType,
        status: 'selected',
      });
    }

    // 12. Historical Kitchen Production Records & Waste Records for Annapurna
    if (pastSlot) {
      await db.insert(kitchenProductionRecords).values([
        {
          messId: mAnnapurna.id,
          mealSlotId: pastSlot.id,
          dishId: seededDishes[0].id, // Dal Tadka
          date: pastSlot.date,
          slotType: pastSlot.slotType,
          portionsPrepared: 85,
          portionsServed: 79,
          leftoverPortions: 6,
          discardedPortions: 1,
          wasteReason: 'unexpected_absenteeism',
          notes: '6 portions remaining: 5 portions packed for night staff donation, 1 discarded.',
          recordedBy: uOwner1.id,
        },
        {
          messId: mAnnapurna.id,
          mealSlotId: pastSlot.id,
          dishId: seededDishes[1].id, // Paneer
          date: pastSlot.date,
          slotType: pastSlot.slotType,
          portionsPrepared: 82,
          portionsServed: 79,
          leftoverPortions: 3,
          discardedPortions: 0,
          wasteReason: 'none',
          notes: 'High demand, very clean kitchen yield.',
          recordedBy: uOwner1.id,
        },
      ]);

      // Demand Forecast record for past slot
      await db.insert(demandForecasts).values({
        messId: mAnnapurna.id,
        mealSlotId: pastSlot.id,
        date: pastSlot.date,
        slotType: pastSlot.slotType,
        predictedDiners: 81,
        recommendedBuffer: 4,
        baselineDiners: 78,
        forecastMethod: 'ai_enhanced',
        confidenceScore: 0.92,
        featuresSnapshot: JSON.stringify({ activeSubscribers: 94, advanceSkips: 13, dayOfWeek: 'Tuesday' }),
        actualDiners: 79,
        forecastErrorAbs: 2,
        forecastErrorPct: 2.53,
      });
    }

    // 13. Feedbacks & Reviews
    await db.insert(feedbacks).values([
      {
        studentId: uStudent1.id,
        messId: mAnnapurna.id,
        rating: 5,
        foodQualityRating: 5,
        hygieneRating: 5,
        tasteRating: 5,
        category: 'taste',
        comment:
          'The Dal Tadka with fresh ghee is the best on campus! Cleanliness is always top-notch and the advance skip feature saved me 150 rupees this week.',
        complaintStatus: 'none',
        ownerResponse: 'Thank you Aarav! We appreciate your loyalty and commitment to zero food waste.',
        respondedAt: new Date(today.getTime() - 7200000),
      },
      {
        studentId: uStudent2.id,
        messId: mAnnapurna.id,
        rating: 4,
        foodQualityRating: 4,
        hygieneRating: 4,
        tasteRating: 4,
        category: 'portion',
        comment: 'Puri bhaji on Sunday was delicious, but please consider introducing high-protein sprout salad on weekdays.',
        complaintStatus: 'investigating',
        ownerResponse: 'Great suggestion Ananya! We are adding sprouted moong koshimbir to Tuesday lunches starting next week.',
        respondedAt: new Date(today.getTime() - 3600000),
      },
    ]);

    // 14. Feedback Analysis & AI Insights
    await db.insert(feedbackAnalyses).values({
      messId: mAnnapurna.id,
      periodStart: prevDate,
      periodEnd: todayStr,
      summary:
        'Overall student satisfaction is high (4.8/5.0). Main highlights include prompt hot roti service and consistent dal tempering. 1 recurring suggestion requests high-protein salad add-ons.',
      sentimentScore: 0.91,
      topStrengths: 'Fresh rotis, Hygienic brass vessels, Prompt skip credit ledger',
      topComplaints: 'Requests for salad variety, occasional dinner queue at 8:30 PM peak',
      suggestedActions:
        '1. Introduce sprouted salad bowl bar. 2. Open second serving counter between 8:20 PM - 8:50 PM.',
    });

    await db.insert(aiInsights).values([
      {
        messId: mAnnapurna.id,
        category: 'waste_reduction',
        title: 'Advance Skip System Cut Food Waste by 18.4%',
        description:
          'By honoring 13 advance skips for Tuesday Lunch, the kitchen prepared 85 portions instead of 98, saving ~3.8 kg raw vegetables and Rs. 540 in ingredient costs with zero customer stockouts.',
        actionableRecommendations:
          'Send early dinner reminder notifications at 5:00 PM to capture 4-6 more late skips before the 6:00 PM cutoff.',
        metricsSnapshot: JSON.stringify({ wasteSavedKg: 3.8, rupeeSavings: 540, adherenceRate: '96.2%' }),
        isAcknowledged: false,
      },
      {
        messId: mAnnapurna.id,
        category: 'demand_shift',
        title: 'Weekend Attendance Dip Pattern Detected',
        description:
          'Attendance consistently drops 22% on Saturday Dinners and Sunday Lunches as students travel home or eat out. Automated forecast automatically applies a 0.78 dampener.',
        actionableRecommendations:
          'Adopt the AI recommended production target of 68 portions for upcoming Sunday Lunch instead of standard 88.',
        metricsSnapshot: JSON.stringify({ weekendDampener: 0.78, projectedSavings: 1120 }),
        isAcknowledged: true,
      },
    ]);

    // 15. Notifications
    await db.insert(notifications).values([
      {
        userId: uStudent1.id,
        title: 'Meal Skip Confirmed & Credit Added',
        message: 'Your skip for Tomorrow Lunch was approved. ₹50.00 meal credit has been credited to your ledger.',
        type: 'credit_earned',
        isRead: false,
        link: '/student/credits',
      },
      {
        userId: uOwner1.id,
        title: 'Tomorrow Lunch Demand Recalculated',
        message: '14 advance skips recorded. Recommended preparation: 78 portions (down from 92 baseline).',
        type: 'demand_alert',
        isRead: false,
        link: '/owner/kitchen',
      },
    ]);

    // 16. Audit Log
    await db.insert(auditLogs).values({
      actorUserId: uAdmin.id,
      actorRole: 'admin',
      action: 'system_initialized',
      resourceType: 'database',
      resourceId: 'all',
      details: 'Initial seed data and demo accounts provisioned for Greenwood Campus',
      ipAddress: '127.0.0.1',
    });

    console.log('Database seeded successfully!');
    return { success: true, message: 'Database successfully seeded' };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// If run directly via tsx
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase(process.argv.includes('--force'))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
