import React, { useState } from 'react';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, Key, CheckCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface AdminLoginProps {
  onNavigate: (view: string) => void;
  onForgotPassword: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate, onForgotPassword }) => {
  const { login, setupFirstAdmin, hasAdminSetup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'setup'>(!hasAdminSetup ? 'setup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide administrator email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome to the Administrator Control Center', 'success');
      onNavigate('admin-dashboard');
    } catch (err: any) {
      console.error('Admin login failed:', err);
      let msg = err?.message || 'Administrative access denied. Invalid credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid administrator credentials. Please check your details.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName || !email || !password) {
      setError('Please fill in all fields to provision the first administrator.');
      return;
    }

    if (password.length < 8) {
      setError('Administrator password should be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await setupFirstAdmin(email.trim(), password, adminName.trim());
      showToast('Primary administrator account successfully initialized!', 'success');
      onNavigate('admin-dashboard');
    } catch (err: any) {
      console.error('Admin setup error:', err);
      let msg = err.message || 'Failed to initialize administrator account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in directly.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="admin-login-view" className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-100">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Administrator Portal' : 'First-Time Admin Setup'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {mode === 'login'
              ? 'Authorized access for exam coordinators and portal moderators'
              : 'Securely create the primary administrator account for this installation'}
          </p>
        </div>

        {error && (
          <div id="admin-login-error" className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@takamul-portal.org"
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  id="btn-admin-forgot-password"
                  onClick={onForgotPassword}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
                <button
                  id="btn-toggle-admin-password-visibility"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-admin-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Authenticating Admin...' : 'Enter Admin Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleFirstAdminSetup} className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Hardcode Setup:</strong> This guided procedure assigns the master administrator credentials directly into your secure Firebase authentication and admins registry.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Administrator Full Name *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-setup-admin-name"
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="System Controller / Chief Officer"
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Administrator Email *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-setup-admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@portal.gov"
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Master Password (min 8 chars) *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-setup-admin-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure admin password"
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              id="btn-submit-first-admin-setup"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Provisioning First Admin...' : 'Initialize Administrator Account'}
              <CheckCircle className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          {mode === 'login' ? (
            <button
              id="btn-toggle-setup-mode"
              type="button"
              onClick={() => setMode('setup')}
              className="text-xs text-purple-700 font-semibold hover:underline"
            >
              First time deploying? Initialize First Administrator Account →
            </button>
          ) : (
            <button
              id="btn-toggle-login-mode"
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-purple-700 font-semibold hover:underline"
            >
              ← Back to Administrator Sign In
            </button>
          )}

          <div>
            <button
              id="btn-admin-switch-candidate"
              type="button"
              onClick={() => onNavigate('candidate-login')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Are you a candidate? Switch to Candidate Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
