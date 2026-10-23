import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Mess, MealPlan } from '../types.ts';
import { MessLocationMap } from './MessLocationMap.tsx';
import { FoodMacroBadge } from './FoodMacroBadge.tsx';
import {
  Sparkles,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingDown,
  Coins,
  Bot,
  X,
  CreditCard,
  ChefHat,
  HeartPulse,
  Compass,
  Map as MapIcon,
  LayoutGrid,
  GraduationCap,
} from 'lucide-react';

interface PublicLandingProps {
  onSelectMess?: (messId: number) => void;
  onNavigatePortal: (portal: 'student' | 'owner' | 'for-owners') => void;
  onOpenAuth: (mode: 'login' | 'register', role?: 'student' | 'owner', prompt?: string) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onSelectMess,
  onNavigatePortal,
  onOpenAuth,
}) => {
  const { apiFetch, user } = useAuth();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(4500);
  const [catalogView, setCatalogView] = useState<'both' | 'map' | 'grid'>('both');

  // Compare mode
  const [compareList, setCompareList] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // AI Finder state
  const [aiBudget, setAiBudget] = useState(3600);
  const [aiDiet, setAiDiet] = useState('veg');
  const [aiPriorities, setAiPriorities] = useState<string[]>(['High Protein', 'Homestyle']);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Selected mess modal
  const [selectedMess, setSelectedMess] = useState<any | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<MealPlan | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchMesses();
  }, []);

  const fetchMesses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messes');
      if (res.ok) {
        const data = await res.json();
        setMesses(data);
      }
    } catch (err) {
      console.error('Failed to fetch messes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiFinder = async () => {
    if (!user) {
      onOpenAuth(
        'register',
        'student',
        'Create your student account to run AI mess recommendations and customize dietary preferences.'
      );
      return;
    }

    try {
      setAiLoading(true);
      setAiExplanation(null);
      const res = await fetch('/api/ai/mess-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietaryPref: aiDiet,
          monthlyBudget: aiBudget,
          priorities: aiPriorities,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResults(data.recommendations || []);
        setAiExplanation(data.providerNote || 'Ranked using verified database records.');
      }
    } catch (err) {
      console.error('Error running AI finder:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const openMessDetails = async (messId: number) => {
    try {
      const res = await fetch(`/api/messes/${messId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMess(data);
      }
    } catch (err) {
      console.error('Failed to load mess detail:', err);
    }
  };

  const handleDemoSubscribe = async (plan: MealPlan) => {
    try {
      setSubscribing(true);
      const res = await apiFetch('/api/student/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          mealPlanId: plan.id,
          paymentMethod: 'simulated_upi',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckoutSuccess(`Successfully subscribed to ${plan.name}! You can now manage meal selections.`);
        setTimeout(() => {
          setCheckoutPlan(null);
          setSelectedMess(null);
          setCheckoutSuccess(null);
          onNavigatePortal('student');
        }, 1600);
      }
    } catch (err) {
      console.error('Subscription failed:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const toggleCompare = (id: number) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter((x) => x !== id));
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], id]);
      } else {
        setCompareList([...compareList, id]);
      }
    }
  };

  const filteredMesses = messes.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cuisineTypes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVeg = vegOnly ? m.isPureVeg : true;
    const matchesPrice = m.monthlyBasePricePaise / 100 <= maxPrice;
    return matchesSearch && matchesVeg && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#182320]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#163C32] to-[#0F2922] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#244c40]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#D7F36A]/15 border border-[#D7F36A]/40 text-[#D7F36A] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Campus Dining & Kitchen Intelligence
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                College Dining,{' '}
                <span className="text-[#D7F36A] underline decoration-wavy decoration-[#D7F36A]/60">Engineered</span> for Zero
                Waste.
              </h1>

              <p className="text-lg text-emerald-100/90 max-w-2xl leading-relaxed">
                MessMate synchronizes student meal decisions directly with commercial mess kitchens. Skip meals in
                advance to earn rollover wallet credits, while kitchen owners cut food waste by up to 34% through real-time demand
                forecasting.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth(
                        'register',
                        'student',
                        'Join as a verified student to subscribe to mess meals, schedule skips, and earn rollover credits.'
                      );
                    } else if (user.role === 'student') {
                      onNavigatePortal('student');
                    }
                  }}
                  className="bg-[#D7F36A] hover:bg-[#cbf148] text-[#163C32] px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  {user?.role === 'student' ? 'My Student Portal' : 'Join as Student'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (user?.role === 'owner') {
                      onNavigatePortal('owner');
                    } else {
                      onNavigatePortal('for-owners');
                    }
                  }}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ChefHat className="w-4 h-4 text-[#D7F36A]" />
                  {user?.role === 'owner' ? 'My Owner Kitchen' : 'Why MessMate for Owners'}
                </button>
              </div>

              {/* Verified Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg text-xs text-emerald-200">
                <div>
                  <div className="font-extrabold text-white text-lg">1,400+</div>
                  <div className="text-[11px] text-emerald-300">Hostel Diners</div>
                </div>
                <div>
                  <div className="font-extrabold text-white text-lg">34.2%</div>
                  <div className="text-[11px] text-emerald-300">Avg Waste Cut</div>
                </div>
                <div>
                  <div className="font-extrabold text-white text-lg">₹50/meal</div>
                  <div className="text-[11px] text-emerald-300">Guaranteed Skip Credit</div>
                </div>
              </div>
            </div>

            {/* AI Mess Finder Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-slate-900">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#163C32] flex items-center justify-center font-bold">
                      <Bot className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">AI Mess Finder</h3>
                      <p className="text-[11px] text-slate-500">Matches your budget & macro goals</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                    Gemini 3.8 Flash
                  </span>
                </div>

                <div className="space-y-4 pt-4 text-xs">
                  {/* Dietary preference */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Dietary Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['veg', 'egg_veg', 'non_veg'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setAiDiet(d)}
                          className={`py-2 rounded-lg font-medium capitalize border transition-all ${
                            aiDiet === d
                              ? 'bg-[#163C32] text-white border-[#163C32]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {d === 'veg' ? 'Pure Veg' : d === 'egg_veg' ? 'Egg + Veg' : 'Non-Veg'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly budget slider */}
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Monthly Budget:</span>
                      <span className="text-emerald-700 font-extrabold">₹{aiBudget}/month</span>
                    </div>
                    <input
                      type="range"
                      min="2800"
                      max="4800"
                      step="100"
                      value={aiBudget}
                      onChange={(e) => setAiBudget(Number(e.target.value))}
                      className="w-full accent-[#163C32]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>₹2,800</span>
                      <span>₹4,800</span>
                    </div>
                  </div>

                  {/* Priorities */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Top Priorities</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['High Protein', 'Homestyle Roti', 'Hygienic Brass', 'Low Oil', 'South Indian'].map((p) => {
                        const isSelected = aiPriorities.includes(p);
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              if (isSelected) setAiPriorities(aiPriorities.filter((x) => x !== p));
                              else setAiPriorities([...aiPriorities, p]);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleRunAiFinder}
                    disabled={aiLoading}
                    className="w-full bg-[#163C32] hover:bg-[#1f4e42] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <span>Analyzing Messes...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#D7F36A]" />
                        Find Best Messes For Me
                      </>
                    )}
                  </button>

                  {/* Results preview */}
                  {aiResults.length > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                        <span>Top Recommendations</span>
                        <span className="text-[10px] text-emerald-700 font-normal">{aiExplanation}</span>
                      </div>
                      {aiResults.slice(0, 2).map((r, i) => {
                        const m = messes.find((x) => x.id === r.messId);
                        return (
                          <div
                            key={i}
                            onClick={() => m && openMessDetails(m.id)}
                            className="bg-white p-2.5 rounded-lg border border-emerald-100 cursor-pointer hover:border-emerald-300 transition-all text-xs"
                          >
                            <div className="flex justify-between items-center font-bold text-slate-900">
                              <span>{m?.name || `Mess #${r.messId}`}</span>
                              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                                {r.matchPercentage}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{r.recommendationReason}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Closed Loop System Architecture Overview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#163C32]">The Closed-Loop Meal Intelligence System</h2>
            <p className="text-slate-600 text-sm mt-2">
              How MessMate bridges student dietary autonomy with kitchen cost reduction:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                step: '1',
                title: 'Subscribe',
                desc: 'Students choose flexible or monthly board plans.',
                icon: Layers,
                color: 'bg-emerald-50 text-emerald-700',
              },
              {
                step: '2',
                title: 'Advance Skip',
                desc: 'Skip meals before deadline to earn ₹50 rollover credits.',
                icon: Calendar,
                color: 'bg-amber-50 text-amber-700',
              },
              {
                step: '3',
                title: 'AI Forecast',
                desc: 'Demand recalculates live with 5% safety buffer.',
                icon: TrendingDown,
                color: 'bg-sky-50 text-sky-700',
              },
              {
                step: '4',
                title: 'Portion Prep',
                desc: 'Chefs cook exactly for confirmed eaters.',
                icon: ChefHat,
                color: 'bg-purple-50 text-purple-700',
              },
              {
                step: '5',
                title: 'Reconcile',
                desc: 'Mark attendance and log edible leftovers.',
                icon: CheckCircle2,
                color: 'bg-teal-50 text-teal-700',
              },
              {
                step: '6',
                title: 'Insights & Credit',
                desc: 'Waste metrics reflect in analytics and rollover wallet.',
                icon: Coins,
                color: 'bg-rose-50 text-rose-700',
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-[#FBF9F4] p-4 rounded-xl border border-slate-200/70 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#163C32] text-white text-xs font-black flex items-center justify-center">
                      {s.step}
                    </span>
                    <div className={`p-2 rounded-lg ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mess Directory with Real Database Listings */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#163C32]">Campus Mess Catalog & Google Map Radar</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Verified dining centers around campus with real-time Google Maps proximity and nutritional macros
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setCatalogView('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                catalogView === 'both' ? 'bg-[#163C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Map + Cards
            </button>
            <button
              onClick={() => setCatalogView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                catalogView === 'map' ? 'bg-[#163C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Google Map Radar
            </button>
            <button
              onClick={() => setCatalogView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                catalogView === 'grid' ? 'bg-[#163C32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards Only
            </button>
          </div>

          {/* Compare Toolbar */}
          {compareList.length > 0 && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl text-xs">
              <span className="font-semibold text-emerald-900">
                {compareList.length} of 2 selected for comparison
              </span>
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="bg-[#163C32] text-white px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 hover:bg-[#205144] transition-colors cursor-pointer"
              >
                Compare Side-by-Side
              </button>
              <button onClick={() => setCompareList([])} className="text-slate-500 hover:text-slate-700">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Welcome prompt for newly registered students */}
        {user && user.role === 'student' && !(user as any).hasActiveSubscription && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#163C32] text-[#D7F36A] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Welcome, {user.name}! Find your mess near you.</h4>
                <p className="text-xs text-emerald-900/80 mt-0.5">
                  Browse the Google Maps radar below to find verified messes near your hostel. View menus, nutritional macros, and subscribe to start planning meals.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Google Map Locator */}
        {(catalogView === 'both' || catalogView === 'map') && (
          <div className="mb-8">
            <MessLocationMap
              messes={filteredMesses.length > 0 ? filteredMesses : messes}
              onSelectMess={(m) => openMessDetails(m.id)}
              onViewMenu={(id) => openMessDetails(id)}
            />
          </div>
        )}

        {/* Search & Filters */}
        {catalogView !== 'map' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by mess name, cuisine (e.g. Punjabi, South Indian, Thali)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163C32]"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Pure Veg Only
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Max Price:</span>
                <span className="font-bold text-slate-800">₹{maxPrice}/mo</span>
                <input
                  type="range"
                  min="3000"
                  max="4500"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-24 accent-[#163C32]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mess Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading verified mess listings from PostgreSQL...</div>
        ) : filteredMesses.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 text-sm font-semibold">No messes match your selected filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setVegOnly(false);
                setMaxPrice(4500);
              }}
              className="mt-3 text-xs text-emerald-800 underline font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMesses.map((m) => {
              const isComparing = compareList.includes(m.id);
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header & Badges */}
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900 hover:text-emerald-800 transition-colors">
                              {m.name}
                            </h3>
                            {m.isPureVeg && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Leaf className="w-2.5 h-2.5" />
                                Pure Veg
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{m.tagline}</p>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          {m.rating}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {m.distanceKm} km from hostels
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {m.operatingHours}
                        </span>
                      </div>
                    </div>

                    {/* Cuisine and description */}
                    <div className="p-5 text-xs text-slate-600 space-y-3">
                      <p className="line-clamp-2 leading-relaxed">{m.description}</p>
                      <div>
                        <span className="font-bold text-slate-700">Cuisine: </span>
                        <span className="text-slate-600">{m.cuisineTypes}</span>
                      </div>

                      {/* Available Plans pill tags */}
                      {m.plans && m.plans.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Available Plans:</span>
                          <div className="space-y-1">
                            {m.plans.map((p) => (
                              <div
                                key={p.id}
                                className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]"
                              >
                                <span className="font-medium text-slate-800">{p.name}</span>
                                <span className="font-bold text-emerald-800">₹{p.pricePaise / 100}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleCompare(m.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isComparing
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isComparing ? 'Selected to Compare' : '+ Compare'}
                    </button>

                    <button
                      onClick={() => openMessDetails(m.id)}
                      className="bg-[#163C32] hover:bg-[#205144] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      View Menu & Plans
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Side-by-side comparison modal */}
      {showCompareModal && compareList.length === 2 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="font-extrabold text-lg text-slate-900">Side-by-Side Mess Comparison</h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              {compareList.map((id) => {
                const m = messes.find((x) => x.id === id);
                if (!m) return null;
                return (
                  <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <div className="border-b pb-3">
                      <h4 className="font-extrabold text-base text-slate-900">{m.name}</h4>
                      <p className="text-xs text-slate-500">{m.tagline}</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Rating</span>
                        <span className="font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {m.rating} ({m.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Diet Type</span>
                        <span className="font-bold">{m.isPureVeg ? '100% Pure Veg' : 'Non-Veg & Veg Available'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Distance</span>
                        <span className="font-bold">{m.distanceKm} km</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Monthly Base Price</span>
                        <span className="font-bold text-emerald-800">₹{m.monthlyBasePricePaise / 100}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Advance Skip Cutoff</span>
                        <span className="font-bold">{m.selectionCutoffHours} hrs before meal</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Cuisine Focus</span>
                        <span className="font-bold">{m.cuisineTypes}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowCompareModal(false);
                        openMessDetails(m.id);
                      }}
                      className="w-full bg-[#163C32] text-white py-2 rounded-lg font-bold text-xs"
                    >
                      Select {m.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Mess Details Drawer/Modal */}
      {selectedMess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">{selectedMess.mess.name}</h3>
                  {selectedMess.mess.isPureVeg && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300">
                      Pure Veg
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedMess.mess.address}</p>
              </div>
              <button onClick={() => setSelectedMess(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plans List */}
            <div className="mt-6">
              <h4 className="font-extrabold text-sm text-slate-900 mb-3">Available Meal Subscription Plans</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedMess.plans.map((plan: MealPlan) => (
                  <div
                    key={plan.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:border-emerald-500 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-900">{plan.name}</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          ₹{plan.pricePaise / 100}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{plan.description}</p>
                      <div className="mt-3 text-[10px] text-slate-600 space-y-1">
                        <div>Validity: {plan.validityDays} days</div>
                        <div>Total Meals: {plan.totalMeals}</div>
                        <div>Max Skips Allowed: {plan.maxSkipsAllowed} meals</div>
                        <div className="text-emerald-800 font-bold">Credit per Skip: ₹{plan.creditsPerSkipPaise / 100}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          onOpenAuth(
                            'register',
                            'student',
                            'Please create a student account or sign in to subscribe to this mess plan.'
                          );
                          return;
                        }
                        if (user.role !== 'student') {
                          alert('Mess owners cannot subscribe to student meal plans.');
                          return;
                        }
                        setCheckoutPlan(plan);
                      }}
                      className="mt-4 w-full bg-[#163C32] hover:bg-[#205144] text-white py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      Subscribe to Meal Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Dishes & Nutrition Macros */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-sm text-slate-900">Signature Dishes & Nutritional Macros</h4>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Calculated per 100g (ICMR/IFCT)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedMess.dishes.map((d: any) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900">{d.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{d.category?.replace(/_/g, ' ')}</span>
                    </div>
                    <FoodMacroBadge
                      dishName={d.name}
                      calories={d.caloriesEst}
                      protein={d.proteinGramsEst}
                      carbs={d.carbsGramsEst}
                      fat={d.fatGramsEst}
                      portionGrams={d.standardPortionGrams}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">Confirm Meal Subscription</div>
              <button onClick={() => setCheckoutPlan(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Verified Meal Plan Activation
              </div>
              <p className="text-[11px] mt-1 text-emerald-800">
                This plan will be activated under your student account. You can track remaining meals, schedule advance
                skips, and earn ₹50 rollover credits in your Student Portal.
              </p>
            </div>

            <div className="space-y-2 py-2 border-y border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-800">{checkoutPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-extrabold text-base text-emerald-800">₹{checkoutPlan.pricePaise / 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entitlement:</span>
                <span className="font-medium text-slate-700">{checkoutPlan.totalMeals} meals / {checkoutPlan.validityDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skip Policy:</span>
                <span className="font-medium text-emerald-700">₹{checkoutPlan.creditsPerSkipPaise / 100} credit per advance skip</span>
              </div>
            </div>

            {checkoutSuccess && (
              <div className="my-3 p-2.5 bg-emerald-100 text-emerald-900 rounded-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {checkoutSuccess}
              </div>
            )}

            <button
              onClick={() => handleDemoSubscribe(checkoutPlan)}
              disabled={subscribing}
              className="mt-4 w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {subscribing ? 'Activating Subscription...' : `Activate Subscription (₹${checkoutPlan.pricePaise / 100})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
