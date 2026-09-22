import React from 'react';
import { Calendar, Building2, Wrench, Clock, ShieldAlert, CheckCircle2, ArrowLeft, AlertCircle, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkThreeDayCutoff, formatDate } from '../../utils/rules';
import { StatusBadge } from '../../components/StatusBadge';

interface CandidateExamDetailsProps {
  onNavigate: (view: string) => void;
}

export const CandidateExamDetails: React.FC<CandidateExamDetailsProps> = ({ onNavigate }) => {
  const { candidate } = useAuth();
  const cutoff = candidate?.examDate ? checkThreeDayCutoff(candidate.examDate) : null;
  const isCutoffLocked = cutoff ? !cutoff.allowed : false;

  return (
    <div id="candidate-exam-details-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('candidate-dashboard')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examination Schedule & Venue Dossier</h1>
        <p className="text-sm text-slate-600 mt-1">
          Review designated assessment timings, allocated testing facility protocols, and examination instructions.
        </p>
      </div>

      {/* 3-Day Rule Status Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          isCutoffLocked
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {isCutoffLocked ? (
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isCutoffLocked ? 'Schedule Frozen (Less than 3 Days Away)' : 'Rescheduling Window Available'}
              </h3>
              {cutoff && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white/80 rounded-md">
                  {cutoff.daysRemaining} days remaining
                </span>
              )}
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              {isCutoffLocked
                ? 'Exam date change is no longer available because the exam is less than 3 days away. Test materials and proctor rosters have been finalized.'
                : `Rescheduling requests are accepted until ${cutoff?.cutoffDateStr} (3 full days prior to test date).`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Schedule Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Booking Status</span>
            <div className="mt-1">
              <StatusBadge status={candidate?.examStatus || 'UPCOMING'} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidate ID</span>
            <p className="text-base font-mono font-extrabold text-slate-900 mt-1">
              {candidate?.candidateId || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Date & Time */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Assigned Date & Timetable</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              {formatDate(candidate?.examDate)}
            </p>
            <p className="text-xs text-slate-600">Standard Morning Testing Session (09:00 AM - 01:00 PM)</p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('candidate-change-date')}
                disabled={isCutoffLocked || candidate?.examStatus !== 'UPCOMING'}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Request Rescheduling →
              </button>
            </div>
          </div>

          {/* Center */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Assigned Examination Center</span>
            </div>
            <p className="text-base font-extrabold text-slate-900 leading-snug">
              {candidate?.examCenter || 'Center Allocation Pending'}
            </p>
            <p className="text-xs text-slate-600">Accredited Testing & Workshop Facility</p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('candidate-change-center')}
                disabled={isCutoffLocked || candidate?.examStatus !== 'UPCOMING'}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Request Relocation →
              </button>
            </div>
          </div>
        </div>

        {/* Trade Info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Trade Assessment Standard</span>
            <h4 className="text-sm font-bold text-slate-900">{candidate?.trade}</h4>
            <p className="text-xs text-slate-600 mt-1">
              Assessment comprises two stages: 1-hour computer-based theoretical regulations examination and 3-hour hands-on technical workshop practical.
            </p>
          </div>
        </div>

        {/* Essential Candidate Exam Instructions */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-500" />
            Mandatory Examination Day Guidelines
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-5">
            <li>Candidates must arrive at the testing center at least <strong>45 minutes</strong> prior to the examination start time.</li>
            <li>You must present your <strong>original physical passport</strong> (Number: <span className="font-mono font-bold">{candidate?.passportNumber}</span>) and this booking confirmation at the security check-in desk.</li>
            <li>Appropriate personal protective equipment (PPE) including steel-toed work boots is mandatory for the workshop practical phase.</li>
            <li>Electronic mobile devices, smart watches, and unauthorized literature are strictly forbidden in examination bays.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
