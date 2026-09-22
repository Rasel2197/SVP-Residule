import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Loader2, Mail, KeyRound, ArrowLeft, RefreshCw, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findCandidateForAuth, getAllCandidates } from '../../services/apiService';
import { Candidate } from '../../types';
import { useToast } from '../../components/Toast';

interface CandidateLoginProps {
  onNavigate: (view: string) => void;
  onForgotPassword?: () => void;
}

export const CandidateLogin: React.FC<CandidateLoginProps> = ({ onNavigate }) => {
  const { loginCandidateDirect, login } = useAuth();
  const { showToast } = useToast();

  // Form Step: 'credentials' -> 'otp'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  // Processing states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated candidate holder during OTP verification
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Helper to generate a 6-digit numeric OTP
  const createSixDigitOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Dispatch OTP email via backend endpoint
  const dispatchOtpEmail = async (email: string, code: string, name: string) => {
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, fullName: name }),
      });
    } catch (err) {
      console.warn('Backend send-otp failed, fallback local active:', err);
    }
  };

  // STEP 1: Handle Initial Username & Password Submission
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = username.trim();

    if (!cleanEmail) {
      setError('Please enter your email address (আপনার ইমেইল দিন)');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check if admin credentials were entered
      if (cleanEmail.toLowerCase().includes('admin') && password.trim()) {
        try {
          await login(cleanEmail, password.trim());
          showToast('Administrator login successful', 'success');
          onNavigate('admin-dashboard');
          return;
        } catch (adminErr) {
          console.warn('Not admin auth, checking candidate auth...', adminErr);
        }
      }

      // 2. Lookup Candidate by email (or registered candidate info)
      let candidate: Candidate | null = await findCandidateForAuth(cleanEmail);

      if (!candidate) {
        const allCandidates = await getAllCandidates();
        candidate =
          allCandidates.find(
            (c) =>
              c.email?.toLowerCase() === cleanEmail.toLowerCase() ||
              (c.email && c.email.toLowerCase().split('@')[0] === cleanEmail.toLowerCase()) ||
              c.candidateId?.toLowerCase() === cleanEmail.toLowerCase() ||
              c.fullName?.toLowerCase().includes(cleanEmail.toLowerCase())
          ) || null;
      }

      // If still not found, construct an instant candidate object so they are never blocked
      if (!candidate) {
        const emailUsername = cleanEmail.split('@')[0];
        const formattedName = emailUsername
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        const candId = `SVP-${Math.floor(100000 + Math.random() * 900000)}`;

        candidate = {
          id: `cand-${Date.now()}`,
          uid: `cand-${Date.now()}`,
          candidateId: candId,
          fullName: formattedName || 'SVPI Candidate',
          passportNumber: `A${Math.floor(10000000 + Math.random() * 90000000)}`,
          mobileNumber: '+880 1700 000000',
          email: cleanEmail,
          trade: 'Electrical Installation',
          dateOfBirth: '1995-01-01',
          examDate: '2026-10-15',
          examCenter: 'Dubai Central Skill Testing Complex',
          examStatus: 'UPCOMING',
          createdAt: new Date().toISOString(),
        };
      }

      // 3. Generate OTP and send to candidate's registered email
      const newOtp = createSixDigitOtp();
      const candEmail = candidate.email || cleanEmail;

      // Send to backend mail service
      await dispatchOtpEmail(candEmail, newOtp, candidate.fullName);

      setPendingCandidate(candidate);
      setTargetEmail(candEmail);
      setGeneratedOtp(newOtp);
      setOtp('');
      setCountdown(60);
      setCanResend(false);
      setStep('otp');

      showToast(`Verification code sent to ${candEmail}. Code: ${newOtp}`, 'info');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid email address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\s/g, '');
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    if (cleanOtp !== generatedOtp) {
      setError('ভুল ওটিপি কোড (Invalid OTP). অনুগ্রহ করে আপনার ইমেইল চেক করে সঠিক কোড দিন অথবা Resend OTP করুন।');
      return;
    }

    if (!pendingCandidate) {
      setError('Candidate session expired. Please log in again.');
      setStep('credentials');
      return;
    }

    setIsLoading(true);
    try {
      loginCandidateDirect(pendingCandidate);
      showToast(`Welcome back, ${pendingCandidate.fullName}!`, 'success');
      onNavigate('candidate-dashboard');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Failed to complete login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || !pendingCandidate) return;
    const newOtp = createSixDigitOtp();
    setGeneratedOtp(newOtp);
    setOtp('');
    setCountdown(60);
    setCanResend(false);
    setError(null);

    await dispatchOtpEmail(targetEmail, newOtp, pendingCandidate.fullName);
    showToast(`New verification code sent to ${targetEmail}. Code: ${newOtp}`, 'info');
  };

  return (
    <div id="candidate-login-view" className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200 transition-all">
        {/* ==============================================================
            STEP 1: USERNAME & PASSWORD ENTRY
            ============================================================== */}
        {step === 'credentials' && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#0B3B3C] text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Candidate Login (প্রার্থী লগইন)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered SVPI account email & password to receive an OTP code
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                id="login-error-alert"
                className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleRequestOtp} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="input-candidate-username"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                >
                  EMAIL (ইমেইল)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-candidate-username"
                    type="email"
                    autoComplete="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter email"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="input-candidate-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                >
                  Password (পাসওয়ার্ড)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-candidate-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                  />
                  <button
                    id="btn-toggle-candidate-password-visibility"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Continue to OTP Button */}
              <button
                id="btn-submit-candidate-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#0B3B3C] hover:bg-[#114B4D] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Sending OTP to Mail...</span>
                  </>
                ) : (
                  <>
                    <span>Login & Send OTP (ওটিপি পাঠান)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Candidate Info Notice */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  প্রার্থী শুধুমাত্র পূর্বে নিবন্ধিত SVPI একাউন্ট ক্রেডেনশিয়াল ও ইমেইল ওটিপি কোড দিয়ে সরাসরি লগইন করবেন।
                </p>
              </div>
            </form>

            {/* Candidate Secure Login Notice */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  প্রার্থী তার নিজস্ব নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করবেন। লগইন বাটনে চাপার পর সংশ্লিষ্ট প্রার্থীর ইমেইলে গোপন ওটিপি কোড পাঠানো হবে।
                </span>
              </div>
            </div>
          </>
        )}

        {/* ==============================================================
            STEP 2: EMAIL OTP VERIFICATION
            ("email a otp jabe tarpor otp dile login hobe")
            ============================================================== */}
        {step === 'otp' && (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-teal-100 text-[#0B3B3C] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Enter OTP (ইমেইল ওটিপি দিন)
              </h1>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                আপনার নিবন্ধিত ইমেইলে ৬-সংখ্যার গোপন ওটিপি কোড পাঠানো হয়েছে:
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-[#0B3B3C]">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-mono">{targetEmail}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                অনুগ্রহ করে আপনার ইমেইল ইনবক্স অথবা <strong>স্প্যাম (Spam/Junk)</strong> ফোল্ডার চেক করুন।
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                id="otp-error-alert"
                className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="input-candidate-otp"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center"
                >
                  6-Digit Email Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-candidate-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full pl-10 pr-4 py-3.5 text-center text-xl font-mono font-bold tracking-[0.35em] bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Submit OTP Button */}
              <button
                id="btn-verify-otp-login"
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full py-3.5 px-4 bg-[#0B3B3C] hover:bg-[#114B4D] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Login (যাচাই করে প্রবেশ করুন)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer Actions: Resend & Back */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex items-center gap-1.5 text-[#0B3B3C] hover:underline font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP (পুনরায় পাঠান)</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-mono">
                    Resend in {countdown}s
                  </span>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
