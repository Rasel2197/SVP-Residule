import React, { useState } from 'react';
import {
  Coins,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Building,
  HelpCircle,
  User,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getAllOperators } from '../../services/apiService';
import { OperatorUser } from '../../types';

interface OperatorLoginProps {
  onNavigate: (view: string) => void;
  onForgotPassword?: () => void;
}

export const OperatorLogin: React.FC<OperatorLoginProps> = ({ onNavigate, onForgotPassword }) => {
  const { login, loginOperatorDirect } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingOperators, setExistingOperators] = useState<OperatorUser[]>([]);

  React.useEffect(() => {
    async function loadOps() {
      try {
        const ops = await getAllOperators();
        setExistingOperators(ops);
      } catch {
        // ignore
      }
    }
    loadOps();
  }, []);

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
      await login(identifier.trim(), password);
      showToast('ইউজার একাউন্টে সফলভাবে লগইন হয়েছে!', 'success');
      onNavigate('operator-dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন ব্যর্থ হয়েছে। আপনার ক্রেডেনশিয়াল চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (op: OperatorUser) => {
    loginOperatorDirect(op);
    showToast(`স্বাগতম ${op.fullName}! বর্তমান ক্রেডিট: ${op.credits}`, 'success');
    onNavigate('operator-dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 mb-1">
            <Coins className="w-8 h-8 text-amber-100" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ইউজার ও অপারেটর লগইন
          </h2>
          <p className="text-sm font-medium text-slate-600">
            SVP Reschedule Operator & Credit Portal
          </p>
        </div>

        {/* Credit System Notice Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <Coins className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">ক্রেডিট সিস্টেম সংক্রান্ত নিয়মাবলী:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li><span className="font-semibold">১ রিশিডিউল (Reschedule)</span> = ১ ক্রেডিট কর্তন</li>
                <li><span className="font-semibold">১ মার্কশিট উত্তোলন</span> = ১ ক্রেডিট কর্তন</li>
                <li>ফ্রি ব্যবহারের সুযোগ নেই; প্রতি অপারেটরের নিজস্ব ব্যালেন্স প্রয়োজন।</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ইউজারনেম / ইমেইল (Username / Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="operator-login-email"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="enter email or username"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  পাসওয়ার্ড (Password)
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="operator-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              id="btn-operator-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md shadow-amber-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>লগইন করুন (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Existing Operators Quick Selection (Convenience for Testing) */}
          {existingOperators.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>বিদ্যমান ইউজার একাউন্ট (Quick Switch):</span>
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {existingOperators.map((op) => (
                  <button
                    key={op.id || op.uid}
                    type="button"
                    onClick={() => handleQuickDemoLogin(op)}
                    className="w-full p-2 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-amber-900">{op.fullName}</p>
                      <p className="text-[11px] text-slate-500">{op.agencyName || op.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {op.credits} Credits
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Operator Sign Up Callout */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-600">
              একাউন্ট নেই? আপনি কি নতুন ইউজার হিসেবে কাজ করতে চান?
            </p>
            <button
              id="btn-switch-to-operator-register"
              type="button"
              onClick={() => onNavigate('operator-register')}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Coins className="w-4 h-4 text-amber-700" />
              <span>নতুন ইউজার সাইন আপ করুন (Create User Account)</span>
            </button>
          </div>

          {/* Admin WhatsApp Support Contact */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-950 text-[11px]">ক্রেডিট কেনা বা সহযোগিতার জন্য:</p>
                <p className="text-emerald-700 text-[10px]">সরাসরি এডমিনের সাথে WhatsApp এ যোগাযোগ করুন</p>
              </div>
            </div>
            <a
              href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20e%20user%20account%20ba%20credit%20somporke%20kotha%20bolte%20chai."
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] whitespace-nowrap transition-colors shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>01305-894384</span>
            </a>
          </div>
        </div>

        {/* Portal Switcher Footer */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          <button
            onClick={() => onNavigate('candidate-login')}
            className="hover:text-slate-800 hover:underline flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>প্রার্থী লগইন (Candidate Login)</span>
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('admin-login')}
            className="hover:text-slate-800 hover:underline flex items-center gap-1"
          >
            <Building className="w-3.5 h-3.5 text-teal-700" />
            <span>অ্যাডমিন পোর্টাল (Admin Portal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
