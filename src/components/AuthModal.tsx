import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  ChefHat,
  ShieldCheck,
  Building,
  MapPin,
  Utensils,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
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
  const { user, isRealUser, login, loginWithOtp, sendOtp, verifyOtp, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'student' | 'owner'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration step flow: 'email_input' -> 'otp_verify' -> 'set_password'
  const [regStep, setRegStep] = useState<'email_input' | 'otp_verify' | 'set_password'>('email_input');
  const [otpCode, setOtpCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);

  // Login method: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
    messName?: string;
  }>({});

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Student specific
  const [hostelBlock, setHostelBlock] = useState('Block-B');
  const [roomNumber, setRoomNumber] = useState('204');
  const [collegeId, setCollegeId] = useState('COL2026-402');
  const [dietaryPref, setDietaryPref] = useState<'veg' | 'non_veg' | 'egg_veg'>('veg');
  const [allergies, setAllergies] = useState('');

  // Owner specific
  const [messName, setMessName] = useState('');
  const [messCuisine, setMessCuisine] = useState('North Indian, Thali');
  const [messAddress, setMessAddress] = useState('Hostel Circle, Food Court #3');
  const [isPureVeg, setIsPureVeg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialRole) setRole(initialRole);
      setRegStep('email_input');
      setOtpCode('');
      setVerificationToken(null);
      setLoginMethod('password');
      setLoginOtpSent(false);
      setLoginOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setFieldErrors({});
    }
  }, [isOpen, initialMode, initialRole]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Password Login Handler
  // --------------------------------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      setFieldErrors({ email: 'Email is required' });
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to sign in. Please verify your credentials.');
    } else {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        onClose();
        if (onSuccessRole && res.user) {
          if (res.user.role === 'student') {
            if (res.hasActiveSubscription) {
              onSuccessRole('student');
            } else {
              onSuccessRole('public');
            }
          } else {
            onSuccessRole('owner');
          }
        }
      }, 600);
    }
  };

  // --------------------------------------------------------------------------
  // OTP Login Handlers
  // --------------------------------------------------------------------------
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      setFieldErrors({ email: 'Valid email is required' });
      return;
    }

    setLoading(true);
    const res = await sendOtp(email.trim().toLowerCase(), 'login');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send one-time code.');
    } else {
      setLoginOtpSent(true);
      setOtpCooldown(60);
      setSuccessMsg(`One-time code sent to your email (${email.trim()}). Check inbox or spam.`);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginOtpCode.trim() || loginOtpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      setFieldErrors({ otp: '6 digits required' });
      return;
    }

    setLoading(true);
    const res = await loginWithOtp(email.trim().toLowerCase(), loginOtpCode.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid or expired code.');
    } else {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        onClose();
        if (onSuccessRole && res.user) {
          if (res.user.role === 'student') {
            if (res.hasActiveSubscription) {
              onSuccessRole('student');
            } else {
              onSuccessRole('public');
            }
          } else {
            onSuccessRole('owner');
          }
        }
      }, 600);
    }
  };

  // --------------------------------------------------------------------------
  // Registration Step 1: Send OTP to verify email
  // --------------------------------------------------------------------------
  const handleSendRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newFieldErrors: { name?: string; email?: string } = {};

    if (!name || !name.trim()) {
      newFieldErrors.name = 'Full name is required. Please enter your name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      newFieldErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newFieldErrors.email = 'Please enter a valid email address (e.g. name@campus.edu).';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError(Object.values(newFieldErrors)[0]);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const res = await sendOtp(cleanEmail, 'registration');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send verification code.');
      if (res.error?.toLowerCase().includes('already exists')) {
        setFieldErrors({ email: res.error });
      }
    } else {
      setRegStep('otp_verify');
      setOtpCooldown(60);
      setSuccessMsg(`Verification code dispatched to ${cleanEmail}`);
    }
  };

  // --------------------------------------------------------------------------
  // Registration Step 2: Verify OTP
  // --------------------------------------------------------------------------
  const handleVerifyRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      setFieldErrors({ otp: 'Must be exactly 6 digits' });
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const res = await verifyOtp(cleanEmail, cleanCode, 'registration');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid or expired verification code.');
      setFieldErrors({ otp: res.error || 'Invalid code' });
    } else {
      setVerificationToken(res.verificationToken || null);
      setRegStep('set_password');
      setSuccessMsg('Email verified! Now create your account password.');
    }
  };

  // --------------------------------------------------------------------------
  // Registration Step 3: Set Password & Profile
  // --------------------------------------------------------------------------
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newFieldErrors: { password?: string; confirmPassword?: string; messName?: string } = {};

    if (!password) {
      newFieldErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newFieldErrors.password = `Password must be at least 8 characters long (${password.length}/8).`;
    }

    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (role === 'owner' && (!messName || !messName.trim())) {
      newFieldErrors.messName = 'Mess / Kitchen name is required for owner accounts.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError(Object.values(newFieldErrors)[0]);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      phone: phone.trim(),
      verificationToken,
      otpCode: otpCode.trim() || undefined,
      ...(role === 'student'
        ? { hostelBlock, roomNumber, collegeId, dietaryPref, allergies }
        : { messName: messName.trim(), messCuisine, messAddress, isPureVeg }),
    };

    const res = await register(payload);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Registration failed. Please check inputs.');
    } else {
      setSuccessMsg(
        role === 'student'
          ? 'Student account created and verified! Directing you to campus dining...'
          : 'Kitchen account created and verified! Directing you to kitchen portal...'
      );
      setTimeout(() => {
        onClose();
        if (onSuccessRole) {
          if (role === 'student') {
            onSuccessRole('public');
          } else {
            onSuccessRole('owner');
          }
        }
      }, 700);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSuccessMsg('Signed out successfully.');
    setTimeout(() => {
      onClose();
      if (onSuccessRole) onSuccessRole('public');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#163C32] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                {isRealUser
                  ? 'Your MessMate Account'
                  : mode === 'login'
                  ? 'Sign In to MessMate'
                  : 'Register Verified Account'}
              </h2>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              {isRealUser
                ? 'Authenticated real PostgreSQL session'
                : mode === 'login'
                ? 'Sign in with your verified email to access campus dining'
                : 'Join as a student diner or mess kitchen owner'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contextual Action Prompt */}
        {promptMessage && !error && !successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 shrink-0 font-medium leading-relaxed">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* REAL USER PROFILE VIEW (If already authenticated) */}
        {isRealUser ? (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-700 flex items-center justify-center text-white font-bold">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 1) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>{user?.name}</span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-600 text-white font-semibold px-1.5 py-0.2 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded mt-1 capitalize">
                  {user?.role} Account
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-slate-800">PostgreSQL (Drizzle Cloud SQL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Type:</span>
                <span className="font-semibold text-emerald-800 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Verification:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> OTP Verified
                </span>
              </div>
              {user?.role === 'student' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Subscription:</span>
                  <span className="font-semibold text-slate-800">
                    {(user as any)?.hasActiveSubscription ? 'Subscribed' : 'No Active Mess'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setFieldErrors({});
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login' ? 'bg-white text-[#163C32] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setFieldErrors({});
                  setRegStep('email_input');
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register' ? 'bg-white text-[#163C32] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>

            {/* Quick Demo Credentials for Review */}
            <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Existing Accounts:</span>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('aarav.sharma@campus.edu');
                    setPassword('password123');
                    setMode('login');
                    setLoginMethod('password');
                  }}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100"
                >
                  Student: aarav.sharma@campus.edu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rajesh@annapurnarasoi.in');
                    setPassword('password123');
                    setMode('login');
                    setLoginMethod('password');
                  }}
                  className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-100"
                >
                  Owner: rajesh@annapurnarasoi.in
                </button>
              </div>
            </div>

            {/* ============================================================= */}
            {/* 1. LOGIN MODE                                                 */}
            {/* ============================================================= */}
            {mode === 'login' ? (
              <div>
                {/* Method Switch: Password vs OTP */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-semibold text-slate-700">Login Method:</span>
                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setError(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        loginMethod === 'password'
                          ? 'bg-[#163C32] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setError(null);
                        setLoginOtpSent(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        loginMethod === 'otp'
                          ? 'bg-[#163C32] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Email OTP Code
                    </button>
                  </div>
                </div>

                {loginMethod === 'password' ? (
                  /* Standard Password Sign-in */
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.email ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="email"
                          required
                          placeholder="student@campus.edu"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.password ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="password"
                          placeholder="Enter account password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Authenticating...' : 'Sign In with Password'}
                    </button>
                  </form>
                ) : (
                  /* Email OTP Sign-in */
                  <div className="space-y-4">
                    {!loginOtpSent ? (
                      <form onSubmit={handleSendLoginOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="email"
                              required
                              placeholder="name@campus.edu"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          {loading ? 'Sending Code...' : 'Send One-Time Login Code'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                          <div className="flex items-center justify-between">
                            <span>Code sent to <strong>{email}</strong></span>
                            <button
                              type="button"
                              onClick={() => setLoginOtpSent(false)}
                              className="text-[11px] underline text-emerald-700 font-semibold cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                            Enter 6-digit Verification Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="------"
                            value={loginOtpCode}
                            onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center py-2.5 text-xl tracking-[0.4em] font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading || loginOtpCode.length !== 6}
                          className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ============================================================= */
              /* 2. REGISTRATION MODE (3 STEPS WITH EMAIL OTP VERIFICATION)   */
              /* ============================================================= */
              <div>
                {/* Visual Step Indicator */}
                <div className="mb-5 flex items-center justify-between relative px-2">
                  <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 -z-0" />
                  
                  {/* Step 1 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        regStep === 'email_input'
                          ? 'bg-[#163C32] text-white ring-4 ring-emerald-100'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {regStep === 'email_input' ? '1' : '✓'}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 mt-1">Details</span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        regStep === 'otp_verify'
                          ? 'bg-[#163C32] text-white ring-4 ring-emerald-100'
                          : regStep === 'set_password'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {regStep === 'set_password' ? '✓' : '2'}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 mt-1">Verify Email</span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        regStep === 'set_password'
                          ? 'bg-[#163C32] text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      3
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 mt-1">Set Password</span>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 1: Full Name, Role & Email (Request OTP)                */}
                {/* ------------------------------------------------------------- */}
                {regStep === 'email_input' && (
                  <form onSubmit={handleSendRegOtp} className="space-y-4">
                    {/* Role Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            role === 'student'
                              ? 'border-[#163C32] bg-emerald-50/50 text-[#163C32]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="font-bold text-xs">Student Diner</div>
                            <div className="text-[10px] text-slate-500">Plan & skip meals</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('owner')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            role === 'owner'
                              ? 'border-[#163C32] bg-amber-50/50 text-[#163C32]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ChefHat className="w-4 h-4 text-amber-700" />
                          <div>
                            <div className="font-bold text-xs">Mess Owner</div>
                            <div className="text-[10px] text-slate-500">Kitchen & menu ops</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.name ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priyanshu Sharma"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.name
                              ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                              : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.email ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="email"
                          required
                          placeholder="name@campus.edu or yourname@gmail.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.email
                              ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                              : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                      {fieldErrors.email ? (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1">
                          A 6-digit verification code will be sent to confirm this email.
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163C32]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span>{loading ? 'Sending Code...' : 'Verify Email & Continue'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: Enter 6-digit OTP                                    */}
                {/* ------------------------------------------------------------- */}
                {regStep === 'otp_verify' && (
                  <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                    <div className="text-center pb-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                        <Mail className="w-5 h-5 text-emerald-700" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Verify Your Email Address</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email}</span>
                      </p>
                    </div>

                    {/* Security & Delivery Notice */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <span>A secure one-time verification code has been dispatched to <strong className="text-slate-900">{email}</strong>. Please check your email inbox and spam folder. Enter the 6-digit code below to verify.</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          if (fieldErrors.otp) setFieldErrors((p) => ({ ...p, otp: undefined }));
                          if (error) setError(null);
                        }}
                        className={`w-full text-center py-3 text-2xl tracking-[0.45em] font-mono border rounded-xl focus:outline-none focus:ring-2 ${
                          fieldErrors.otp
                            ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-[#163C32]'
                        }`}
                      />
                      {fieldErrors.otp && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center justify-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.otp}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{loading ? 'Verifying...' : 'Verify Code & Set Password'}</span>
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep('email_input');
                          setError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Change Email
                      </button>

                      <button
                        type="button"
                        disabled={otpCooldown > 0 || loading}
                        onClick={handleSendRegOtp}
                        className={`flex items-center gap-1 font-medium ${
                          otpCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-700 hover:text-emerald-800 cursor-pointer'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${otpCooldown > 0 ? '' : 'animate-spin-hover'}`} />
                        {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: Set Password & Complete Profile                      */}
                {/* ------------------------------------------------------------- */}
                {regStep === 'set_password' && (
                  <form onSubmit={handleFinalRegister} className="space-y-4">
                    {/* Verified Email Confirmation Badge */}
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Email Verified: <strong>{email}</strong></span>
                      </div>
                      <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded">
                        Legit Verified
                      </span>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Create Password <span className="text-rose-500">*</span>
                        </label>
                        <span
                          className={`text-[10px] font-semibold ${
                            password.length === 0
                              ? 'text-slate-400'
                              : password.length >= 8
                              ? 'text-emerald-700 font-bold'
                              : 'text-amber-600'
                          }`}
                        >
                          {password.length === 0
                            ? 'Min 8 chars'
                            : password.length >= 8
                            ? `${password.length} chars (Valid ✓)`
                            : `${password.length}/8 chars`}
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.password ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="password"
                          required
                          placeholder="Create strong password (min 8 characters)"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.password
                              ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                              : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                      {fieldErrors.password && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.password}</span>
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        {confirmPassword.length > 0 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              password === confirmPassword ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {password === confirmPassword ? 'Passwords match ✓' : 'Must match'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.confirmPassword ? 'text-rose-500' : 'text-slate-400'}`} />
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                            if (error) setError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                            fieldErrors.confirmPassword
                              ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                              : 'border-slate-200 focus:ring-[#163C32]'
                          }`}
                        />
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.confirmPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* Role Specific Details */}
                    {role === 'student' ? (
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Hostel Block</label>
                            <input
                              type="text"
                              value={hostelBlock}
                              onChange={(e) => setHostelBlock(e.target.value)}
                              placeholder="e.g. Block C"
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Room Number</label>
                            <input
                              type="text"
                              value={roomNumber}
                              onChange={(e) => setRoomNumber(e.target.value)}
                              placeholder="e.g. 312"
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">College Roll/ID</label>
                            <input
                              type="text"
                              value={collegeId}
                              onChange={(e) => setCollegeId(e.target.value)}
                              placeholder="COL2026-99"
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Diet Preference</label>
                            <select
                              value={dietaryPref}
                              onChange={(e) => setDietaryPref(e.target.value as any)}
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            >
                              <option value="veg">Pure Veg</option>
                              <option value="egg_veg">Eggetarian</option>
                              <option value="non_veg">Non-Veg</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Mess / Kitchen Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={messName}
                            onChange={(e) => {
                              setMessName(e.target.value);
                              if (fieldErrors.messName) setFieldErrors((p) => ({ ...p, messName: undefined }));
                              if (error) setError(null);
                            }}
                            placeholder="e.g. Royal Punjabi Rasoi"
                            className={`w-full p-1.5 text-xs border rounded-lg bg-white ${
                              fieldErrors.messName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                            }`}
                          />
                          {fieldErrors.messName && (
                            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{fieldErrors.messName}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Cuisine Specialty</label>
                          <input
                            type="text"
                            value={messCuisine}
                            onChange={(e) => setMessCuisine(e.target.value)}
                            placeholder="e.g. North Indian, South Indian"
                            className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Mess Location Address</label>
                          <input
                            type="text"
                            value={messAddress}
                            onChange={(e) => setMessAddress(e.target.value)}
                            placeholder="e.g. Near Hostel Gate 2, Campus Court"
                            className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
                          <input
                            type="checkbox"
                            checked={isPureVeg}
                            onChange={(e) => setIsPureVeg(e.target.checked)}
                            className="rounded text-emerald-700"
                          />
                          Is 100% Pure Vegetarian Mess
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-[#163C32] hover:bg-[#205144] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {loading
                          ? 'Registering Account...'
                          : role === 'student'
                          ? 'Complete Registration & Find Messes'
                          : 'Complete Registration & Open Kitchen'}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
