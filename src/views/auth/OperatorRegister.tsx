import React, { useState } from 'react';
import {
  Coins,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  MessageCircle,
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

    // Validate fields
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার First Name এবং Last Name লিখুন।');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('অনুগ্রহ করে সঠিক ইমেইল বা ইউজারনেম দিন।');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।');
      return;
    }

    if (!password) {
      setErrorMessage('পাসওয়ার্ড লিখুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না। অনুগ্রহ করে যাচাই করুন।');
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

      showToast(`অভিনন্দন ${fullName}! আপনার ইউজার একাউন্ট সফলভাবে নিবন্ধিত হয়েছে।`, 'success');
      onNavigate('operator-dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-xl w-full space-y-6">
        {/* Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 mb-1">
            <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-amber-100" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            নতুন ইউজার সাইন আপ (User / Agency Sign Up)
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            রিশিডিউল ও মার্কশিট সেবা প্রদানের জন্য আপনার প্রফেশনাল ইউজার একাউন্ট তৈরি করুন
          </p>
        </div>

        {/* Informational Coin Policy Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">কয়েন / ক্রেডিট সংক্রান্ত নির্দেশনা:</p>
              <p className="text-amber-800 leading-relaxed">
                সাইন আপ করার পর আপনার প্রোফাইল তৈরি হবে। আপনার নাম ও নম্বর সংরক্ষিত থাকবে যাতে আপনি চাহিদামতো অ্যাডমিনের কাছ থেকে কয়েন/ক্রেডিট কিনে আপনার একাউন্টে যোগ করে নিতে পারেন।
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-900">ক্রেডিট কেনা বা যেকোনো প্রশ্নে এডমিন হেল্পলাইন:</span>
            <a
              href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20e%20notun%20user%20hisebe%20sign%20up%20korchi%20ebong%20credit%20kitte%20chai."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
              <span>WhatsApp: 01305-894384</span>
            </a>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-5 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name (প্রথম নাম) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Md. Faruk"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name (পদবি বা শেষ নাম) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Hossain"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone Number & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  মোবাইল নম্বর (Phone Number) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ইমেইল (Email Address) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  পাসওয়ার্ড (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  কনফার্ম পাসওয়ার্ড (Confirm Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="operator-reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-operator-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-600/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>সাইন আপ সম্পন্ন করুন (Create Account)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              ইতিমধ্যে একাউন্ট আছে?{' '}
              <button
                id="btn-switch-to-operator-login"
                type="button"
                onClick={() => onNavigate('operator-login')}
                className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                এখানে লগইন করুন (Sign In)
              </button>
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
          <button
            onClick={() => onNavigate('candidate-login')}
            className="hover:text-slate-800 hover:underline flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>প্রার্থী লগইন (Candidate Login)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
