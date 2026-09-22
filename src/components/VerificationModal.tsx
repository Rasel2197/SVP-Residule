import React, { useState } from 'react';
import {
  X,
  Search,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  User,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { getMarksheetByReferenceId, searchCandidates } from '../services/apiService';
import { Marksheet, Candidate } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  initialTab?: 'certificate' | 'result';
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  initialTab = 'certificate',
  onClose,
}) => {
  const [tab, setTab] = useState<'certificate' | 'result'>(initialTab);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [marksheetResult, setMarksheetResult] = useState<Marksheet | null>(null);
  const [candidateResult, setCandidateResult] = useState<Candidate | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsLoading(true);
    setSearched(true);
    setErrorMessage('');
    setMarksheetResult(null);
    setCandidateResult(null);

    try {
      if (tab === 'certificate') {
        const ms = await getMarksheetByReferenceId(clean);
        if (ms) {
          setMarksheetResult(ms);
        } else {
          setErrorMessage(`No accredited certificate found matching Reference ID or Candidate ID "${clean}".`);
        }
      } else {
        // Applicant result check: search by candidateId or passport
        const candidates = await searchCandidates(clean);
        if (candidates.length > 0) {
          setCandidateResult(candidates[0]);
          // Also try to find candidate marksheet
          const ms = await getMarksheetByReferenceId(candidates[0].candidateId);
          if (ms) setMarksheetResult(ms);
        } else {
          // If no candidate directly matched, try searching marksheet directly
          const ms = await getMarksheetByReferenceId(clean);
          if (ms) {
            setMarksheetResult(ms);
          } else {
            setErrorMessage(`No candidate registration record found matching "${clean}".`);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage('Verification lookup service encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="verification-modal-card"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with authentic deep teal SVP styling */}
        <div className="bg-[#0B3B3C] text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {tab === 'certificate' ? 'Official Certificate Verification' : 'Applicant Result Status'}
                </h3>
                <p className="text-xs text-teal-200/80">
                  Skills Verification Program • Professional Accreditation (الاعتماد المهني)
                </p>
              </div>
            </div>

            <button
              id="btn-close-verification-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 border-b border-teal-700/60 pb-1">
            <button
              id="tab-certificate-verification"
              onClick={() => {
                setTab('certificate');
                setSearched(false);
                setErrorMessage('');
                setMarksheetResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold transition-all relative ${
                tab === 'certificate'
                  ? 'text-white border-b-2 border-white'
                  : 'text-teal-200/70 hover:text-white'
              }`}
            >
              Certificate Verification
            </button>
            <button
              id="tab-applicant-result"
              onClick={() => {
                setTab('result');
                setSearched(false);
                setErrorMessage('');
                setCandidateResult(null);
                setMarksheetResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold transition-all relative ${
                tab === 'result'
                  ? 'text-white border-b-2 border-white'
                  : 'text-teal-200/70 hover:text-white'
              }`}
            >
              Applicant Result
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {tab === 'certificate'
                ? 'Enter Certificate Reference ID or Candidate ID'
                : 'Enter Candidate ID or Passport Number'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-verification-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    tab === 'certificate'
                      ? 'e.g., TK-CERT-2026-94812 or TK-2026-001'
                      : 'e.g., TK-2026-001 or Passport Number'
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent"
                />
              </div>
              <button
                id="btn-run-verification-search"
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 bg-[#0B3B3C] hover:bg-[#114B4D] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Verify
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {tab === 'certificate'
                ? 'Tip: Test with demo certificate reference or registered candidate IDs (e.g., TK-2026-001).'
                : 'Check live status of completed or upcoming skill tests.'}
            </p>
          </form>

          {/* Results Area */}
          {searched && (
            <div className="pt-2">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Record Not Found</p>
                    <p className="mt-0.5 text-amber-800">{errorMessage}</p>
                    <p className="mt-2 text-[11px] text-amber-700">
                      Please ensure the ID was typed accurately. If you are testing, sign in to the Admin Portal and click "Load Demo Seed Data" to populate verified test records.
                    </p>
                  </div>
                </div>
              )}

              {/* Marksheet / Certificate View */}
              {marksheetResult && (
                <div className="bg-slate-50 border-2 border-teal-600/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0B3B3C] text-white flex items-center justify-center">
                        <Award className="w-4 h-4 text-teal-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-teal-800 uppercase">
                          Authentic Accreditation Record
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {marksheetResult.candidateName}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-extrabold rounded-md ${
                        marksheetResult.resultStatus === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {marksheetResult.resultStatus === 'PASS' ? 'COMPETENT / PASS' : 'DID NOT MEET / FAIL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Candidate ID</span>
                      <p className="font-mono font-bold text-slate-800">{marksheetResult.candidateId}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Trade Specialization</span>
                      <p className="font-bold text-slate-800">{marksheetResult.trade}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Certificate Ref</span>
                      <p className="font-mono font-bold text-[#0B3B3C] text-[11px] truncate" title={marksheetResult.referenceId}>
                        {marksheetResult.referenceId}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Theory Exam</span>
                      <p className="font-bold text-slate-800">{marksheetResult.theoryMarks} / 40</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Practical Assessment</span>
                      <p className="font-bold text-slate-800">{marksheetResult.practicalMarks} / 60</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">Aggregate Score</span>
                      <p className="font-bold text-emerald-700">
                        {marksheetResult.totalMarks} / {marksheetResult.maxMarks || 100} ({Math.round((marksheetResult.totalMarks / (marksheetResult.maxMarks || 100)) * 100)}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <span>Issued Date: {marksheetResult.issueDate}</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified by Takamol Accreditation Board
                    </span>
                  </div>
                </div>
              )}

              {/* Candidate Info without marksheet yet */}
              {candidateResult && !marksheetResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        Applicant Record Found
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{candidateResult.fullName}</h4>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      {candidateResult.examStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500">Candidate ID</span>
                      <p className="font-mono font-bold text-slate-800">{candidateResult.candidateId}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500">Trade</span>
                      <p className="font-bold text-slate-800">{candidateResult.trade}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500">Exam Date</span>
                      <p className="font-bold text-slate-800">{candidateResult.examDate || 'Pending Assignment'}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500">Assigned Center</span>
                      <p className="font-bold text-slate-800">{candidateResult.examCenter || 'Assigned Center'}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Official assessment marksheet has not yet been issued for this candidate. Results are updated immediately upon examiner submission.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-[11px]">
            <QrCode className="w-4 h-4 text-[#0B3B3C]" />
            <span>Encrypted Verification Registry</span>
          </div>
          <button
            id="btn-dismiss-verification-modal"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
