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
  CreditCard,
  Wrench,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ALL_TAKAMUL_TRADES, BANGLADESH_TAKAMUL_TTCS } from '../../data/bangladeshTTCs';

interface CandidateRegisterProps {
  onNavigate: (view: string) => void;
}

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ onNavigate }) => {
  const { registerCandidate } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [examDate, setExamDate] = useState('2026-10-03');
  const [trade, setTrade] = useState(ALL_TAKAMUL_TRADES[0] || 'Electrical Installation');
  const [examCenter, setExamCenter] = useState(BANGLADESH_TAKAMUL_TTCS[0]?.name || 'Bangladesh-Korea Technical Training Centre (BKTTC), Mirpur, Dhaka');
  const [dateOfBirth, setDateOfBirth] = useState('1996-01-15');
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
    if (!fullName.trim()) {
      setError('অনুগ্রহ করে পাসপোর্টের সাথে মিল রেখে সম্পূর্ণ নাম লিখুন।');
      return;
    }

    if (!passportNumber.trim()) {
      setError('অনুগ্রহ করে আপনার পাসপোর্ট নম্বর লিখুন (যেমন: A09012936)।');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('অনুগ্রহ করে মোবাইল নম্বর লিখুন।');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }

    if (!password) {
      setError('পাসওয়ার্ড লিখুন।');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    setIsLoading(true);
    try {
      await registerCandidate({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        passportNumber: passportNumber.trim().toUpperCase(),
        candidateId: ticketNumber.trim() || undefined,
        nationalId: nationalId.trim(),
        trade,
        examCenter,
        examDate,
        dateOfBirth,
        mobileNumber: mobileNumber.trim(),
      });
      showToast(`স্বাগতম ${fullName}! আপনার আসল তাকামুল প্রার্থী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`, 'success');
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
    <div id="candidate-register-view" className="max-w-2xl mx-auto my-8 sm:my-12 px-4">
      <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-50 text-[#0B3B3C] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-teal-100 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-[#0e8a75]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            প্রার্থী রেজিস্ট্রেশন (Takamul SVPI Candidate Sign Up)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            আপনার আসল পাসপোর্ট, এনআইডি ও ট্রেড তথ্য দিয়ে সরাসরি রিয়েল প্রোফাইল তৈরি করুন
          </p>
        </div>

        {error && (
          <div id="candidate-register-error" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Legal Name (পাসপোর্ট অনুযায়ী সম্পূর্ণ নাম) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="যেমন: MD MITUL HOSEN"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-semibold"
              />
            </div>
          </div>

          {/* Passport & Ticket & NID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Passport Number (পাসপোর্ট নম্বর) *
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-passport"
                  type="text"
                  required
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  placeholder="যেমন: A09012936"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Test Ticket / ক্যান্ডিডেট আইডি
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-ticket"
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="যেমন: 5841823 (স্লিপ অনুযায়ী)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                National ID (জাতীয় পরিচয়পত্র)
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-nid"
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  placeholder="যেমন: 9179075925"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Trade & Examination TTC Center */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assessed Trade (পেশা / ট্রেড) *
              </label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="input-reg-trade"
                  required
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-medium"
                >
                  {ALL_TAKAMUL_TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Date of Birth (জন্ম তারিখ) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preferred / Assigned Examination TTC & Exam Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assigned Examination TTC (পরীক্ষা কেন্দ্র) *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="input-reg-center"
                  required
                  value={examCenter}
                  onChange={(e) => setExamCenter(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-medium"
                >
                  {BANGLADESH_TAKAMUL_TTCS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirmed Exam Date (পরীক্ষার তারিখ)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-examdate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-medium"
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
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-mobile"
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="যেমন: 01712345678"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Takamul Registration Email (ইমেইল ঠিকানা) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="যেমন: candidate@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent transition-all"
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
              'Creating Real Profile...'
            ) : (
              <>
                <span>রেজিস্ট্রেশন সম্পন্ন করুন (Create Real Profile)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            ইতিমধ্যে Takamul একাউন্ট আছে?{' '}
            <button
              id="btn-goto-candidate-login"
              onClick={() => onNavigate('candidate-login')}
              className="text-[#0B3B3C] font-bold hover:underline cursor-pointer"
            >
              সরাসরি লগইন করুন (Sign In Here)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
