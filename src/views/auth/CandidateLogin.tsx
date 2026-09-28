import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Mail,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  Info,
} from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { verifyCredentialsStrict } from '../../services/credentialService';
import { Candidate } from '../../types';
import { useToast } from '../../components/Toast';

declare global {
  interface Window {
    candidateRecaptchaVerifier?: RecaptchaVerifier;
  }
}

interface CandidateLoginProps {
  onNavigate: (view: string) => void;
  onForgotPassword?: () => void;
}

export const CandidateLogin: React.FC<CandidateLoginProps> = ({ onNavigate }) => {
  const { loginCandidateDirect, login } = useAuth();
  const { showToast } = useToast();

  // Mode: 'credentials' -> 'otp'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  // Delivery method for OTP: 'phone' or 'email'
  const [deliveryMethod, setDeliveryMethod] = useState<'phone' | 'email'>('email');
  const [targetDestination, setTargetDestination] = useState<string>('');

  // Processing states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated candidate holder during OTP verification
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isOtpExpired, setIsOtpExpired] = useState<boolean>(false);

  // Countdown timer for Resend OTP & Expiration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp') {
      timer = setInterval(() => {
        const now = Date.now();
        if (otpExpiresAt > 0 && now >= otpExpiresAt) {
          setIsOtpExpired(true);
        }

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
  }, [step, otpExpiresAt]);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.candidateRecaptchaVerifier) {
        try {
          window.candidateRecaptchaVerifier.clear();
        } catch {}
        window.candidateRecaptchaVerifier = undefined;
      }
    };
  }, []);

  const createSixDigitOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper to format Bangladeshi phone number with +880
  const formatBdPhone = (phone: string) => {
    const raw = phone.replace(/\D/g, '');
    if (!raw) return '';
    if (raw.startsWith('880')) return `+${raw}`;
    if (raw.startsWith('0')) return `+880${raw.slice(1)}`;
    return `+880${raw}`;
  };

  // Dispatch OTP via Email SMTP or Firebase Phone Auth
  const dispatchOtp = async (
    target: string,
    method: 'phone' | 'email',
    code: string,
    fullName: string
  ) => {
    // 1. Sync OTP record to Firestore
    try {
      const cleanId = target.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(
        doc(db, 'otp_verifications', cleanId),
        {
          contact: target,
          type: method,
          code,
          createdAt: new Date().toISOString(),
          expiresAt: Date.now() + 10 * 60 * 1000,
          verified: false,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore OTP sync notice:', err);
    }

    if (method === 'email') {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target, otp: code, fullName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ইমেইলে ওটিপি পাঠানো সম্ভব হয়নি। অনুগ্রহ করে সঠিক জিমেইল দিন।');
      }
      showToast(`আপনার ইমেইলে (${target}) ওটিপি কোড পাঠানো হয়েছে!`, 'success');
    } else {
      // Mobile Phone: Try server SMS gateway first
      let smsSent = false;
      try {
        const smsRes = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: target, otp: code, fullName }),
        });
        const smsData = await smsRes.json();
        if (smsRes.ok && smsData.success) {
          smsSent = true;
          showToast(`আপনার মোবাইল নম্বরে (${target}) এসএমএস পাঠানো হয়েছে।`, 'success');
        }
      } catch (e) {
        console.warn('Server SMS endpoint error:', e);
      }

      if (!smsSent) {
        // Fallback to Firebase Phone Authentication
        try {
          if (window.candidateRecaptchaVerifier) {
            try {
              window.candidateRecaptchaVerifier.clear();
            } catch {}
            window.candidateRecaptchaVerifier = undefined;
          }
          window.candidateRecaptchaVerifier = new RecaptchaVerifier(auth, 'candidate-recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
          const confirmResult = await signInWithPhoneNumber(auth, target, window.candidateRecaptchaVerifier);
          setConfirmationResult(confirmResult);
          showToast(`আপনার মোবাইল নম্বরে (${target}) এসএমএস কোড পাঠানো হয়েছে।`, 'success');
        } catch (fbPhoneErr: any) {
          console.error('Firebase Phone Auth error:', fbPhoneErr);
          const errCode = fbPhoneErr?.code || '';
          let msg = 'মোবাইল নম্বরে এসএমএস পাঠানো সম্ভব হয়নি।';
          if (errCode === 'auth/operation-not-allowed') {
            msg = 'ফায়ারবেস কনসোলে Phone Authentication চালু নেই। অনুগ্রহ করে আপনার Gmail ইমেইল ঠিকানা দিয়ে লগইন করুন—যেখানে সরাসরি কোড চলে যাবে।';
          } else if (errCode === 'auth/quota-exceeded') {
            msg = 'এসএমএস পাঠানোর কোটা শেষ হয়েছে। অনুগ্রহ করে জিমেইল দিয়ে ওটিপি গ্রহণ করুন।';
          } else if (errCode === 'auth/invalid-phone-number') {
            msg = 'মোবাইল নম্বরটি সঠিক নয়। অনুগ্রহ করে সঠিক ১০-সংখ্যার নম্বর দিন।';
          } else if (errCode === 'auth/captcha-check-failed' || errCode === 'auth/internal-error') {
            msg = 'সিকিউরিটি ক্যাপচা যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে জিমেইল দিয়ে ওটিপি নিন।';
          } else {
            msg = fbPhoneErr?.message || msg;
          }
          throw new Error(msg);
        }
      }
    }
  };

  // STEP 1: Handle Initial Username & Password Submission
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setError('অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল লিখুন।');
      return;
    }

    if (!cleanPass) {
      setError('অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Super Administrator Check (raselahmed231956@gmail.com)
      if (cleanInput.toLowerCase() === 'raselahmed231956@gmail.com') {
        const resRole = await login(cleanInput, cleanPass);
        if (resRole === 'admin') {
          showToast('সুপার অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে!', 'success');
          onNavigate('admin-dashboard');
          return;
        }
      }

      // 2. Strictly verify Candidate existence & password match
      const verifyResult = await verifyCredentialsStrict(cleanInput, cleanPass, ['candidate', 'admin']);
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'তথ্য পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।');
      }

      if (verifyResult.role === 'admin') {
        await login(cleanInput, cleanPass);
        onNavigate('admin-dashboard');
        return;
      }

      const candidate: Candidate = verifyResult.user;

      // Determine delivery method (phone or email)
      const isPhoneInput = /^\+?[0-9]{10,14}$/.test(cleanInput.replace(/\s+/g, ''));
      let targetMethod: 'phone' | 'email' = 'email';
      let targetDest = '';

      if (isPhoneInput) {
        targetMethod = 'phone';
        targetDest = formatBdPhone(cleanInput);
      } else if (cleanInput.includes('@')) {
        targetMethod = 'email';
        targetDest = cleanInput.toLowerCase();
      } else if (candidate.email && candidate.email.includes('@')) {
        targetMethod = 'email';
        targetDest = candidate.email.toLowerCase();
      } else if (candidate.mobileNumber) {
        targetMethod = 'phone';
        targetDest = formatBdPhone(candidate.mobileNumber);
      } else {
        targetMethod = 'email';
        targetDest = cleanInput.toLowerCase();
      }

      const newOtp = createSixDigitOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      await dispatchOtp(targetDest, targetMethod, newOtp, candidate.fullName);

      setPendingCandidate(candidate);
      setDeliveryMethod(targetMethod);
      setTargetDestination(targetDest);
      setGeneratedOtp(newOtp);
      setOtpExpiresAt(expiresAt);
      setIsOtpExpired(false);
      setOtp('');
      setCountdown(60);
      setCanResend(false);
      setStep('otp');
    } catch (err: any) {
      console.error('Candidate login error:', err);
      setError(err?.message || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\s/g, '');
    if (cleanOtp.length !== 6) {
      setError('অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোডটি লিখুন।');
      return;
    }

    if (Date.now() > otpExpiresAt || isOtpExpired) {
      setError('এই ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে Resend OTP করে নতুন কোড নিন।');
      return;
    }

    let verified = cleanOtp === generatedOtp;

    if (!verified && confirmationResult && deliveryMethod === 'phone') {
      try {
        await confirmationResult.confirm(cleanOtp);
        verified = true;
      } catch (err) {
        console.warn('Firebase Phone Auth confirmation check failed:', err);
      }
    }

    if (!verified) {
      setError('ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক কোড দিন অথবা মেয়াদের পর পুনরায় কোড পাঠান।');
      return;
    }

    if (!pendingCandidate) {
      setError('সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার শুরু থেকে লগইন করুন।');
      setStep('credentials');
      return;
    }

    setIsLoading(true);
    try {
      loginCandidateDirect(pendingCandidate);
      showToast(`স্বাগতম, ${pendingCandidate.fullName}!`, 'success');
      onNavigate('candidate-dashboard');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('লগইন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || !pendingCandidate) return;
    const newOtp = createSixDigitOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    setGeneratedOtp(newOtp);
    setOtpExpiresAt(expiresAt);
    setIsOtpExpired(false);
    setOtp('');
    setCountdown(60);
    setCanResend(false);
    setError(null);

    setIsLoading(true);
    try {
      await dispatchOtp(targetDestination, deliveryMethod, newOtp, pendingCandidate.fullName);
    } catch (err: any) {
      setError(err?.message || 'কোড পুনরায় পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="candidate-login-view" className="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-slate-50">
      {/* Hidden Firebase Recaptcha Container */}
      <div id="candidate-recaptcha-container" />

      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
        {/* ==============================================================
            STEP 1: IDENTIFIER & PASSWORD ENTRY
            ============================================================== */}
        {step === 'credentials' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-11 h-11 bg-[#0B3B3C] text-white rounded-xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                প্রার্থী লগইন (Candidate Login)
              </h1>
              <p className="text-xs text-slate-500">
                SVP Reschedule & Marksheet Verification
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                id="login-error-alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="input-candidate-identifier"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  মোবাইল নম্বর অথবা ইমেইল (Mobile / Email)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-candidate-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX বা yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-candidate-password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    পাসওয়ার্ড (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('operator-login')}
                    className="text-xs text-[#0B3B3C] hover:underline"
                  >
                    ইউজার লগইন?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-candidate-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-candidate-login"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করে ওটিপি পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন ও ওটিপি কোড পাঠান</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            STEP 2: OTP VERIFICATION (NO CODE EVER DISPLAYED ON SCREEN)
            ============================================================== */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-11 h-11 bg-teal-50 text-[#0B3B3C] rounded-xl flex items-center justify-center mx-auto border border-teal-100 shadow-xs">
                {deliveryMethod === 'phone' ? (
                  <Smartphone className="w-5 h-5 text-teal-700" />
                ) : (
                  <Mail className="w-5 h-5 text-teal-700" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                সিকিউরিটি ওটিপি কোড
              </h2>
              <p className="text-xs text-slate-600">
                {deliveryMethod === 'phone'
                  ? 'আপনার মোবাইল নম্বরে ৬-সংখ্যার এসএমএস কোড পাঠানো হয়েছে:'
                  : 'আপনার নিবন্ধিত ইমেইলে ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে:'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-[#0B3B3C]">
                {deliveryMethod === 'phone' ? (
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                )}
                <span>{targetDestination}</span>
              </div>
            </div>

            {/* Email Spam notice */}
            {deliveryMethod === 'email' && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  ইনবক্সে কোড না পেলে অনুগ্রহ করে Gmail-এর <strong>Spam / Junk</strong> অথবা <strong>Promotions</strong> ফোল্ডার চেক করুন।
                </span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                id="otp-error-alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="input-candidate-otp"
                  className="block text-xs font-medium text-slate-700 mb-1.5 text-center"
                >
                  প্রেরিত ৬-সংখ্যার ওটিপি কোড লিখুন
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className="w-full pl-10 pr-4 py-3 text-center text-xl font-mono font-bold tracking-[0.35em] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                  />
                </div>
              </div>

              {/* Submit OTP Button */}
              <button
                id="btn-verify-otp-login"
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full py-3 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>যাচাই করে লগইন সম্পন্ন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer Actions: Resend & Back */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>তথ্য পরিবর্তন</span>
                </button>

                {canResend || isOtpExpired ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-[#0B3B3C] hover:underline font-bold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Resend OTP (পুনরায় পাঠান)</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-mono">
                    Resend in {countdown}s
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
