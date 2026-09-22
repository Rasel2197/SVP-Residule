import React, { useState } from 'react';
import {
  Shield,
  User,
  Calendar,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  Award,
  Users,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomeProps {
  onNavigate: (view: string) => void;
  onOpenVerification?: (tab: 'certificate' | 'result') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenVerification }) => {
  const { currentUser, isAdmin, isCandidate, isOperator } = useAuth();
  const [quickRefId, setQuickRefId] = useState('');

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenVerification) {
      onOpenVerification('certificate');
    }
  };

  return (
    <div id="home-view" className="space-y-12">
      {/* 
        HERO SECTION: Deep Teal (#0B3B3C) Color Combination with Fluid Wing Background
      */}
      <section className="relative bg-[#0B3B3C] text-white overflow-hidden min-h-[460px] flex items-center border-b border-[#145658]">
        {/* Decorative Curves from Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute right-0 bottom-0 w-full md:w-[70%] h-full opacity-35"
            viewBox="0 0 1000 600"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M300,600 C450,450 650,350 1000,200 L1000,600 Z"
              fill="#135254"
            />
            <path
              d="M150,600 C380,480 620,280 1000,100 L1000,600 Z"
              fill="#176366"
              opacity="0.4"
            />
            <path
              d="M400,600 C580,520 780,380 1000,250 L1000,600 Z"
              fill="#1F787C"
              opacity="0.3"
            />
          </svg>
          <div className="absolute left-1/4 top-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10 w-full">
          <div className="max-w-2xl lg:max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-200 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>Independent Skill Verification Portal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Takamul Candidate Portal
            </h1>

            <p className="text-base sm:text-lg text-teal-50/90 leading-relaxed font-normal max-w-2xl">
              Professional examination scheduling, automated 3-day cutoff validation, examination center transfers, and official marksheet verification.
            </p>

            {/* Action Buttons styled with the white pill and deep teal combination */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              {currentUser ? (
                <button
                  id="btn-hero-goto-dashboard"
                  onClick={() =>
                    onNavigate(
                      isAdmin
                        ? 'admin-dashboard'
                        : isOperator
                        ? 'operator-dashboard'
                        : 'candidate-dashboard'
                    )
                  }
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-[#0B3B3C] font-bold text-sm rounded-md shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  Go to {isAdmin ? 'Admin Dashboard' : isOperator ? 'Operator Dashboard' : 'Candidate Dashboard'}
                  <ArrowRight className="w-4 h-4 text-[#0B3B3C]" />
                </button>
              ) : (
                <>
                  <button
                    id="btn-hero-operator-login"
                    onClick={() => onNavigate('operator-login')}
                    className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm rounded-md shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Coins className="w-4 h-4 text-amber-900" />
                    ইউজার / ক্রেডিট লগইন (Operator)
                    <ArrowRight className="w-4 h-4 text-amber-950" />
                  </button>

                  <button
                    id="btn-hero-candidate-login"
                    onClick={() => onNavigate('candidate-login')}
                    className="px-6 py-3.5 bg-white hover:bg-slate-100 text-[#0B3B3C] font-bold text-sm rounded-md shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#0B3B3C]" />
                    Candidate Sign In (প্রার্থী লগইন)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 
        SERVICES & QUICK VERIFICATION
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Quick Marksheet & Certificate Verification Card */}
        <div className="bg-white rounded-2xl border border-teal-900/10 shadow-sm p-6 sm:p-8 -mt-10 relative z-20 bg-linear-to-r from-white via-teal-50/20 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B3B3C]/10 text-[#0B3B3C]">
                <Award className="w-3.5 h-3.5 text-[#0B3B3C]" />
                Official Accreditation Search
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Verify Marksheet & Exam Result
              </h3>
              <p className="text-xs text-slate-500">
                Enter your Certificate Reference ID or Candidate ID (e.g., TK-2026-001) to verify official results.
              </p>
            </div>

            <form onSubmit={handleQuickVerify} className="flex-1 max-w-xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-home-quick-verify"
                  type="text"
                  value={quickRefId}
                  onChange={(e) => setQuickRefId(e.target.value)}
                  placeholder="e.g. TK-CERT-2026-94812 or TK-2026-001"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#0B3B3C] hover:bg-[#114B4D] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                Verify Now
              </button>
            </form>
          </div>
        </div>

        {/* 
          KEY FUNCTIONAL PILLARS
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-[#0B3B3C]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0B3B3C] flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 text-[#0B3B3C]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Enforced 3-Day Cutoff Policy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Examination date changes must occur at least 72 hours before scheduled testing times. Any requests submitted within the cutoff window require formal supervisor approval.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-[#0B3B3C]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0B3B3C] flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6 text-[#0B3B3C]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Accredited Testing Centers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time seat capacity tracking prevents overbooking. Candidates can submit center relocation requests subject to seat availability and administrative review.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-[#0B3B3C]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0B3B3C] flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-[#0B3B3C]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Official Marksheet & A4 PDF</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent grading breakdown for Theory (out of 40) and Practical (out of 60) components, automatic pass/fail determinations, and instant printable PDF transcripts.
            </p>
          </div>
        </div>

        {/* Official Portal Footer with Subtle Admin Entrance */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Takamul Skill Verification & Examination Services. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenVerification?.('certificate')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Verify Certificate
            </button>
            <button
              onClick={() => onOpenVerification?.('result')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Verify Result
            </button>
            <button
              id="link-footer-admin"
              onClick={() => onNavigate('admin-login')}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              title="Authorized Personnel Only"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
