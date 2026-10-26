import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  GraduationCap,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building,
  Utensils,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'student' | 'owner';
  promptMessage?: string | null;
  onSuccessRole?: (role: 'public' | 'student' | 'owner') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'student',
  promptMessage,
  onSuccessRole,
}) => {
  const { isRealUser, login, register, resendVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'student' | 'owner'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration link confirmation state
  const [regConfirmationSent, setRegConfirmationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student specific details
  const [hostelBlock, setHostelBlock] = useState('Block-B');
  const [roomNumber, setRoomNumber] = useState('204');
  const [collegeId, setCollegeId] = useState('COL2026-402');
  const [dietaryPref, setDietaryPref] = useState<'veg' | 'non_veg' | 'egg_veg'>('veg');

  // Owner specific details
  const [messName, setMessName] = useState('');
  const [messCuisine, setMessCuisine] = useState('North Indian, Thali');
  const [messAddress, setMessAddress] = useState('Hostel Circle, Food Court #3');
  const [isPureVeg, setIsPureVeg] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialRole) setRole(initialRole);
      setRegConfirmationSent(false);
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setFieldErrors({});
    }
  }, [isOpen, initialMode, initialRole]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Password Login Handler
  // --------------------------------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      setFieldErrors({ email: 'Email is required' });
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, password);
    setLoading(false);

    if (!res.success) {
      if (res.error?.toLowerCase().includes('email not confirmed')) {
        setError('Your email has not been confirmed yet. Please check your inbox and click the activation link.');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
      return;
    }

    onClose();
    if (onSuccessRole && res.user) {
      onSuccessRole(res.user.role as any);
    }
  };

  // --------------------------------------------------------------------------
  // Registration Handler (Direct Supabase Link Confirmation)
  // --------------------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const newFieldErrors: Record<string, string> = {};

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      newFieldErrors.name = 'Full name is required';
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newFieldErrors.email = 'Valid email is required (e.g. name@campus.edu)';
    }
    if (!password || password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }
    if (role === 'owner' && !messName.trim()) {
      newFieldErrors.messName = 'Mess / Kitchen name is required';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError(Object.values(newFieldErrors)[0]);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const res = await register({
      name: cleanName,
      email: cleanEmail,
      password,
      role,
      phone: phone.trim() || undefined,
      hostelBlock: role === 'student' ? hostelBlock : undefined,
      roomNumber: role === 'student' ? roomNumber : undefined,
      collegeId: role === 'student' ? collegeId : undefined,
      dietaryPref: role === 'student' ? dietaryPref : undefined,
      messName: role === 'owner' ? messName.trim() : undefined,
      messCuisine: role === 'owner' ? messCuisine.trim() : undefined,
      messAddress: role === 'owner' ? messAddress.trim() : undefined,
      isPureVeg: role === 'owner' ? isPureVeg : undefined,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed. Please check your details.');
      if (res.error?.toLowerCase().includes('already registered')) {
        setFieldErrors({ email: 'This email is already registered. Please sign in.' });
      }
      return;
    }

    if (res.emailConfirmationRequired) {
      setRegConfirmationSent(true);
      setResendCooldown(60);
      setSuccessMsg(`Confirmation email sent to ${cleanEmail}`);
    } else {
      // Activated immediately
      onClose();
      if (onSuccessRole && res.user) {
        onSuccessRole(res.user.role as any);
      }
    }
  };

  const fillDemoAccount = (demoEmail: string, demoRole: 'student' | 'owner') => {
    setEmail(demoEmail);
    setPassword('password123');
    setRole(demoRole);
    setMode('login');
    setError(null);
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRole: 'student' | 'owner') => {
    setEmail(demoEmail);
    setPassword('password123');
    setRole(demoRole);
    setMode('login');
    setError(null);
    setLoading(true);
    const res = await login(demoEmail, 'password123');
    setLoading(false);
    if (res.success) {
      onClose();
      if (onSuccessRole && res.user) {
        onSuccessRole(res.user.role as any);
      }
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#163C32] to-[#205144] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold">
                {mode === 'login' ? 'Sign In to MessMate' : 'Create Verified Account'}
              </h2>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {mode === 'login'
                ? 'Access your dining ledger, meal skips, or mess management'
                : 'Join as a student diner or mess kitchen owner'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        {!regConfirmationSent && (
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#163C32] border-b-2 border-[#163C32]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#163C32] border-b-2 border-[#163C32]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>
        )}

        <div className="p-5">
          {promptMessage && !error && !successMsg && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{promptMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('activation link') && (
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      await resendVerificationEmail(email);
                      setLoading(false);
                      setSuccessMsg(`Activation link re-sent to ${email}`);
                    }}
                    className="block mt-1 underline font-bold text-rose-900 hover:text-rose-950 cursor-pointer"
                  >
                    Resend confirmation link to {email}
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Credentials in Login Mode */}
          {mode === 'login' && !isRealUser && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700">Quick Demo Accounts (1-Click Instant Login):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('aarav.sharma@campus.edu', 'student')}
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Student: aarav.sharma@campus.edu
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('rajesh@annapurnarasoi.in', 'owner')}
                  className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Owner: rajesh@annapurnarasoi.in
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* LOGIN FORM                                                    */}
          {/* ------------------------------------------------------------- */}
          {mode === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="yourname@campus.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* REGISTRATION CONFIRMATION SCREEN (Link Click Authorization)   */}
          {/* ------------------------------------------------------------- */}
          {mode === 'register' && regConfirmationSent && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                <Mail className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Check Your Email</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  We have sent an activation link to your email address.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl max-w-sm mx-auto text-left space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Recipient: <strong className="font-mono text-emerald-900">{email}</strong></span>
                </div>
                <div className="text-[11px] text-emerald-800 space-y-1 leading-relaxed border-t border-emerald-200/60 pt-2">
                  <p>1. Open your inbox (check spam folder if needed).</p>
                  <p>2. Click the <strong>Confirm your email</strong> link from Supabase.</p>
                  <p>3. Return here and sign in with your password.</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegConfirmationSent(false);
                  }}
                  className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={async () => {
                    setLoading(true);
                    const res = await resendVerificationEmail(email);
                    setLoading(false);
                    if (res.success) {
                      setSuccessMsg(`Activation email re-sent to ${email}`);
                      setResendCooldown(60);
                    } else {
                      setError(res.error || 'Failed to resend confirmation email.');
                    }
                  }}
                  className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend Confirmation Email'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* REGISTRATION FORM (Clean, Single Step, No OTP)                */}
          {/* ------------------------------------------------------------- */}
          {mode === 'register' && !regConfirmationSent && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                      role === 'student'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>Student Diner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                      role === 'owner'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ChefHat className="w-4 h-4 text-amber-700" />
                    <span>Mess Owner</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="e.g. Tamanna Singh"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                  />
                </div>
                {fieldErrors.name && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="yourname@campus.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">An activation link will be sent to this email.</p>
                {fieldErrors.email && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Set Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                      }}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword)
                          setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Optional Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                  />
                </div>
              </div>

              {/* Owner Specific: Mess Name */}
              {role === 'owner' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mess / Kitchen Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={messName}
                      onChange={(e) => {
                        setMessName(e.target.value);
                        if (fieldErrors.messName) setFieldErrors((p) => ({ ...p, messName: undefined }));
                      }}
                      placeholder="e.g. Annapurna Rasoi Premier"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                    />
                  </div>
                  {fieldErrors.messName && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.messName}</p>}
                </div>
              )}

              {/* Student Specific: Dietary Preference */}
              {role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Preference</label>
                  <div className="flex gap-2">
                    {(['veg', 'non_veg', 'egg_veg'] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setDietaryPref(pref)}
                        className={`flex-1 py-1.5 text-[11px] rounded-lg font-semibold border transition cursor-pointer capitalize ${
                          dietaryPref === pref
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pref.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? 'Sending Activation Link...' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
