import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  FileCheck2,
  Search,
  Calendar,
  Building2,
  FileText,
  History,
  CheckCircle2,
  Clock,
  Coins,
  PlusCircle,
  Users,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenVerification?: (tab: 'certificate' | 'result') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenVerification,
}) => {
  const {
    currentUser,
    userProfile,
    candidate,
    operator,
    isAdmin,
    isCandidate,
    isOperator,
    operatorCredits,
    logout,
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestsDropdownOpen, setRequestsDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const requestsRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (requestsRef.current && !requestsRef.current.contains(event.target as Node)) {
        setRequestsDropdownOpen(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setRequestsDropdownOpen(false);
    setLoginDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B3B3C] text-white border-b border-[#145658] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Brand Logo & Title with Deep Teal Palette */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <button
              id="brand-logo-btn"
              onClick={() =>
                handleNavClick(
                  isAdmin
                    ? 'admin-dashboard'
                    : isOperator
                    ? 'operator-dashboard'
                    : isCandidate
                    ? 'candidate-dashboard'
                    : 'home'
                )
              }
              className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer min-w-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-all shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-sm sm:text-lg tracking-tight text-white uppercase truncate">
                    SVP RESCHEDULE
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-teal-800/80 text-teal-200 border border-teal-600/60 rounded shrink-0">
                    PORTAL
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-teal-200/80 font-medium truncate hidden xs:block">
                  Skill Verification Program (তাকামুল)
                </span>
              </div>
            </button>

            {/* Desktop Navigation for Logged-In Candidates */}
            {isCandidate && (
              <div className="hidden lg:flex items-center gap-2 text-xs pt-0.5">
                <span className="px-3 py-1 bg-white/10 border border-white/15 text-teal-100 rounded-full font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Candidate Dashboard (প্রার্থী পোর্টাল)
                </span>
              </div>
            )}

            {/* Desktop Navigation for Operators / Users */}
            {isOperator && (
              <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold pt-0.5">
                <button
                  id="nav-operator-dash"
                  onClick={() => handleNavClick('operator-dashboard')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'operator-dashboard'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-300" />
                  <span>অপারেটর ড্যাশবোর্ড (Workstation)</span>
                </button>
              </nav>
            )}

            {/* Desktop Navigation for Admins */}
            {isAdmin && (
              <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold pt-0.5">
                <button
                  id="nav-admin-dash"
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-dashboard'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  id="nav-admin-operators"
                  onClick={() => handleNavClick('admin-operators')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    currentView === 'admin-operators'
                      ? 'bg-amber-400 text-amber-950 font-bold'
                      : 'text-amber-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Users & Credits</span>
                </button>

                <button
                  id="nav-admin-candidates"
                  onClick={() => handleNavClick('admin-candidates')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-candidates'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Candidates
                </button>

                <button
                  id="nav-admin-dates"
                  onClick={() => handleNavClick('admin-exam-dates')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-exam-dates'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Dates
                </button>

                <button
                  id="nav-admin-centers"
                  onClick={() => handleNavClick('admin-exam-centers')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-exam-centers'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Centers
                </button>

                <button
                  id="nav-admin-marksheets"
                  onClick={() => handleNavClick('admin-marksheets')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-marksheets'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Marksheets
                </button>

                {/* Change Requests Dropdown */}
                <div className="relative" ref={requestsRef}>
                  <button
                    id="nav-admin-requests-btn"
                    onClick={() => setRequestsDropdownOpen(!requestsDropdownOpen)}
                    className={`py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      currentView.includes('requests')
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-teal-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>Requests</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {requestsDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => handleNavClick('admin-date-requests')}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-[#0B3B3C]"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#0B3B3C]" />
                        <span>Date Change Requests</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('admin-center-requests')}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-[#0B3B3C]"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#0B3B3C]" />
                        <span>Center Change Requests</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  id="nav-admin-audit"
                  onClick={() => handleNavClick('admin-audit-logs')}
                  className={`py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'admin-audit-logs'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-teal-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Audit
                </button>
              </nav>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Operator Credit Pill */}
                {isOperator && (
                  <button
                    onClick={() => handleNavClick('operator-dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/90 hover:bg-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    title="Current Credit Balance"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{operatorCredits} Credits</span>
                  </button>
                )}

                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    {isAdmin ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-teal-800 text-teal-100 rounded border border-teal-600">
                        Admin
                      </span>
                    ) : isOperator ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-900 text-amber-200 rounded border border-amber-600">
                        User/Operator
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-teal-800 text-teal-100 rounded border border-teal-600 font-mono">
                        {candidate?.candidateId || 'Candidate'}
                      </span>
                    )}
                    <span className="truncate max-w-[130px]">
                      {candidate?.fullName || operator?.fullName || userProfile?.fullName || currentUser.email?.split('@')[0]}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-desktop-logout"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800/80 hover:bg-teal-700/80 border border-teal-600/60 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-teal-200" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  id="btn-nav-candidate-login"
                  onClick={() => handleNavClick('candidate-login')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    currentView === 'candidate-login'
                      ? 'bg-white text-[#0B3B3C] font-bold shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-200" />
                  <span className="hidden xs:inline">প্রার্থী লগইন</span>
                  <span className="xs:hidden">প্রার্থী</span>
                </button>

                <button
                  id="btn-nav-operator-login"
                  onClick={() => handleNavClick('operator-login')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    currentView === 'operator-login' || currentView === 'operator-register'
                      ? 'bg-white text-[#0B3B3C] font-bold shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span className="hidden xs:inline">ইউজার লগইন</span>
                  <span className="xs:hidden">ইউজার</span>
                </button>

                <a
                  id="btn-nav-whatsapp-help"
                  href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20er%20operator.%20Amar%20credit%20kitte%20chai."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/40 transition-all cursor-pointer shadow-xs"
                  title="এডমিনের সাথে WhatsApp এ যোগাযোগ করুন"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                  <span>WhatsApp: 01305-894384</span>
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle (Only for logged-in users) */}
          {currentUser && (
            <div className="flex md:hidden items-center gap-2">
              {isOperator && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-950 font-black text-[11px] rounded-lg">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{operatorCredits} Cr</span>
                </span>
              )}

              <button
                id="btn-mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-teal-100 hover:text-white hover:bg-teal-800/50 rounded-lg transition-colors cursor-pointer"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {currentUser && mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t border-[#145658] bg-[#0B3B3C] px-4 pt-3 pb-6 space-y-4">
          <div className="p-3 bg-teal-900/60 rounded-xl border border-teal-700/60">
            <p className="text-xs text-teal-200">Active Account</p>
            <p className="text-sm font-bold text-white">
              {candidate?.fullName || operator?.fullName || userProfile?.fullName || currentUser.email}
            </p>
            <p className="text-xs text-teal-300 font-mono mt-0.5">
              {isAdmin ? 'Administrator' : isOperator ? `Operator (${operatorCredits} Credits)` : `ID: ${candidate?.candidateId || 'N/A'}`}
            </p>
          </div>

          {isOperator && (
            <div className="space-y-2">
              <button
                onClick={() => handleNavClick('operator-dashboard')}
                className="w-full p-2.5 text-left rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>অপারেটর ড্যাশবোর্ড (রিশিডিউল ও মার্কশিট)</span>
                </div>
                <span>{operatorCredits} Cr</span>
              </button>

              <a
                href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20er%20operator.%20Amar%20credit%20kitte%20chai."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>ক্রেডিট রিচার্জ WhatsApp: 01305-894384</span>
              </a>
            </div>
          )}

          {isCandidate && (
            <div className="text-xs font-semibold">
              <button
                onClick={() => handleNavClick('candidate-dashboard')}
                className="w-full p-2.5 text-left rounded-xl bg-teal-800/60 hover:bg-teal-700 text-white flex items-center justify-between"
              >
                <span>প্রার্থী ড্যাশবোর্ড / Candidate Dashboard</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-teal-300" />
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('admin-operators')}
                className="p-2.5 text-left rounded-lg bg-amber-400 text-amber-950 font-bold"
              >
                Users & Credits
              </button>
              <button
                onClick={() => handleNavClick('admin-candidates')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Candidates
              </button>
              <button
                onClick={() => handleNavClick('admin-exam-dates')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Exam Dates
              </button>
              <button
                onClick={() => handleNavClick('admin-exam-centers')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Centers
              </button>
              <button
                onClick={() => handleNavClick('admin-marksheets')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Marksheets
              </button>
              <button
                onClick={() => handleNavClick('admin-date-requests')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Date Requests
              </button>
              <button
                onClick={() => handleNavClick('admin-center-requests')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white"
              >
                Center Requests
              </button>
              <button
                onClick={() => handleNavClick('admin-audit-logs')}
                className="p-2.5 text-left rounded-lg bg-teal-800/60 hover:bg-teal-700 text-white col-span-2"
              >
                Audit Logs
              </button>
            </div>
          )}

          <button
            id="btn-mobile-logout"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-sm font-semibold text-rose-200 bg-rose-900/40 border border-rose-700/60 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
};
