import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { MealCreditEntry } from '../types.ts';
import { FoodMacroBadge } from './FoodMacroBadge.tsx';
import {
  Calendar,
  Coins,
  HeartPulse,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Star,
  RefreshCw,
  Info,
  GraduationCap,
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { user, profile, apiFetch, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'credits' | 'nutrition' | 'feedback' | 'profile'>('dashboard');

  // Dashboard & Subscriptions
  const [dashboardData, setDashboardData] = useState<any>({ activeSubscriptions: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Meals & Planning
  const [meals, setMeals] = useState<any[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Credits
  const [creditsData, setCreditsData] = useState<{ currentBalancePaise: number; ledger: any[] }>({
    currentBalancePaise: 0,
    ledger: [],
  });
  const [redeemAmount, setRedeemAmount] = useState<number>(50);

  // Nutrition
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  // Feedback
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('taste');
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Student Profile Edit
  const [dietaryPref, setDietaryPref] = useState(profile?.dietaryPref || 'veg');
  const [calorieTarget, setCalorieTarget] = useState(profile?.dailyCalorieTarget || 2200);
  const [proteinTarget, setProteinTarget] = useState(profile?.dailyProteinTarget || 75);

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
      loadMeals();
      loadCredits();
      loadNutrition();
    }
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await apiFetch('/api/student/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data && Array.isArray(data.activeSubscriptions) ? data : { activeSubscriptions: [] });
      } else {
        setDashboardData({ activeSubscriptions: [] });
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setDashboardData({ activeSubscriptions: [] });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadMeals = async () => {
    try {
      setLoadingMeals(true);
      const res = await apiFetch('/api/student/meals');
      if (res.ok) {
        const data = await res.json();
        setMeals(data.meals || []);
      }
    } catch (err) {
      console.error('Failed to load student meals:', err);
    } finally {
      setLoadingMeals(false);
    }
  };

  const loadCredits = async () => {
    try {
      const res = await apiFetch('/api/student/credits');
      if (res.ok) {
        const data = await res.json();
        setCreditsData(data);
      }
    } catch (err) {
      console.error('Failed to load credits:', err);
    }
  };

  const loadNutrition = async () => {
    try {
      setLoadingNutrition(true);
      const res = await apiFetch('/api/student/nutrition');
      if (res.ok) {
        const data = await res.json();
        setNutritionData(data);
      }
    } catch (err) {
      console.error('Failed to load nutrition:', err);
    } finally {
      setLoadingNutrition(false);
    }
  };

  const handleSkipMeal = async (mealSlotId: number) => {
    try {
      setActionMessage(null);
      const res = await apiFetch('/api/student/meals/skip', {
        method: 'POST',
        body: JSON.stringify({ mealSlotId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadMeals();
        loadCredits();
        loadDashboard();
      } else {
        setActionMessage(data.error || 'Failed to skip meal');
      }
    } catch (err) {
      console.error('Error skipping meal:', err);
    }
  };

  const handleRedeemCredits = async () => {
    try {
      const paise = redeemAmount * 100;
      const res = await apiFetch('/api/student/credits/redeem', {
        method: 'POST',
        body: JSON.stringify({ amountPaise: paise }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadCredits();
        loadDashboard();
      } else {
        setActionMessage(data.error || 'Failed to redeem credits');
      }
    } catch (err) {
      console.error('Redeem error:', err);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeSub = dashboardData?.activeSubscriptions?.[0];
    if (!activeSub?.subscription?.messId) {
      setActionMessage('You must have an active mess subscription to submit feedback.');
      return;
    }
    const messId = activeSub.subscription.messId;

    try {
      setSubmittingFeedback(true);
      const res = await apiFetch('/api/student/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messId,
          rating: feedbackRating,
          category: feedbackCategory,
          comment: feedbackComment,
        }),
      });
      if (res.ok) {
        setActionMessage('Feedback submitted successfully! Thank you for helping improve the mess.');
        setFeedbackComment('');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Student Sign In Required</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Please sign in to view your meal subscriptions, skip upcoming meals to earn rollover credits, and track personalized nutrition.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800">
      {/* Student Welcome Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={user?.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{user?.name}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hostel: {profile?.hostelBlock || 'Block B'} • Room {profile?.roomNumber || '204'} • ID: {profile?.collegeId || 'COL2026-089'}
            </p>
          </div>
        </div>

        {/* Rollover Credit Balance Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 px-5 py-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-[#D7F36A] flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Rollover Skip Credits</div>
            <div className="text-2xl font-black text-emerald-950">
              ₹{(creditsData?.currentBalancePaise || 0) / 100}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 sm:space-x-4 overflow-x-auto text-xs sm:text-sm font-semibold">
        {[
          { id: 'dashboard', label: 'My Subscriptions', icon: Calendar },
          { id: 'meals', label: 'Meal Planning & Skips', icon: Clock },
          { id: 'credits', label: 'Credit Ledger', icon: Coins },
          { id: 'nutrition', label: 'AI Nutrition Companion', icon: HeartPulse },
          { id: 'feedback', label: 'Ratings & Reviews', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#163C32] text-[#163C32] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification Banner if action succeeded */}
      {actionMessage && (
        <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            {actionMessage}
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: DASHBOARD & ACTIVE SUBSCRIPTIONS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Subscription Details */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Active Meal Subscriptions</h2>
              {loadingDashboard ? (
                <div className="p-8 text-center bg-white rounded-xl text-slate-400 text-xs">Loading subscriptions...</div>
              ) : !dashboardData?.activeSubscriptions || dashboardData.activeSubscriptions.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
                  <p className="text-slate-600 text-xs font-semibold">You do not have any active mess subscriptions yet.</p>
                  <p className="text-slate-400 text-[11px]">
                    Explore the mess catalog on the home page to find messes near you and subscribe to start planning meals.
                  </p>
                </div>
              ) : (
                (dashboardData.activeSubscriptions || []).map((item: any) => (
                  <div
                    key={item.subscription.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-slate-900">{item.mess.name}</h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.plan.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Price Paid</div>
                        <div className="font-black text-emerald-800 text-base">₹{item.subscription.pricePaidPaise / 100}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Meals</span>
                        <span className="font-extrabold text-slate-900 text-base">
                          {item.subscription.remainingMeals}
                        </span>
                        <span className="text-[10px] text-slate-500"> / {item.subscription.totalMealsInitial}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Skips Recorded</span>
                        <span className="font-extrabold text-emerald-800 text-base">
                          {item.subscription.skipsUsed}
                        </span>
                        <span className="text-[10px] text-slate-500"> meals</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Start Date</span>
                        <span className="font-semibold text-slate-800">{item.subscription.startDate}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Renewal Date</span>
                        <span className="font-semibold text-slate-800">{item.subscription.endDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500">
                        Skip Policy: Earn ₹{item.plan.creditsPerSkipPaise / 100} credit per meal skipped before deadline.
                      </div>
                      <button
                        onClick={() => setActiveTab('meals')}
                        className="bg-[#163C32] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#205144] transition-colors cursor-pointer"
                      >
                        Plan / Skip Upcoming Meals
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Action Side Card */}
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Closed-Loop Benefits</h2>
              <div className="bg-[#163C32] text-white rounded-2xl p-6 space-y-4 shadow-md">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#D7F36A]" />
                  <span className="font-bold text-sm">How Rollover Credits Work</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Every time you skip a meal before the mess's cutoff deadline, the kitchen updates its cooking forecast to
                  prevent food waste. You receive a guaranteed ₹50 credit deposited immediately to your ledger.
                </p>
                <div className="p-3 bg-white/10 rounded-xl text-[11px] border border-white/10 space-y-1">
                  <div className="font-bold text-[#D7F36A]">Deduplication Guarantee</div>
                  <div>Each credit transaction is recorded with a unique cryptographic idempotency key in PostgreSQL.</div>
                </div>
                <button
                  onClick={() => setActiveTab('credits')}
                  className="w-full bg-[#D7F36A] hover:bg-[#c6e54f] text-[#163C32] font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  View Full Audit Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEAL PLANNING & ADVANCE SKIPS */}
      {activeTab === 'meals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">7-Day Meal Schedule & Skip Cutoff Deadlines</h2>
              <p className="text-xs text-slate-500">
                Selections close automatically at the mess's cutoff time. Eligible skips generate instant ledger credits.
              </p>
            </div>
            <button
              onClick={loadMeals}
              className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Schedule
            </button>
          </div>

          {loadingMeals ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading scheduled meals from PostgreSQL...</div>
          ) : meals.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border text-center text-xs text-slate-500">
              No upcoming meal slots scheduled. Please ensure you are subscribed to an active mess.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {meals.map((item: any) => {
                const { slot, mess, dishes, selectionStatus, isSkipped, canSkip, isPastCutoff, cutoffFormatted } = item;
                const slotTitle =
                  slot.slotType === 'breakfast' ? 'Breakfast' : slot.slotType === 'lunch' ? 'Lunch' : 'Dinner';

                return (
                  <div
                    key={slot.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isSkipped
                        ? 'border-amber-200 bg-amber-50/20'
                        : isPastCutoff
                        ? 'border-slate-200 opacity-80'
                        : 'border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Slot Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{slotTitle}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{slot.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {slot.startTime} - {slot.endTime} • {mess?.name}
                          </span>
                        </div>

                        {isSkipped ? (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                            Skipped (Credit Earned)
                          </span>
                        ) : isPastCutoff ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            Cutoff Closed
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                            Enrolled
                          </span>
                        )}
                      </div>

                      {/* Dishes Menu for this slot */}
                      <div className="p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Planned Kitchen Menu</span>
                          <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ICMR/IFCT Macros</span>
                        </div>
                        {dishes && dishes.length > 0 ? (
                          <div className="space-y-2">
                            {dishes.map((d: any) => (
                              <div
                                key={d.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]"
                              >
                                <span className="font-semibold text-slate-800">{d.name}</span>
                                <FoodMacroBadge
                                  dishName={d.name}
                                  calories={d.caloriesEst}
                                  protein={d.proteinGramsEst}
                                  portionGrams={d.standardPortionGrams}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px] italic">Homestyle chef specials planned.</div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action & Cutoff Time */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Cutoff Deadline:</span>
                        <span className={`font-bold text-[11px] ${isPastCutoff ? 'text-slate-400' : 'text-amber-800'}`}>
                          {cutoffFormatted} {isPastCutoff ? '(Expired)' : '(Active)'}
                        </span>
                      </div>

                      {canSkip ? (
                        <button
                          onClick={() => handleSkipMeal(slot.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm text-xs"
                        >
                          Skip & Earn ₹50
                        </button>
                      ) : isSkipped ? (
                        <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Skip Registered
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Locked</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT-READY CREDIT LEDGER */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Immutable Meal Credit Ledger</h2>
                  <p className="text-xs text-slate-500">
                    Audit trail of all advance skips, credits earned, and redemptions with unique idempotency keys.
                  </p>
                </div>
              </div>

              {creditsData?.ledger?.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No credit transactions yet. Skip upcoming meals before deadline to earn credits.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Transaction / Reason</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Idempotency Key</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {creditsData.ledger.map(({ entry, messName }: any) => {
                          const isCredit = entry.amountPaise > 0;
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {entry.reason}
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {new Date(entry.createdAt).toLocaleString()} • {messName}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                                  {entry.transactionType.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                                {entry.idempotencyKey}
                              </td>
                              <td
                                className={`py-3 px-4 font-extrabold ${
                                  isCredit ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isCredit ? '+' : ''}₹{entry.amountPaise / 100}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">
                                ₹{entry.balancePaiseAfter / 100}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Credit Redemption Box */}
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Redeem Credits</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-500">Available Balance:</span>
                  <span className="font-extrabold text-base text-emerald-800">
                    ₹{(creditsData?.currentBalancePaise || 0) / 100}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Redeem Amount (INR)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    max={(creditsData?.currentBalancePaise || 0) / 100}
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Credits are deducted and applied as a discount on your next monthly meal billing cycle.
                  </span>
                </div>

                <button
                  onClick={handleRedeemCredits}
                  disabled={(creditsData?.currentBalancePaise || 0) < redeemAmount * 100 || redeemAmount <= 0}
                  className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Apply Credit Towards Next Renewal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NUTRITION & MACROS */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">AI Nutrition Companion</h2>
              <p className="text-xs text-slate-500">
                Personalized macro analysis based on real kitchen dish recipes and serving portions.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
              Powered by Gemini 3.8 Flash
            </span>
          </div>

          {loadingNutrition ? (
            <div className="py-20 text-center text-slate-400 text-xs">Analyzing dietary macros...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Macro Progress Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Calories</span>
                    <span className="text-xl font-black text-slate-900">{nutritionData?.totalCalories || 0}</span>
                    <span className="text-[10px] text-slate-500"> / {nutritionData?.studentGoal?.dailyCalories || 2200} kcal</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Protein</span>
                    <span className="text-xl font-black text-emerald-800">{nutritionData?.totalProtein || 0}g</span>
                    <span className="text-[10px] text-slate-500"> / {nutritionData?.studentGoal?.dailyProtein || 75}g</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Carbohydrates</span>
                    <span className="text-xl font-black text-amber-800">{nutritionData?.totalCarbs || 0}g</span>
                    <span className="text-[10px] text-slate-500"> energy carbs</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Dietary Fats</span>
                    <span className="text-xl font-black text-rose-800">{nutritionData?.totalFat || 0}g</span>
                    <span className="text-[10px] text-slate-500"> healthy fats</span>
                  </div>
                </div>

                {/* AI Insights & Observations */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Intelligent Dietary Insights
                  </div>
                  <div className="space-y-2">
                    {nutritionData?.insights?.map((ins: string, idx: number) => (
                      <div key={idx} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-slate-700">
                        {ins}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical Disclaimer per prompt requirements */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-700">Nutritional Uncertainty Disclaimer</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      All caloric and macronutrient values are calculated on standard recipe ladle measurements (approx.
                      180g-220g per dish) and USDA/FSSAI nutrient reference databases. Actual kitchen servings may vary.
                      Not intended as a clinical or medical dietary prescription.
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Dish Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">Today's Dish Breakdown</h3>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Calculated per 100g
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-sm text-xs">
                  {nutritionData?.dishes?.map((d: any) => (
                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <FoodMacroBadge
                        dishName={d.name}
                        calories={d.caloriesEst}
                        protein={d.proteinGramsEst}
                        portionGrams={d.standardPortionGrams}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RATINGS & FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Submit Feedback Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Submit Mess Review & Complaint</h2>
                <p className="text-slate-500 text-[11px]">
                  Feedback is shared directly with mess owners and monitored by campus administration.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Overall Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                          feedbackRating >= star
                            ? 'bg-amber-50 border-amber-300 text-amber-500'
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${feedbackRating >= star ? 'fill-amber-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value="taste">Taste & Flavor</option>
                    <option value="hygiene">Hygiene & Cleanliness</option>
                    <option value="portion">Portion Size</option>
                    <option value="menu_variety">Menu Variety</option>
                    <option value="service">Serving Queue / Service</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Detailed Review / Observation</label>
                  <textarea
                    rows={4}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Describe your meal experience, quality of rotis, or any suggestion..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting to PostgreSQL...' : 'Submit Feedback'}
                </button>
              </form>
            </div>

            {/* Why Feedback Matters Card */}
            <div className="space-y-4">
              <div className="bg-[#163C32] text-white rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm">Complaint Resolution Protocol</h3>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Ratings 2 stars and below are automatically tagged as active complaints in the Owner Dashboard and
                  escalated to the Dean's Admin Audit Log. Mess owners are accountable for posting direct responses.
                </p>
                <div className="pt-2 border-t border-emerald-800 text-[11px] text-emerald-200">
                  Average resolution time on Greenwood Campus: <strong>4.8 hours</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
