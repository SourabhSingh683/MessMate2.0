import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  UtensilsCrossed,
  ChevronDown,
  ChefHat,
  GraduationCap,
  LogIn,
  UserPlus,
  LogOut,
  MapPin,
  Building2,
  Sparkles,
} from 'lucide-react';

export type ActiveView = 'public' | 'for-owners' | 'student' | 'owner';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAuth: (mode: 'login' | 'register', role?: 'student' | 'owner', prompt?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleColor = (role?: string) => {
    switch (role) {
      case 'student':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'owner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    setActiveView('public');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#163C32] text-white border-b border-[#235346] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveView('public')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#D7F36A] text-[#163C32] flex items-center justify-center font-black shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">MessMate</span>
              </div>
              <p className="text-[10px] text-emerald-200/80 -mt-0.5 font-medium">Closed-Loop Meal & Kitchen Intelligence</p>
            </div>
          </div>

          {/* Desktop Nav Links - STRICT ROLE SEPARATION */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* 1. GUEST / UNREGISTERED USER NAVIGATION */}
            {!user && (
              <>
                <button
                  onClick={() => setActiveView('public')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'public'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Explore Messes
                </button>

                <button
                  onClick={() => setActiveView('for-owners')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'for-owners'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChefHat className="w-4 h-4 text-[#D7F36A]" />
                  For Mess Owners
                </button>
              </>
            )}

            {/* 2. STUDENT NAVIGATION - ONLY STUDENT + EXPLORE (NO OWNER KITCHEN, NO ADMIN) */}
            {user && user.role === 'student' && (
              <>
                <button
                  onClick={() => setActiveView('public')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'public'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Explore Messes
                </button>

                <button
                  onClick={() => setActiveView('student')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'student'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-[#D7F36A]" />
                  Student Portal
                </button>
              </>
            )}

            {/* 3. OWNER NAVIGATION - ONLY OWNER KITCHEN + EXPLORE (NO STUDENT PORTAL, NO ADMIN) */}
            {user && user.role === 'owner' && (
              <>
                <button
                  onClick={() => setActiveView('owner')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'owner'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChefHat className="w-4 h-4 text-[#D7F36A]" />
                  Owner Kitchen
                </button>

                <button
                  onClick={() => setActiveView('public')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'public'
                      ? 'bg-white/15 text-[#D7F36A] font-bold'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Campus Directory
                </button>
              </>
            )}
          </nav>

          {/* Right Section: Auth State Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              /* Signed In Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#0F2922] hover:bg-[#1b4439] border border-[#2a5b4f] px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 flex items-center justify-center font-bold text-white text-[11px]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.slice(0, 1) || 'U'
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-white leading-tight flex items-center gap-1">
                      <span>{user.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-300">
                      <span className="capitalize font-semibold">
                        {user.role === 'student' ? 'Student' : 'Mess Owner'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize mt-1.5 ${roleColor(
                          user.role
                        )}`}
                      >
                        {user.role === 'student' ? (
                          <GraduationCap className="w-3 h-3" />
                        ) : (
                          <ChefHat className="w-3 h-3" />
                        )}
                        {user.role === 'student' ? 'Verified Student' : 'Mess Kitchen Owner'}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      {user.role === 'student' ? (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setActiveView('student');
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer text-slate-800"
                        >
                          <GraduationCap className="w-4 h-4 text-emerald-700" />
                          My Student Portal
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setActiveView('owner');
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer text-slate-800"
                        >
                          <ChefHat className="w-4 h-4 text-amber-700" />
                          Kitchen Dashboard
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveView('public');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer text-slate-700"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Explore Messes Near Me
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1 px-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Actions: Sign In & Register */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#D7F36A]" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register', 'student')}
                  className="flex items-center gap-1.5 bg-[#D7F36A] hover:bg-[#cbf148] text-[#163C32] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - STRICT ROLE SEPARATION */}
      <div className="md:hidden flex items-center justify-around border-t border-[#235346] py-2 bg-[#0F2922] text-xs">
        {!user && (
          <>
            <button
              onClick={() => setActiveView('public')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'public' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveView('for-owners')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'for-owners' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              For Owners
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1 text-emerald-200 hover:text-white cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register', 'student')}
              className="px-3 py-1 bg-[#D7F36A] text-[#163C32] font-bold rounded-lg cursor-pointer"
            >
              Register
            </button>
          </>
        )}

        {user && user.role === 'student' && (
          <>
            <button
              onClick={() => setActiveView('public')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'public' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              Explore Messes
            </button>
            <button
              onClick={() => setActiveView('student')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'student' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              Student Portal
            </button>
          </>
        )}

        {user && user.role === 'owner' && (
          <>
            <button
              onClick={() => setActiveView('owner')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'owner' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              Owner Kitchen
            </button>
            <button
              onClick={() => setActiveView('public')}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeView === 'public' ? 'text-[#D7F36A] font-bold' : 'text-emerald-200'
              }`}
            >
              Explore Directory
            </button>
          </>
        )}
      </div>
    </header>
  );
};
