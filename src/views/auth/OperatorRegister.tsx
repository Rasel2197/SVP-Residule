import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface OperatorRegisterProps {
  onNavigate: (view: string) => void;
}

export const OperatorRegister: React.FC<OperatorRegisterProps> = ({ onNavigate }) => {
  const { registerOperator } = useAuth();
  const { showToast } = useToast();

  // Mode: 'phone' or 'email'
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');

  // Step: 'form' -> 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP states
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp') {
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
  }, [step]);

  const generateSixDigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const getFullPhoneNumber = () => {
    const raw = phoneNumber.replace(/\D/g, '');
    if (!raw) return '';
    // Strip leading 0 if provided (e.g. 01712... -> 1712...)
    const trimmed = raw.startsWith('0') ? raw.slice(1) : raw;
    return `+880${trimmed}`;
  };

  // Dispatch OTP via Email or Mobile SMS simulation
  const sendVerificationCode = async (targetContact: string, code: string, name: string) => {
    if (contactType === 'email') {
      try {
        await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetContact, otp: code, fullName: name }),
        });
      } catch (e) {
        console.warn('Backend send-otp error:', e);
      }
    } else {
      setSmsNotification(`📱 SMS কোড: ${code} (${targetContact})`);
    }
  };

  // STEP 1: Validate form and dispatch OTP
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First Name এবং Last Name লিখুন');
      return;
    }

    let target = '';
    if (contactType === 'phone') {
      const raw = phoneNumber.replace(/\D/g, '');
      const trimmed = raw.startsWith('0') ? raw.slice(1) : raw;
      if (trimmed.length !== 10) {
        setErrorMessage('সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন (যেমন: 17XXXXXXXX)');
        return;
      }
      target = `+880${trimmed}`;
    } else {
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('সঠিক ইমেইল এড্রেস দিন');
        return;
      }
      target = email.trim().toLowerCase();
    }

    if (!password) {
      setErrorMessage('পাসওয়ার্ড দিন');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }

    setIsLoading(true);
    try {
      const code = generateSixDigitCode();
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      setGeneratedOtp(code);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setOtpInput('');
      setCountdown(60);
      setCanResend(false);

      await sendVerificationCode(target, code, fullName);

      setStep('otp');
      showToast('৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে', 'success');
    } catch (err: any) {
      setErrorMessage('ওটিপি কোড পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and finalize Account Creation
  const handleVerifyOtpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = otpInput.trim().replace(/\D/g, '');
    if (cleanInput.length !== 6) {
      setErrorMessage('৬-সংখ্যার কোড লিখুন');
      return;
    }

    if (Date.now() > otpExpiresAt) {
      setErrorMessage('ওটিপির মেয়াদ শেষ হয়েছে, Resend করুন');
      return;
    }

    if (cleanInput !== generatedOtp) {
      setErrorMessage('ভুল ওটিপি কোড');
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const finalPhone = contactType === 'phone' ? getFullPhoneNumber() : '';
      const finalEmail = contactType === 'email' ? email.trim().toLowerCase() : '';

      await registerOperator({
        fullName,
        phoneNumber: finalPhone,
        email: finalEmail,
        password,
        agencyName: 'General Agency',
      });

      showToast(`স্বাগতম, ${fullName}! একাউন্ট তৈরি সম্পন্ন হয়েছে`, 'success');
      onNavigate('operator-dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend) return;
    const newCode = generateSixDigitCode();
    const target = contactType === 'phone' ? getFullPhoneNumber() : email.trim().toLowerCase();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    setGeneratedOtp(newCode);
    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    setOtpInput('');
    setCountdown(60);
    setCanResend(false);
    setErrorMessage(null);

    await sendVerificationCode(target, newCode, fullName);
    showToast('নতুন কোড পাঠানো হয়েছে', 'info');
  };

  const activeTargetDisplay =
    contactType === 'phone' ? getFullPhoneNumber() : email.trim().toLowerCase();

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-xl bg-[#0B3B3C] text-white flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-5 h-5 text-teal-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === 'form' ? 'নতুন একাউন্ট সাইন আপ' : 'সিকিউরিটি কোড ভেরিফিকেশন'}
          </h1>
          <p className="text-xs text-slate-500">
            SVP Reschedule & Marksheet Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === 'form' && (
            <form onSubmit={handleInitiateRegistration} className="space-y-3.5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="operator-reg-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="operator-reg-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Segmented Switch: Phone OR Email */}
              <div>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setContactType('phone');
                      setErrorMessage(null);
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      contactType === 'phone'
                        ? 'bg-white text-[#0B3B3C] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>মোবাইল নম্বর</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContactType('email');
                      setErrorMessage(null);
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      contactType === 'email'
                        ? 'bg-white text-[#0B3B3C] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>ইমেইল এড্রেস</span>
                  </button>
                </div>
              </div>

              {/* Contact Field (Phone with Automatic Bangladesh +880 or Email) */}
              {contactType === 'phone' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0B3B3C]/10 focus-within:border-[#0B3B3C] transition-all">
                    <div className="flex items-center gap-1.5 px-3 bg-slate-100 border-r border-slate-200 text-slate-800 text-xs font-semibold select-none shrink-0">
                      <span className="text-sm leading-none">🇧🇩</span>
                      <span>+880</span>
                    </div>
                    <input
                      id="operator-reg-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        // Strip leading 0 if typed
                        setPhoneNumber(val.startsWith('0') ? val.slice(1, 11) : val.slice(0, 10));
                      }}
                      className="w-full px-3 py-2 text-sm bg-transparent outline-none font-medium text-slate-900"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <input
                    id="operator-reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all font-medium text-slate-900"
                    required
                  />
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      id="operator-reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    কনফার্ম পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      id="operator-reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-operator-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 py-2.5 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ওটিপি কোড পাঠান</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtpAndCreate} className="space-y-4">
              <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl text-center space-y-0.5">
                <p className="text-xs text-slate-600">
                  নিচের ঠিকানায় ৬-সংখ্যার কোড পাঠানো হয়েছে:
                </p>
                <div className="inline-flex items-center gap-1.5 font-bold text-[#0B3B3C] text-sm">
                  {contactType === 'phone' ? (
                    <Smartphone className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-teal-600" />
                  )}
                  <span>{activeTargetDisplay}</span>
                </div>
              </div>

              {smsNotification && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{smsNotification}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 text-center">
                  ৬-সংখ্যার কোড লিখুন
                </label>
                <div className="relative">
                  <input
                    id="input-operator-register-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-2.5 text-center text-xl font-mono font-bold tracking-[0.35em] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-verify-otp-submit"
                type="submit"
                disabled={isLoading || otpInput.length < 6}
                className="w-full py-2.5 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>যাচাই করে একাউন্ট নিশ্চিত করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setErrorMessage(null);
                    setSmsNotification(null);
                  }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>তথ্য পরিবর্তন</span>
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex items-center gap-1.5 text-[#0B3B3C] hover:underline font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-mono">
                    Resend in {countdown}s
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Switch to Login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              ইতিমধ্যে একাউন্ট আছে?{' '}
              <button
                id="btn-switch-to-operator-login"
                type="button"
                onClick={() => onNavigate('operator-login')}
                className="font-semibold text-[#0B3B3C] hover:underline cursor-pointer"
              >
                লগইন করুন
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
