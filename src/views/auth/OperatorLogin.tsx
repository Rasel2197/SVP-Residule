import React, { useState } from 'react';
import {
  Coins,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
  Shield,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface OperatorLoginProps {
  onNavigate: (view: string) => void;
  onForgotPassword?: () => void;
}

export const OperatorLogin: React.FC<OperatorLoginProps> = ({ onNavigate, onForgotPassword }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('অনুগ্রহ করে ইউজারনেম বা ইমেইল লিখুন (Please enter email/username).');
      return;
    }
    if (!password) {
      setErrorMessage('পাসওয়ার্ড লিখুন (Please enter password).');
      return;
    }

    setIsLoading(true);
    try {
      const loggedInRole = await login(identifier.trim(), password);
      if (loggedInRole === 'admin') {
        showToast('সুপার অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে!', 'success');
        onNavigate('admin-dashboard');
      } else if (loggedInRole === 'candidate') {
        showToast('প্রার্থী পোর্টালে সফলভাবে লগইন হয়েছে!', 'success');
        onNavigate('candidate-dashboard');
      } else {
        showToast('ইউজার একাউন্টে সফলভাবে লগইন হয়েছে!', 'success');
        onNavigate('operator-dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন ব্যর্থ হয়েছে। আপনার ক্রেডেনশিয়াল চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] relative flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-teal-500/15 via-amber-500/10 to-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative max-w-md w-full space-y-6 z-10">
        {/* Premium Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-teal-500 rounded-3xl blur-md opacity-40 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300/40">
              <Coins className="w-8 h-8 fill-slate-950/20" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Official Takamul Operator Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ইউজার ও অপারেটর লগইন
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              SVP Reschedule & Marksheet Management Portal
            </p>
          </div>
        </div>

        {/* Executive Credit Rules Widget */}
        <div className="bg-slate-900/80 border border-amber-500/25 rounded-2xl p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                ক্রেডিট নীতি ও রেটকার্ড
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>100% সুরক্ষিত</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">রিশিডিউল (Reschedule)</p>
                <p className="text-xs font-bold text-amber-300">১ ক্রেডিট / প্রার্থী</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-500/15 rounded-lg text-teal-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">মার্কশিট (Marksheet)</p>
                <p className="text-xs font-bold text-teal-300">১ ক্রেডিট / প্রার্থী</p>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-amber-200/80">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>প্রার্থীর পাসওয়ার্ড ও ওটিপি ভেরিফিকেশন উভয় সেবায় বাধ্যতামূলক।</span>
          </div>
        </div>

        {/* Luxury Glassmorphic Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                ইউজারনেম / ইমেইল (Username / Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="operator-login-email"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="আপনার ইমেইল বা ইউজারনেম লিখুন"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:bg-slate-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  পাসওয়ার্ড (Password)
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="operator-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:bg-slate-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-operator-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>লগইন করুন (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* New User Account Callout */}
          <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">
              একাউন্ট নেই? আপনি কি নতুন ইউজার হিসেবে কাজ করতে চান?
            </p>
            <button
              id="btn-switch-to-operator-register"
              type="button"
              onClick={() => onNavigate('operator-register')}
              className="w-full py-2.5 px-4 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>নতুন ইউজার সাইন আপ করুন (Create User Account)</span>
            </button>
          </div>

          {/* VIP WhatsApp Support Contact */}
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <p className="font-bold text-emerald-300 text-[11px]">ক্রেডিট রিচার্জ হেল্পডেস্ক:</p>
                </div>
                <p className="text-emerald-400/80 text-[10px]">সরাসরি এডমিনের সাথে WhatsApp এ যোগাযোগ</p>
              </div>
            </div>
            <a
              href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20e%20user%20account%20ba%20credit%20somporke%20kotha%20bolte%20chai."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] whitespace-nowrap transition-colors shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1"
            >
              <span>01305-894384</span>
            </a>
          </div>
        </div>

        {/* Portal Switcher Footer */}
        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onNavigate('candidate-login')}
            className="hover:text-amber-400 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>প্রার্থী পোর্টাল (Candidate Portal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

