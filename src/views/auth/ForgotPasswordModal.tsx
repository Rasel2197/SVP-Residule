import React, { useState } from 'react';
import { Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
      showToast('Password reset link dispatched to your email.', 'success');
    } catch (err: any) {
      console.error('Password reset failed:', err);
      let msg = err.message || 'Unable to dispatch reset link.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No registered candidate or administrator found with that email address.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="forgot-password-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900">Reset Portal Password</h3>
        <p className="text-xs text-slate-600 mt-1">
          Provide your registered account email address to receive password recovery instructions.
        </p>

        {success ? (
          <div className="my-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">Reset Email Dispatched</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, a secure password reset link has been dispatched. Check your inbox and spam folder.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
