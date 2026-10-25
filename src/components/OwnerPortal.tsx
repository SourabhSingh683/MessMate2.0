import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { FoodMacroBadge } from './FoodMacroBadge.tsx';
import { calculateFoodMacros } from '../lib/nutritionCalculator.ts';
import {
  ChefHat,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  BarChart3,
  Flame,
  Scale,
  RefreshCw,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  BookOpen,
  Utensils,
  Clock,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';

export const OwnerPortal: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'kitchen' | 'attendance' | 'subscribers' | 'menus' | 'production' | 'analytics' | 'feedback' | 'copilot'
  >('kitchen');

  // Dashboard & Kitchen Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [kitchenSlots, setKitchenSlots] = useState<any[]>([]);
  const [loadingKitchen, setLoadingKitchen] = useState(true);

  // Production recording form
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<number>(1);
  const [prepCount, setPrepCount] = useState<number>(85);
  const [servedCount, setServedCount] = useState<number>(80);
  const [leftoverCount, setLeftoverCount] = useState<number>(5);
  const [discardedCount, setDiscardedCount] = useState<number>(0);
  const [wasteReason, setWasteReason] = useState<string>('none');
  const [wasteNotes, setWasteNotes] = useState<string>('');
  const [savingProduction, setSavingProduction] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Attendance
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceSlotFilter, setAttendanceSlotFilter] = useState<'all' | 'dinner' | 'lunch' | 'breakfast'>('dinner');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(null);

  // Subscribers
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // Menu & Dishes Management
  const [dishesList, setDishesList] = useState<any[]>([]);
  const [menusList, setMenusList] = useState<any[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('main_course');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishPortionGrams, setDishPortionGrams] = useState<number>(180);
  const [dishCalories, setDishCalories] = useState<number>(240);
  const [dishProtein, setDishProtein] = useState<number>(9.5);
  const [dishCarbs, setDishCarbs] = useState<number>(32);
  const [dishFat, setDishFat] = useState<number>(7.5);
  const [dishDescription, setDishDescription] = useState('');
  const [savingDish, setSavingDish] = useState(false);

  // Schedule Menu
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleSlot, setScheduleSlot] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner');
  const [scheduleTitle, setScheduleTitle] = useState('Dinner Special Homestyle Thali');
  const [selectedDishesForSlot, setSelectedDishesForSlot] = useState<number[]>([]);
  const [savingMenuSchedule, setSavingMenuSchedule] = useState(false);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Feedback Management
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [aiThemes, setAiThemes] = useState<any | null>(null);
  const [loadingAiThemes, setLoadingAiThemes] = useState(false);

  // Copilot Q&A
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string; data?: any }>>([
    {
      sender: 'copilot',
      text: "Hello! I am your Mess Operational Copilot. Ask me anything about this week's food waste, attendance forecasts, active subscribers, or tomorrow's recommended portion prep.",
    },
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadKitchen();
    loadAttendance(undefined, attendanceSlotFilter);
    loadSubscribers();
    loadDishes();
    loadMenus();
    loadAnalytics();
    loadFeedback();
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch('/api/owner/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load owner dashboard:', err);
    }
  };

  const loadKitchen = async () => {
    try {
      setLoadingKitchen(true);
      const res = await apiFetch('/api/owner/kitchen');
      if (res.ok) {
        const data = await res.json();
        setKitchenSlots(data.kitchenSlots || []);
        if (data.kitchenSlots?.length > 0 && !selectedSlotId) {
          setSelectedSlotId(data.kitchenSlots[0].slot.id);
        }
      }
    } catch (err) {
      console.error('Failed to load kitchen slots:', err);
    } finally {
      setLoadingKitchen(false);
    }
  };

  const loadAttendance = async (slotId?: number, slotType?: string) => {
    try {
      let url = '/api/owner/attendance';
      const params = new URLSearchParams();
      if (slotId) params.append('slotId', String(slotId));
      if (slotType && slotType !== 'all') params.append('slotType', slotType);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const loadSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const res = await apiFetch('/api/owner/subscribers');
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const loadDishes = async () => {
    try {
      setLoadingDishes(true);
      const res = await apiFetch('/api/owner/dishes');
      if (res.ok) {
        const data = await res.json();
        setDishesList(data.dishes || []);
      }
    } catch (err) {
      console.error('Failed to load dishes:', err);
    } finally {
      setLoadingDishes(false);
    }
  };

  const loadMenus = async () => {
    try {
      const res = await apiFetch('/api/owner/menus');
      if (res.ok) {
        const data = await res.json();
        setMenusList(data.menus || []);
      }
    } catch (err) {
      console.error('Failed to load menus:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await apiFetch('/api/owner/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await apiFetch('/api/owner/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    }
  };

  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    try {
      setSavingProduction(true);
      const res = await apiFetch('/api/owner/kitchen/production', {
        method: 'POST',
        body: JSON.stringify({
          mealSlotId: selectedSlotId,
          dishId: selectedDishId,
          portionsPrepared: prepCount,
          portionsServed: servedCount,
          leftoverPortions: leftoverCount,
          discardedPortions: discardedCount,
          wasteReason,
          notes: wasteNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner('Production and leftover waste record saved to PostgreSQL database!');
        loadKitchen();
        loadAnalytics();
        loadDashboard();
      } else {
        setStatusBanner(data.error || 'Failed to save production record');
      }
    } catch (err) {
      console.error('Save production error:', err);
    } finally {
      setSavingProduction(false);
    }
  };

  const handleMarkAttendance = async (subscriptionId: number, slotId: number) => {
    try {
      setMarkingAttendance(subscriptionId);
      const res = await apiFetch('/api/owner/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId, mealSlotId: slotId, verificationMethod: 'manual_id' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner('Diner attendance recorded successfully in database!');
        loadAttendance(slotId);
        loadDashboard();
      } else {
        setStatusBanner(data.error || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error('Mark attendance error:', err);
    } finally {
      setMarkingAttendance(null);
    }
  };

  // Dish Management
  const handleOpenAddDish = () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategory('main_course');
    setDishIsVeg(true);
    setDishPortionGrams(180);
    setDishCalories(240);
    setDishProtein(9.5);
    setDishCarbs(32);
    setDishFat(7.5);
    setDishDescription('');
    setDishModalOpen(true);
  };

  const handleEditDish = (d: any) => {
    setEditingDishId(d.id);
    setDishName(d.name);
    setDishCategory(d.category || 'main_course');
    setDishIsVeg(Boolean(d.isVegetarian));
    setDishPortionGrams(d.standardPortionGrams || 180);
    setDishCalories(d.caloriesEst || 240);
    setDishProtein(d.proteinGramsEst || 9.5);
    setDishCarbs(d.carbsGramsEst || 32);
    setDishFat(d.fatGramsEst || 7.5);
    setDishDescription(d.description || '');
    setDishModalOpen(true);
  };

  const handleDishNameChange = (name: string) => {
    setDishName(name);
    // Auto calculate ICMR standard values as user types
    if (name.length > 2) {
      const calc = calculateFoodMacros(name, dishPortionGrams);
      setDishCalories(calc.calories);
      setDishProtein(calc.protein);
      setDishCarbs(calc.carbs);
      setDishFat(calc.fat);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    try {
      setSavingDish(true);
      const payload = {
        name: dishName.trim(),
        category: dishCategory,
        isVegetarian: dishIsVeg,
        standardPortionGrams: dishPortionGrams,
        caloriesEst: dishCalories,
        proteinGramsEst: dishProtein,
        carbsGramsEst: dishCarbs,
        fatGramsEst: dishFat,
        description: dishDescription,
      };

      const url = editingDishId ? `/api/owner/dishes/${editingDishId}` : '/api/owner/dishes';
      const method = editingDishId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusBanner(editingDishId ? 'Dish updated successfully!' : 'New dish added to your menu library!');
        setDishModalOpen(false);
        loadDishes();
      } else {
        setStatusBanner(data.error || 'Failed to save dish');
      }
    } catch (err) {
      console.error('Error saving dish:', err);
    } finally {
      setSavingDish(false);
    }
  };

  const handleDeleteDish = async (dishId: number) => {
    if (!confirm('Are you sure you want to remove this dish from your kitchen menu?')) return;
    try {
      const res = await apiFetch(`/api/owner/dishes/${dishId}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusBanner('Dish removed from kitchen menu.');
        loadDishes();
      }
    } catch (err) {
      console.error('Error deleting dish:', err);
    }
  };

  // Schedule Menu
  const handleScheduleMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDishesForSlot.length === 0) {
      setStatusBanner('Please select at least one dish for the menu.');
      return;
    }

    try {
      setSavingMenuSchedule(true);
      const res = await apiFetch('/api/owner/menus/schedule', {
        method: 'POST',
        body: JSON.stringify({
          date: scheduleDate,
          slotType: scheduleSlot,
          title: scheduleTitle,
          dishIds: selectedDishesForSlot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner(`Menu published for ${scheduleDate} (${scheduleSlot}) with ${selectedDishesForSlot.length} dishes!`);
        loadMenus();
        loadKitchen();
      } else {
        setStatusBanner(data.error || 'Failed to update menu');
      }
    } catch (err) {
      console.error('Error scheduling menu:', err);
    } finally {
      setSavingMenuSchedule(false);
    }
  };

  const handleReplyFeedback = async (feedbackId: number) => {
    const text = replyText[feedbackId];
    if (!text) return;

    try {
      const res = await apiFetch(`/api/owner/feedback/${feedbackId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ ownerResponse: text, complaintStatus: 'resolved' }),
      });
      if (res.ok) {
        setStatusBanner('Reply posted and student notified!');
        setReplyText({ ...replyText, [feedbackId]: '' });
        loadFeedback();
      }
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const handleGenerateAiThemes = async () => {
    try {
      setLoadingAiThemes(true);
      const res = await apiFetch('/api/ai/feedback-summary', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiThemes(data);
      }
    } catch (err) {
      console.error('Failed to generate AI feedback summary:', err);
    } finally {
      setLoadingAiThemes(false);
    }
  };

  const handleSendCopilot = async (customQuery?: string) => {
    const query = customQuery || copilotInput;
    if (!query.trim()) return;

    const newMessages = [...copilotMessages, { sender: 'user' as const, text: query }];
    setCopilotMessages(newMessages);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await apiFetch('/api/owner/copilot', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages([...newMessages, { sender: 'copilot' as const, text: data.answer, data: data.groundedData }]);
      }
    } catch (err) {
      console.error('Copilot query error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Filtered attendance roster
  const filteredAttendance = useMemo(() => {
    const list = attendanceData?.subscribers || [];
    if (!attendanceSearch.trim()) return list;
    const q = attendanceSearch.toLowerCase();
    return list.filter(
      (item: any) =>
        item.student?.name?.toLowerCase().includes(q) ||
        item.student?.email?.toLowerCase().includes(q) ||
        item.profile?.hostelBlock?.toLowerCase().includes(q) ||
        item.profile?.roomNumber?.toLowerCase().includes(q)
    );
  }, [attendanceData, attendanceSearch]);

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    if (!subscriberSearch.trim()) return subscribers;
    const q = subscriberSearch.toLowerCase();
    return subscribers.filter(
      (item: any) =>
        item.student?.name?.toLowerCase().includes(q) ||
        item.student?.email?.toLowerCase().includes(q) ||
        item.profile?.hostelBlock?.toLowerCase().includes(q) ||
        item.profile?.roomNumber?.toLowerCase().includes(q) ||
        item.plan?.name?.toLowerCase().includes(q)
    );
  }, [subscribers, subscriberSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800">
      {/* Mess Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#163C32] text-[#D7F36A] flex items-center justify-center font-bold shadow-md">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{dashboardData?.mess?.name || 'Mess Kitchen'}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Kitchen Ops
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manager: {user?.name} • Selection Cutoff: {dashboardData?.mess?.selectionCutoffHours || 12} hrs prior
            </p>
          </div>
        </div>

        {/* Operational Highlights */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-emerald-800 uppercase font-bold block">Enrolled Diners</span>
            <span className="text-xl font-black text-emerald-950">{dashboardData?.activeSubscribersCount || 0}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-amber-800 uppercase font-bold block">Skips This Week</span>
            <span className="text-xl font-black text-amber-950">{dashboardData?.totalSkipsCount || 0}</span>
          </div>

          <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-teal-800 uppercase font-bold block">Food Saved</span>
            <span className="text-xl font-black text-teal-950">{dashboardData?.estimatedFoodSavedKg || 0} kg</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 sm:space-x-4 overflow-x-auto text-xs sm:text-sm font-semibold">
        {[
          { id: 'kitchen', label: 'Live Kitchen Demand', icon: Flame },
          { id: 'attendance', label: 'Mark Diner Attendance', icon: CheckCircle2 },
          { id: 'subscribers', label: 'Enrolled Subscribers', icon: Users },
          { id: 'menus', label: 'Put / Update Menu', icon: Utensils },
          { id: 'production', label: 'Log Production & Waste', icon: Scale },
          { id: 'analytics', label: 'Operational Analytics', icon: BarChart3 },
          { id: 'feedback', label: 'Reviews & Complaints', icon: MessageSquare },
          { id: 'copilot', label: 'AI Kitchen Copilot', icon: Bot },
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

      {statusBanner && (
        <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {statusBanner}
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: KITCHEN DEMAND & FORECAST */}
      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Upcoming Meal Demand & Prep Targets</h2>
              <p className="text-xs text-slate-500">
                Calculates live demand by reconciling total subscribers against advance skip registrations.
              </p>
            </div>
            <button
              onClick={loadKitchen}
              className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loadingKitchen ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading kitchen demand calculations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kitchenSlots.map((ks: any) => {
                const {
                  slot,
                  totalActiveSubscribers,
                  skipsCount,
                  baselineForecast,
                  aiAssistedForecast,
                  recommendedPortions,
                } = ks;

                return (
                  <div
                    key={slot.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 capitalize">{slot.slotType}</span>
                          <span className="text-[10px] font-bold text-slate-500">{slot.date}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          slot.status === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {slot.status === 'completed' ? 'Completed' : 'Open for Prep'}
                      </span>
                    </div>

                    {/* Breakdown counts */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Enrolled</span>
                        <span className="font-extrabold text-slate-900">{totalActiveSubscribers}</span>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-[10px] text-amber-800 uppercase font-bold block">Skips</span>
                        <span className="font-extrabold text-amber-900">{skipsCount}</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 uppercase font-bold block">Confirmed</span>
                        <span className="font-extrabold text-emerald-950">{totalActiveSubscribers - skipsCount}</span>
                      </div>
                    </div>

                    {/* Recommended Cooking Target */}
                    <div className="p-3 bg-[#163C32] text-white rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-200 font-semibold">Recommended Prep:</span>
                        <span className="text-lg font-black text-[#D7F36A]">{recommendedPortions} portions</span>
                      </div>
                      <div className="text-[10px] text-emerald-100/80 flex justify-between">
                        <span>Baseline: {baselineForecast} portions</span>
                        <span>AI Forecast: {aiAssistedForecast} portions</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setActiveTab('production');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Log Production
                      </button>
                      <button
                        onClick={() => {
                          loadAttendance(slot.id);
                          setActiveTab('attendance');
                        }}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARK DINER ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Mark Diner Meal Attendance</h2>
              <p className="text-xs text-slate-500">
                Single-click meal verification with duplicate claim prevention. Verify student dining status for Breakfast, Lunch, or Dinner.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                {attendanceData?.attendedCount || 0} / {attendanceData?.subscribers?.length || 0} Attended Today
              </span>
            </div>
          </div>

          {/* Slot Selector & Search Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Slot Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Meal:</span>
              {(['dinner', 'lunch', 'breakfast'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setAttendanceSlotFilter(type);
                    loadAttendance(undefined, type);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    attendanceSlotFilter === type
                      ? 'bg-[#163C32] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type} Attendance
                </button>
              ))}
            </div>

            {/* Diner Search Bar */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student by name, hostel, room..."
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
              />
            </div>
          </div>

          {/* Attendance Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Current Slot: {attendanceData?.slot?.slotType?.toUpperCase()} ({attendanceData?.slot?.date}) • {attendanceData?.slot?.startTime} - {attendanceData?.slot?.endTime}
              </span>
              <span className="text-slate-500">
                Showing {filteredAttendance.length} eligible diners
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student Diner</th>
                    <th className="py-3 px-4">Hostel / Room</th>
                    <th className="py-3 px-4">Plan Enrolled</th>
                    <th className="py-3 px-4">Meal Skip Status</th>
                    <th className="py-3 px-4 text-right">Attendance Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No diners found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item: any) => {
                      const { subscription, student, profile, isAttended, isSkipped } = item;
                      return (
                        <tr key={subscription.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{student?.name}</div>
                            <div className="text-[10px] text-slate-400">{student?.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {profile?.hostelBlock} • Room {profile?.roomNumber}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {subscription.planNameSnapshot}
                          </td>
                          <td className="py-3 px-4">
                            {isSkipped ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Advance Skipped
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Enrolled Diner
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isAttended ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Attended
                              </span>
                            ) : isSkipped ? (
                              <span className="text-slate-400 text-xs italic">Meal Skipped</span>
                            ) : (
                              <button
                                onClick={() => handleMarkAttendance(subscription.id, attendanceData.slot.id)}
                                disabled={markingAttendance === subscription.id || !attendanceData?.slot?.id}
                                className="bg-[#163C32] hover:bg-[#205144] text-white px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-sm transition-colors disabled:opacity-50"
                              >
                                {markingAttendance === subscription.id ? 'Marking...' : 'Mark Attended'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ENROLLED SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Enrolled Student Subscribers</h2>
              <p className="text-xs text-slate-500">
                View all students subscribed to your mess plans, their room numbers, remaining meal quotas, and skip counters.
              </p>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subscriber name, room, plan..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
              />
            </div>
          </div>

          {loadingSubscribers ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading subscribers from PostgreSQL database...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student Subscriber</th>
                      <th className="py-3 px-4">Hostel & ID</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4">Remaining Meals</th>
                      <th className="py-3 px-4">Skips Used</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No active subscribers found.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((item: any) => {
                        const { subscription: s, student, profile, plan } = item;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={student?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                                  alt={student?.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">{student?.name}</span>
                                  <span className="text-[10px] text-slate-400">{student?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-800">{profile?.hostelBlock} • Room {profile?.roomNumber}</div>
                              <span className="text-[10px] text-slate-400">ID: {profile?.collegeId || 'COL2026'}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {s.planNameSnapshot}
                              <span className="text-[10px] text-emerald-800 font-bold block">
                                ₹{s.pricePaidPaise / 100} paid
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-black text-slate-900 text-sm">{s.remainingMeals}</span>
                              <span className="text-[10px] text-slate-400 font-medium"> / {s.totalMealsInitial}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-amber-800">
                              {s.skipsUsed} meals
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {s.startDate} to {s.endDate}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PUT OR UPDATE MENU & DISHES */}
      {activeTab === 'menus' && (
        <div className="space-y-6">
          {/* Header & Add Dish Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Manage Kitchen Dishes & Scheduled Menus</h2>
              <p className="text-xs text-slate-500">
                Put or update dishes in your menu library with nutritional macros, and publish menus for Breakfast, Lunch, or Dinner.
              </p>
            </div>

            <button
              onClick={handleOpenAddDish}
              className="flex items-center gap-1.5 bg-[#163C32] hover:bg-[#205144] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D7F36A]" />
              Add New Dish to Library
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Section 1: Publish / Schedule Menu for a Day (Left Col) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-extrabold text-sm text-slate-900">Publish Meal Menu</h3>
                </div>

                <form onSubmit={handleScheduleMenu} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Meal Slot</label>
                    <select
                      value={scheduleSlot}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setScheduleSlot(val);
                        setScheduleTitle(`${val.charAt(0).toUpperCase() + val.slice(1)} Special Menu`);
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Menu Title</label>
                    <input
                      type="text"
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      placeholder="e.g. Punjabi Dal Makhani & Tandoori Roti Special"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium"
                      required
                    />
                  </div>

                  {/* Dish Selector for this Menu */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-bold text-slate-700">Select Dishes from Library</label>
                      <span className="text-[10px] text-slate-400">
                        {selectedDishesForSlot.length} selected
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 space-y-1.5">
                      {dishesList.map((d) => {
                        const isChecked = selectedDishesForSlot.includes(d.id);
                        return (
                          <label
                            key={d.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDishesForSlot([...selectedDishesForSlot, d.id]);
                                  } else {
                                    setSelectedDishesForSlot(selectedDishesForSlot.filter((id) => id !== d.id));
                                  }
                                }}
                                className="rounded text-emerald-700"
                              />
                              <span className="font-semibold text-slate-800">{d.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{d.caloriesEst} kcal</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingMenuSchedule}
                    className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingMenuSchedule ? 'Publishing Menu...' : 'Publish Scheduled Menu'}
                  </button>
                </form>
              </div>
            </div>

            {/* Section 2: Kitchen Dishes Library (Right Col) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-extrabold text-sm text-slate-900">Dishes & Nutrition Library</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">{dishesList.length} total dishes</span>
                </div>

                <div className="space-y-3">
                  {dishesList.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded capitalize">
                            {d.category?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <FoodMacroBadge
                          dishName={d.name}
                          calories={d.caloriesEst}
                          protein={d.proteinGramsEst}
                          portionGrams={d.standardPortionGrams}
                          compact
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditDish(d)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(d.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {dishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingDishId ? 'Edit Dish in Library' : 'Add New Kitchen Dish'}
              </h3>
              <button onClick={() => setDishModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala, Rajma Chawal..."
                  value={dishName}
                  onChange={(e) => handleDishNameChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value="main_course">Main Course / Sabzi</option>
                    <option value="dal">Dal / Lentils</option>
                    <option value="roti">Roti / Indian Bread</option>
                    <option value="rice">Rice / Pulao</option>
                    <option value="starter">Starter / Snack</option>
                    <option value="dessert">Sweet / Dessert</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Portion Size (g)</label>
                  <input
                    type="number"
                    min="20"
                    max="600"
                    value={dishPortionGrams}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setDishPortionGrams(p);
                      if (dishName) {
                        const calc = calculateFoodMacros(dishName, p);
                        setDishCalories(calc.calories);
                        setDishProtein(calc.protein);
                        setDishCarbs(calc.carbs);
                        setDishFat(calc.fat);
                      }
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Nutritional Macros Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Nutritional Profile (per portion)</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Auto-calculated (ICMR/IFCT)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Calories</label>
                    <input
                      type="number"
                      value={dishCalories}
                      onChange={(e) => setDishCalories(Number(e.target.value))}
                      className="w-full p-1 border border-slate-200 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-700 block font-bold">Protein (g)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={dishProtein}
                      onChange={(e) => setDishProtein(Number(e.target.value))}
                      className="w-full p-1 border border-slate-200 rounded text-center font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-700 block font-bold">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={dishCarbs}
                      onChange={(e) => setDishCarbs(Number(e.target.value))}
                      className="w-full p-1 border border-slate-200 rounded text-center font-bold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-700 block font-bold">Fat (g)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={dishFat}
                      onChange={(e) => setDishFat(Number(e.target.value))}
                      className="w-full p-1 border border-slate-200 rounded text-center font-bold text-rose-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Recipe Highlights</label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="e.g. Prepared with fresh paneer, mild spices, and homestyle desi butter..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDishModalOpen(false)}
                  className="w-1/3 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDish}
                  className="w-2/3 bg-[#163C32] hover:bg-[#205144] text-white py-2 rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingDish ? 'Saving to Database...' : editingDishId ? 'Save Changes' : 'Add Dish to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: LOG PRODUCTION & LEFTOVER WASTE */}
      {activeTab === 'production' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Record Kitchen Production & Waste</h2>
                <p className="text-slate-500 text-[11px]">
                  Persists meal outcome into PostgreSQL to compute waste analytics and train future demand models.
                </p>
              </div>

              <form onSubmit={handleSaveProduction} className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Scheduled Meal Slot</label>
                  <select
                    value={selectedSlotId || ''}
                    onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                    required
                  >
                    {kitchenSlots.map((ks: any) => (
                      <option key={ks.slot.id} value={ks.slot.id}>
                        {ks.slot.date} - {ks.slot.slotType.toUpperCase()} ({ks.slot.startTime} - {ks.slot.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Dish Being Reconciled</label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Standard Recipe Macros
                    </span>
                  </div>
                  <select
                    value={selectedDishId}
                    onChange={(e) => setSelectedDishId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value={1}>Dal Tadka with Desi Ghee</option>
                    <option value={2}>Paneer Butter Masala</option>
                    <option value={3}>Fresh Tawa Phulka (Set of 3)</option>
                    <option value={4}>Jeera Pulao</option>
                    <option value={5}>Aloo Gobhi Adraki</option>
                  </select>
                  <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">Nutritional profile:</span>
                    <FoodMacroBadge
                      dishName={
                        selectedDishId === 1
                          ? 'Dal Tadka with Desi Ghee'
                          : selectedDishId === 2
                          ? 'Paneer Butter Masala'
                          : selectedDishId === 3
                          ? 'Fresh Tawa Phulka'
                          : selectedDishId === 4
                          ? 'Jeera Pulao'
                          : 'Aloo Gobi'
                      }
                      compact
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Portions Prepared</label>
                    <input
                      type="number"
                      min="0"
                      value={prepCount}
                      onChange={(e) => setPrepCount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Portions Served</label>
                    <input
                      type="number"
                      min="0"
                      value={servedCount}
                      onChange={(e) => setServedCount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Edible Leftovers (Portions)</label>
                    <input
                      type="number"
                      min="0"
                      value={leftoverCount}
                      onChange={(e) => setLeftoverCount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discarded / Spoilage (Portions)</label>
                    <input
                      type="number"
                      min="0"
                      value={discardedCount}
                      onChange={(e) => setDiscardedCount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-rose-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waste Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                  >
                    <option value="none">None / Zero Waste Reconciled</option>
                    <option value="unexpected_absenteeism">Unexpected Absenteeism</option>
                    <option value="overcooking">Overcooking / Exceeded Buffer</option>
                    <option value="quality_defect">Recipe Quality Defect</option>
                    <option value="late_spoilage">Late Spoilage</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operational Notes</label>
                  <textarea
                    rows={2}
                    value={wasteNotes}
                    onChange={(e) => setWasteNotes(e.target.value)}
                    placeholder="e.g. Leftovers refrigerated safely or packed for staff..."
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProduction}
                  className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingProduction ? 'Saving to Database...' : 'Commit Kitchen Outcome to Database'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="bg-[#163C32] text-white rounded-2xl p-6 shadow-sm space-y-3 text-xs">
                <h3 className="font-bold text-sm text-[#D7F36A]">Waste Reconciliation Rules</h3>
                <p className="text-emerald-100/90 leading-relaxed">
                  Accurate logging ensures that advance skips save real food. The difference between portions prepared and
                  portions served represents kitchen yield variance.
                </p>
                <div className="p-3 bg-white/10 rounded-xl space-y-2 text-[11px]">
                  <div>
                    <strong>Edible Leftovers:</strong> Safe food stored safely in refrigeration for staff or evening meals.
                  </div>
                  <div>
                    <strong>Discarded Portions:</strong> Unconsumed food discarded. Tagged with reason for campus audit.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OPERATIONAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Subscription Revenue</span>
              <span className="text-2xl font-black text-slate-900">₹{analyticsData?.totalRevenueINR ?? 0}</span>
              <span className="text-[10px] font-bold text-emerald-700 block mt-1">● Actual (Recorded)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Advance Skips Honored</span>
              <span className="text-2xl font-black text-amber-800">{analyticsData?.totalAdvanceSkips ?? 0}</span>
              <span className="text-[10px] font-bold text-amber-700 block mt-1">● Actual (Ledger)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Food Avoided (Advance Skips)</span>
              <span className="text-2xl font-black text-emerald-800">{analyticsData?.estimatedFoodAvoidedKg ?? 0} kg</span>
              <span className="text-[10px] font-bold text-blue-700 block mt-1">● Estimated (Pre-prep)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Measured Kitchen Waste</span>
              <span className="text-2xl font-black text-rose-800">{analyticsData?.measuredKitchenWasteKg ?? 0} kg</span>
              <span className="text-[10px] font-bold text-rose-700 block mt-1">● Actual (Discard logs)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Forecast Error (MAE)</span>
              <span className="text-lg font-black text-teal-800">
                {analyticsData?.meanAbsoluteForecastError ? `±${analyticsData.meanAbsoluteForecastError} portions` : 'Not enough data yet'}
              </span>
              <span className="text-[10px] font-bold text-teal-700 block mt-1">● Forecast vs Actual</span>
            </div>
          </div>

          {/* Attendance Trend (Actual vs Forecasted) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Recent Attendance: Forecast vs Actual Diners</h3>
            {analyticsData?.attendanceTrends && analyticsData.attendanceTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-2">Meal Slot</th>
                      <th className="pb-2">Forecasted (Expected)</th>
                      <th className="pb-2">Actual Diners</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsData.attendanceTrends.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-800">{t.date}</td>
                        <td className="py-2.5 text-slate-600">{t.expected} (Forecast)</td>
                        <td className="py-2.5 font-bold">
                          {t.actual !== null && t.actual !== undefined ? (
                            <span className="text-emerald-700">{t.actual} (Actual)</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Not recorded yet</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {t.actual !== null && t.actual !== undefined ? (
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                              Reconciled ({t.actual >= t.expected ? `+${t.actual - t.expected}` : t.actual - t.expected})
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Not enough data yet to show attendance trends.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Food Waste Breakdown by Primary Cause</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {analyticsData?.wasteBreakdown && analyticsData.wasteBreakdown.length > 0 ? (
                analyticsData.wasteBreakdown.map((w: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-800 capitalize">{w.reason.replace(/_/g, ' ')}</div>
                    <div className="text-slate-500">
                      Discarded: <strong className="text-rose-700">{w.discarded} portions (Actual)</strong>
                    </div>
                    <div className="text-slate-500">
                      Edible Leftovers: <strong className="text-amber-800">{w.leftovers} portions (Actual)</strong>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic col-span-3">Not enough data yet. Log kitchen production to view waste breakdown.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: STUDENT REVIEWS & COMPLAINTS */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Student Reviews & Complaint Management</h2>
              <p className="text-xs text-slate-500">
                Respond to students and resolve complaints to maintain mess rating and accreditation.
              </p>
            </div>
            <button
              onClick={handleGenerateAiThemes}
              disabled={loadingAiThemes}
              className="bg-[#163C32] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D7F36A]" />
              {loadingAiThemes ? 'Synthesizing...' : 'AI Thematic Feedback Summary'}
            </button>
          </div>

          {aiThemes && (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-xs space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center font-extrabold text-emerald-950">
                <span>AI Feedback Analysis (Grounded in Verified Reviews)</span>
                <span className="text-[10px] text-emerald-800 font-bold">
                  Sentiment Score: {Math.round((aiThemes.sentimentScore || 0.8) * 100)}%
                </span>
              </div>
              <p className="text-emerald-900 leading-relaxed">{aiThemes.summary}</p>
            </div>
          )}

          <div className="space-y-4">
            {feedbackList.map(({ feedback, studentName, studentEmail }) => (
              <div key={feedback.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{studentName || 'Student'}</span>
                      <span className="text-[10px] text-slate-400">{studentEmail}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          feedback.complaintStatus === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : feedback.complaintStatus === 'opened'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {feedback.complaintStatus === 'none' ? 'Review' : `Complaint: ${feedback.complaintStatus}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex text-amber-500 font-bold gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s}>{s <= feedback.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{feedback.comment}"
                </p>

                {feedback.ownerResponse && (
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1">
                    <span className="font-bold text-[10px] text-emerald-900 uppercase">Your Official Response:</span>
                    <p className="text-emerald-950">{feedback.ownerResponse}</p>
                  </div>
                )}

                {!feedback.ownerResponse && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Write an official response to this student..."
                      value={replyText[feedback.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [feedback.id]: e.target.value })}
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleReplyFeedback(feedback.id)}
                      className="bg-[#163C32] hover:bg-[#205144] text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Post Response
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AI KITCHEN COPILOT */}
      {activeTab === 'copilot' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Owner Operational Copilot</h2>
                  <p className="text-xs text-slate-500">
                    Natural language queries answered strictly from your mess PostgreSQL database records.
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                Gemini 3.8 Flash
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Which dish had the most waste this week?',
                'What should I prepare for tomorrow lunch?',
                'How many skips are recorded for tomorrow dinner?',
                'Which meal plan has the most active subscribers?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCopilot(q)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3 text-xs">
              {copilotMessages.map((m, idx) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xl p-3.5 rounded-2xl leading-relaxed ${
                        isUser
                          ? 'bg-[#163C32] text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-900 shadow-sm rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs animate-pulse">
                    Querying kitchen records and calculating statistics...
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about tomorrow's prep, waste reduction, feedback trends..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#163C32]"
              />
              <button
                onClick={() => handleSendCopilot()}
                disabled={copilotLoading}
                className="bg-[#163C32] hover:bg-[#205144] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Ask Copilot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
