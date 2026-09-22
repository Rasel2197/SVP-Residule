import React from 'react';
import { User, CreditCard, Phone, Mail, Wrench, Calendar, ShieldCheck, ArrowLeft, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/rules';

interface CandidateProfileProps {
  onNavigate: (view: string) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({ onNavigate }) => {
  const { candidate, currentUser } = useAuth();

  return (
    <div id="candidate-profile-view" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <button
          onClick={() => onNavigate('candidate-dashboard')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate Profile Record</h1>
        <p className="text-sm text-slate-600 mt-1">
          Registered identity, passport identification, and enrolled trade assessment track.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
              {candidate?.fullName ? candidate.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold">{candidate?.fullName || 'Candidate Profile'}</h2>
              <p className="text-xs text-slate-300 font-mono">Candidate ID: {candidate?.candidateId || 'N/A'}</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Profile
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Full Legal Name</span>
              <strong className="text-slate-900 text-base">{candidate?.fullName || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Candidate Tracking ID</span>
              <strong className="text-slate-900 font-mono text-base">{candidate?.candidateId || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Passport Number</span>
              <strong className="text-slate-900 font-mono text-base">{candidate?.passportNumber || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Registered Mobile</span>
              <strong className="text-slate-900 text-base">{candidate?.mobileNumber || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Primary Email</span>
              <strong className="text-slate-900 text-base">{candidate?.email || currentUser?.email || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Assessed Trade</span>
              <strong className="text-slate-900 text-base">{candidate?.trade || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Date of Birth</span>
              <strong className="text-slate-900 text-base">{formatDate(candidate?.dateOfBirth)}</strong>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Assigned Examination Date</span>
              <strong className="text-slate-900 text-base">{formatDate(candidate?.examDate)}</strong>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Security Record: Candidate PII is protected and read-only for security integrity.</span>
          <span>Enrolled: {formatDate(candidate?.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
