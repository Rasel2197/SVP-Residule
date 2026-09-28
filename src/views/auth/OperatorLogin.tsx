import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  User,
  Eye,
  EyeOff,
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
      setErrorMessage('অনুগ্রহ করে ইমেইল বা ইউজারনেম প্রদান করুন।');
      return;
    }
    if (!password) {
      setErrorMessage('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
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
        showToast('লগইন সফল হয়েছে!', 'success');
        onNavigate('operator-dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন।');
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
            ইউজার লগইন
          </h1>
          <p className="text-xs text-slate-500">
            SVP Reschedule & Marksheet Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                ইমেইল বা ইউজারনেম (Email / Username)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="operator-login-email"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="আপনার ইমেইল বা ইউজারনেম"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  পাসওয়ার্ড (Password)
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium text-[#0B3B3C] hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="operator-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড"
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C] transition-all"
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

            <button
              id="btn-operator-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#0B3B3C] hover:bg-[#135153] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>লগইন করুন (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              একাউন্ট নেই?{' '}
              <button
                id="btn-switch-to-operator-register"
                type="button"
                onClick={() => onNavigate('operator-register')}
                className="font-semibold text-[#0B3B3C] hover:underline cursor-pointer"
              >
                নতুন একাউন্ট খুলুন (Sign Up)
              </button>
            </span>

            <button
              onClick={() => onNavigate('candidate-login')}
              className="text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <User className="w-3 h-3 text-slate-400" />
              <span>প্রার্থী পোর্টাল</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
