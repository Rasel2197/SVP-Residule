import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  User,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface OperatorRegisterProps {
  onNavigate: (view: string) => void;
}

export const OperatorRegister: React.FC<OperatorRegisterProps> = ({ onNavigate }) => {
  const { registerOperator } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('অনুগ্রহ করে First Name এবং Last Name প্রদান করুন।');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('সঠিক ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage('মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    if (!password) {
      setErrorMessage('পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await registerOperator({
        email: email.trim().toLowerCase(),
        password,
        fullName,
        phoneNumber: phoneNumber.trim(),
        agencyName: 'General Agency',
      });

      showToast(`স্বাগতম, ${fullName}! আপনার একাউন্ট তৈরি হয়েছে।`, 'success');
      onNavigate('operator-dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0B3B3C] text-white flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-6 h-6 text-teal-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            নতুন একাউন্ট সাইন আপ
          </h1>
          <p className="text-xs text-slate-500">
            SVP Reschedule & Marksheet Portal
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="operator-reg-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="নামের প্রথম অংশ"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="operator-reg-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="পদবি বা শেষ অংশ"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                মোবাইল নম্বর (Phone)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="operator-reg-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                ইমেইল (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="operator-reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                  required
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="operator-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  কনফার্ম পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="operator-reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় লিখুন"
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
              className="w-full mt-2 py-3 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>সাইন আপ করুন (Create Account)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              ইতিমধ্যে একাউন্ট আছে?{' '}
              <button
                id="btn-switch-to-operator-login"
                type="button"
                onClick={() => onNavigate('operator-login')}
                className="font-semibold text-[#0B3B3C] hover:underline cursor-pointer"
              >
                লগইন করুন (Sign In)
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
