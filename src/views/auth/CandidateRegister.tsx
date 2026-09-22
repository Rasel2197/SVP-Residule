import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface CandidateRegisterProps {
  onNavigate: (view: string) => void;
}

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ onNavigate }) => {
  const { registerCandidate } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('অনুগ্রহ করে First Name এবং Last Name লিখুন।');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('অনুগ্রহ করে Mobile Number লিখুন।');
      return;
    }

    if (!email.trim()) {
      setError('অনুগ্রহ করে Email Address লিখুন।');
      return;
    }

    if (!password) {
      setError('Password লিখুন।');
      return;
    }

    if (password.length < 6) {
      setError('Password কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password এবং Confirm Password মিলছে না। অনুগ্রহ করে যাচাই করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await registerCandidate({
        email: email.trim(),
        password,
        fullName,
        mobileNumber: mobileNumber.trim(),
      });
      showToast(`অভিনন্দন ${fullName}! আপনার প্রার্থী একাউন্ট সফলভাবে তৈরি হয়েছে।`, 'success');
      onNavigate('candidate-dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
      let msg = err.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইল ঠিকানাটি ইতিমধ্যে নিবন্ধিত আছে। অনুগ্রহ করে সরাসরি লগইন করুন।';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="candidate-register-view" className="max-w-xl mx-auto my-8 sm:my-12 px-4">
      <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-50 text-[#0B3B3C] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-teal-100 shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            প্রার্থী সাইন আপ (Candidate Sign Up)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            আপনার বিবরণ দিয়ে সহজে একাউন্ট তৈরি করুন
          </p>
        </div>

        {error && (
          <div id="candidate-register-error" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                First Name (প্রথম নাম) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Tariqul"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Last Name (শেষ নাম / পদবি) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-lastname"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Islam"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Mobile Number & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mobile Number (মোবাইল নম্বর) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-mobile"
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address (ইমেইল) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password (পাসওয়ার্ড) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm Password (কনফার্ম পাসওয়ার্ড) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            id="btn-submit-candidate-register"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#0B3B3C] hover:bg-[#114B4D] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              'Creating Account...'
            ) : (
              <>
                <span>Complete Registration (রেজিস্ট্রেশন সম্পন্ন করুন)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            ইতিমধ্যে একাউন্ট আছে?{' '}
            <button
              id="btn-goto-candidate-login"
              onClick={() => onNavigate('candidate-login')}
              className="text-[#0B3B3C] font-bold hover:underline cursor-pointer"
            >
              লগইন করুন (Sign In Here)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
