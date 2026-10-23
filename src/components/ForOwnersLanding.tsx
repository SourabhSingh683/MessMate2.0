import React, { useState } from 'react';
import {
  ChefHat,
  TrendingDown,
  Coins,
  ClipboardCheck,
  MessageSquareWarning,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  UtensilsCrossed,
  DollarSign,
  Clock,
  Flame,
  Scale,
  CalendarDays,
  FileCheck2,
} from 'lucide-react';

interface ForOwnersLandingProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onExploreMesses: () => void;
}

export const ForOwnersLanding: React.FC<ForOwnersLandingProps> = ({
  onOpenRegister,
  onOpenLogin,
  onExploreMesses,
}) => {
  // Interactive Savings Calculator state
  const [studentCount, setStudentCount] = useState(120);
  const [avgMealCost, setAvgMealCost] = useState(45);

  // Assumptions: ~18% advance skips that would otherwise be cooked and wasted
  const estimatedSkipsPerMonth = Math.round(studentCount * 30 * 0.18);
  const monthlyGrocerySaved = Math.round(estimatedSkipsPerMonth * (avgMealCost * 0.65));
  const hoursSavedInBookkeeping = Math.round((studentCount / 50) * 16);

  const problemSolutions = [
    {
      id: 'food_waste',
      icon: Flame,
      problemTitle: 'Unpredictable Food Waste & Burning Money',
      problemText:
        'You prepare dinner for 150 hostelers, but 45 eat outside or skip. That cooked dal, sabzi, and rice goes directly into the garbage bin, wasting ₹900–₹1,800 every single night.',
      solutionTitle: 'Real-Time Kitchen Cooking Forecasts',
      solutionText:
        'Students must register meal skips before your strict cutoff deadline (e.g., 2 hours before meal prep). Your kitchen screen shows the exact headcount to cook for before you ignite burners.',
      badge: 'Cuts 34% Food Waste',
      color: 'amber',
    },
    {
      id: 'fee_disputes',
      icon: Coins,
      problemTitle: 'Fee Disputes, Late Payments & Mid-Month Churn',
      problemText:
        'Hostelers leave for the weekend or exam study holidays, then argue at month-end demanding deductions from their bill or switching to competitor messes.',
      solutionTitle: 'Automated ₹50 Rollover Skip Credits',
      solutionText:
        'Closed-loop credits are only granted when students notify the kitchen in advance. Upfront subscriptions secure your cash flow while students feel fairly treated.',
      badge: 'Zero Payment Arguments',
      color: 'emerald',
    },
    {
      id: 'manual_register',
      icon: ClipboardCheck,
      problemTitle: 'Greasy Paper Attendance Registers & Proxy Diners',
      problemText:
        'Mess staff scribbling names in a paper spiral register creates long bottleneck queues at peak meal hours, and allows students to bring unauthorized friends.',
      solutionTitle: '1-Click Digital Roster & Meal Verification',
      solutionText:
        'Instantly filter Breakfast, Lunch, or Dinner rosters. Search any hosteler by room number or name and mark attendance in a single second with real-time verification.',
      badge: 'Fast Counter Flow',
      color: 'blue',
    },
    {
      id: 'whatsapp_rumors',
      icon: MessageSquareWarning,
      problemTitle: 'Hostel WhatsApp Rumors & Sudden Subscriber Loss',
      problemText:
        'A single slightly over-salted dish or tough roti triggers hostile group chats and mass cancellations before you even know something went wrong.',
      solutionTitle: 'Private 2-Star Complaint Alerts & Structured Feedback',
      solutionText:
        'Feedback is captured directly in your portal. Low ratings immediately alert you so you can resolve the issue, reply directly to the student, and maintain 90%+ retention.',
      badge: '90%+ Student Retention',
      color: 'rose',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#182320]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#163C32] to-[#0F2922] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#244c40]">
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#D7F36A]/15 border border-[#D7F36A]/40 text-[#D7F36A] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <ChefHat className="w-4 h-4" />
            Built Specifically for Campus Mess & Tiffin Owners
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Stop Throwing Cooked Food in the Trash.{' '}
            <span className="text-[#D7F36A] underline decoration-wavy decoration-[#D7F36A]/60">
              Run a Profitable, Predictable Mess.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 max-w-3xl mx-auto leading-relaxed">
            MessMate eliminates the guesswork of campus cooking. Receive live headcount forecasts before cooking,
            eliminate paper registers with 1-click attendance, and keep hostelers happy with upfront subscriptions and
            fair skip credits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto bg-[#D7F36A] hover:bg-[#cbf148] text-[#163C32] px-8 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <ChefHat className="w-4 h-4" />
              Register Your Mess Kitchen (Free)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              Sign In to Kitchen Portal
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-[#D7F36A]">34%</div>
              <div className="text-xs text-emerald-200/80 mt-1">Average reduction in prepared food waste</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-white">₹28,500+</div>
              <div className="text-xs text-emerald-200/80 mt-1">Monthly savings on raw materials & LPG</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-[#D7F36A]">1-Second</div>
              <div className="text-xs text-emerald-200/80 mt-1">Digital diner attendance check at counter</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
              <div className="text-xs text-emerald-200/80 mt-1">Elimination of bill & refund disputes</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Big Problems & How MessMate Solves Them */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The 4 Biggest Headaches of Running a Campus Mess — Solved.
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            Commercial cooking has thin margins. Here is how MessMate protects your revenue and sanity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problemSolutions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                      <Icon className="w-6 h-6 text-emerald-800" />
                    </div>
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {item.badge}
                    </span>
                  </div>

                  {/* The Problem */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
                    <div className="text-rose-900 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      The Mess Owner Struggle:
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{item.problemTitle}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.problemText}</p>
                  </div>

                  {/* The MessMate Solution */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                    <div className="text-emerald-900 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      How MessMate Solves It:
                    </div>
                    <h3 className="font-bold text-emerald-950 text-sm mb-1">{item.solutionTitle}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.solutionText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Savings & ROI Calculator */}
      <section className="py-14 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#163C32] text-white rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-[11px] font-extrabold text-[#D7F36A] uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                Interactive Profit Estimator
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3">
                Calculate How Much Your Kitchen Saves Every Month
              </h2>
              <p className="text-xs text-emerald-100/80 mt-1">
                Based on actual food waste reductions from participating campus mess kitchens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Number of Enrolled Students:</span>
                    <span className="text-[#D7F36A] text-base">{studentCount} diners</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="400"
                    step="10"
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full accent-[#D7F36A] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-300/70 mt-1">
                    <span>30 students</span>
                    <span>400 students</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Average Raw Meal Cost (Dal, Rice, Veg, Gas):</span>
                    <span className="text-[#D7F36A] text-base">₹{avgMealCost} / meal</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="75"
                    step="5"
                    value={avgMealCost}
                    onChange={(e) => setAvgMealCost(Number(e.target.value))}
                    className="w-full accent-[#D7F36A] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-300/70 mt-1">
                    <span>₹30 budget</span>
                    <span>₹75 deluxe</span>
                  </div>
                </div>
              </div>

              {/* Output summary */}
              <div className="bg-[#0F2922] p-6 rounded-2xl border border-[#235346] space-y-4">
                <div className="border-b border-white/10 pb-4">
                  <span className="text-xs text-emerald-300 block font-medium">Estimated Monthly Grocery & Gas Saved:</span>
                  <span className="text-3xl sm:text-4xl font-black text-[#D7F36A]">
                    ₹{monthlyGrocerySaved.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-200/80 block mt-1">
                    (~{estimatedSkipsPerMonth} wasted meals prevented from cooking blindly)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Admin Hours Saved</span>
                    <span className="text-lg font-black text-white">{hoursSavedInBookkeeping} hrs/month</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Billing Disputes</span>
                    <span className="text-lg font-black text-white">0 disputes</span>
                  </div>
                </div>

                <button
                  onClick={onOpenRegister}
                  className="w-full bg-[#D7F36A] hover:bg-[#cbf148] text-[#163C32] font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg mt-2"
                >
                  Start Saving with MessMate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in 4 Simple Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How It Works in 4 Simple Steps</h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            No complex hardware or card swiping machines required. Works right on any smartphone, tablet, or laptop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-[#D7F36A] flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Register in 2 Minutes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create your mess profile with cuisine specialties, monthly subscription plans, and location near campus gates.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-[#D7F36A] flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Post Daily & Weekly Menus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input dishes for Breakfast, Lunch, and Dinner. MessMate automatically computes ICMR/IFCT dietary macros.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-[#D7F36A] flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Check Cooking Demand Forecasts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before firing up the kitchen, see exact headcounts of enrolled vs. skipped diners. Cook the exact portion needed.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-[#D7F36A] flex items-center justify-center font-black text-sm">
              4
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">1-Click Diner Attendance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mess workers tap once per hosteler during dinner or lunch service. Eliminates paper notebooks and proxy eating.
            </p>
          </div>
        </div>
      </section>

      {/* Owner FAQ */}
      <section className="py-12 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions by Mess Owners</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm">What if a student wants to eat at the last minute after skipping?</h4>
              <p className="text-slate-600 leading-relaxed">
                Once the cutoff deadline has passed, meal skips are locked. If a student shows up, their status will show 'Skipped', allowing your counter staff to charge an extra guest plate or decline based on available portions.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm">Do I need special barcode scanners or expensive equipment?</h4>
              <p className="text-slate-600 leading-relaxed">
                No special hardware is required. Any smartphone, tablet, or computer can open the MessMate Owner Portal to mark attendance, check subscriber rosters, and update menus.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm">How does MessMate handle student complaints?</h4>
              <p className="text-slate-600 leading-relaxed">
                Students can submit categorized reviews (Taste, Hygiene, Portion, Menu Variety). If a review is 2 stars or lower, you get an immediate priority notice in your dashboard to resolve it before the student leaves your mess.
              </p>
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="text-center pt-8">
            <button
              onClick={onOpenRegister}
              className="bg-[#163C32] hover:bg-[#205144] text-white px-8 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-[#D7F36A]" />
              Register Your Mess Kitchen Today
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-2 text-[11px] text-slate-500">
              Free setup • No hidden commissions • Full data privacy
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
