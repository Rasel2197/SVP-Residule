import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Home } from './views/Home';
import { CandidateLogin } from './views/auth/CandidateLogin';
import { CandidateRegister } from './views/auth/CandidateRegister';
import { AdminLogin } from './views/auth/AdminLogin';
import { ForgotPasswordModal } from './views/auth/ForgotPasswordModal';
import { CandidateDashboard } from './views/candidate/CandidateDashboard';
import { CandidateExamDetails } from './views/candidate/CandidateExamDetails';
import { ChangeExamDate } from './views/candidate/ChangeExamDate';
import { ChangeExamCenter } from './views/candidate/ChangeExamCenter';
import { CandidateMarksheet } from './views/candidate/CandidateMarksheet';
import { RequestHistory } from './views/candidate/RequestHistory';
import { CandidateProfile } from './views/candidate/CandidateProfile';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AdminCandidates } from './views/admin/AdminCandidates';
import { AdminExamDates } from './views/admin/AdminExamDates';
import { AdminExamCenters } from './views/admin/AdminExamCenters';
import { AdminDateRequests } from './views/admin/AdminDateRequests';
import { AdminCenterRequests } from './views/admin/AdminCenterRequests';
import { AdminMarksheets } from './views/admin/AdminMarksheets';
import { AdminAuditLogs } from './views/admin/AdminAuditLogs';
import { AdminSettings } from './views/admin/AdminSettings';
import { OperatorLogin } from './views/auth/OperatorLogin';
import { OperatorRegister } from './views/auth/OperatorRegister';
import { OperatorDashboard } from './views/operator/OperatorDashboard';
import { AdminOperators } from './views/admin/AdminOperators';
import { Candidate } from './types';
import { ShieldCheck, ShieldAlert, Heart, ExternalLink } from 'lucide-react';
import { VerificationModal } from './components/VerificationModal';

const AppContent: React.FC = () => {
  const { currentUser, role, isAdmin, isCandidate, isOperator, isLoading } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<string>('candidate-login');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [selectedCandidateForMarksheet, setSelectedCandidateForMarksheet] = useState<Candidate | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [verificationModalTab, setVerificationModalTab] = useState<'certificate' | 'result'>('certificate');

  const openVerification = (tab: 'certificate' | 'result') => {
    setVerificationModalTab(tab);
    setIsVerificationModalOpen(true);
  };

  const navigateTo = (view: string) => {
    // Role protection guards
    const adminViews = [
      'admin-dashboard',
      'admin-operators',
      'admin-candidates',
      'admin-exam-dates',
      'admin-exam-centers',
      'admin-date-requests',
      'admin-center-requests',
      'admin-marksheets',
      'admin-audit-logs',
      'admin-settings',
    ];

    const operatorViews = [
      'operator-dashboard',
    ];

    const candidateViews = [
      'candidate-dashboard',
      'candidate-exam-details',
      'candidate-change-date',
      'candidate-change-center',
      'candidate-marksheet',
      'candidate-history',
      'candidate-profile',
    ];

    if (adminViews.includes(view)) {
      if (!currentUser) {
        showToast('Please sign in to access the Administrator Portal.', 'error');
        setCurrentView('admin-login');
        return;
      }
      if (!isAdmin) {
        showToast('Administrative privileges required to access this resource.', 'error');
        setCurrentView(isOperator ? 'operator-dashboard' : isCandidate ? 'candidate-dashboard' : 'home');
        return;
      }
    }

    if (operatorViews.includes(view)) {
      if (!currentUser) {
        showToast('অনুগ্রহ করে ইউজার একাউন্টে লগইন করুন (Please sign in as operator).', 'error');
        setCurrentView('operator-login');
        return;
      }
      if (!isOperator && !isAdmin) {
        showToast('Operator authorization required.', 'error');
        setCurrentView(isCandidate ? 'candidate-dashboard' : 'home');
        return;
      }
    }

    if (candidateViews.includes(view)) {
      if (!currentUser) {
        showToast('Please sign in to access candidate portal services.', 'error');
        setCurrentView('candidate-login');
        return;
      }
      if (isAdmin && !isCandidate) {
        // Admins can view candidate areas if they choose, but normally redirect to admin dashboard
        // Or let admin proceed
      }
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user logs in or out, intelligently redirect
  React.useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        if (isAdmin && (currentView === 'home' || currentView === 'candidate-login' || currentView === 'operator-login' || currentView === 'admin-login')) {
          setCurrentView('admin-dashboard');
        } else if (isOperator && (currentView === 'home' || currentView === 'candidate-login' || currentView === 'operator-login' || currentView === 'admin-login')) {
          setCurrentView('operator-dashboard');
        } else if (isCandidate && (currentView === 'home' || currentView === 'candidate-login' || currentView === 'operator-login' || currentView === 'admin-login')) {
          setCurrentView('candidate-dashboard');
        }
      }
    }
  }, [currentUser, isAdmin, isCandidate, isOperator, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide text-slate-500">Loading SVP Reschedule Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      <Navbar currentView={currentView} onNavigate={navigateTo} onOpenVerification={openVerification} />

      <main className="flex-1">
        {currentView === 'home' && <Home onNavigate={navigateTo} onOpenVerification={openVerification} />}

        {/* Authentication Views */}
        {currentView === 'candidate-login' && (
          <CandidateLogin
            onNavigate={navigateTo}
            onForgotPassword={() => setIsForgotModalOpen(true)}
          />
        )}
        {currentView === 'candidate-register' && (
          <CandidateLogin
            onNavigate={navigateTo}
            onForgotPassword={() => setIsForgotModalOpen(true)}
          />
        )}
        {currentView === 'operator-login' && (
          <OperatorLogin
            onNavigate={navigateTo}
            onForgotPassword={() => setIsForgotModalOpen(true)}
          />
        )}
        {currentView === 'operator-register' && (
          <OperatorRegister onNavigate={navigateTo} />
        )}
        {currentView === 'admin-login' && (
          <AdminLogin
            onNavigate={navigateTo}
            onForgotPassword={() => setIsForgotModalOpen(true)}
          />
        )}

        {/* Operator Views */}
        {currentView === 'operator-dashboard' && (
          <OperatorDashboard onNavigate={navigateTo} />
        )}

        {/* Candidate Views */}
        {currentView === 'candidate-dashboard' && (
          <CandidateDashboard onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-exam-details' && (
          <CandidateExamDetails onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-change-date' && (
          <ChangeExamDate onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-change-center' && (
          <ChangeExamCenter onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-marksheet' && (
          <CandidateMarksheet onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-history' && (
          <RequestHistory onNavigate={navigateTo} />
        )}
        {currentView === 'candidate-profile' && (
          <CandidateProfile onNavigate={navigateTo} />
        )}

        {/* Admin Views */}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard onNavigate={navigateTo} />
        )}
        {currentView === 'admin-operators' && (
          <AdminOperators onNavigate={navigateTo} />
        )}
        {currentView === 'admin-candidates' && (
          <AdminCandidates
            onNavigate={navigateTo}
            onSelectCandidateForMarksheet={(c) => setSelectedCandidateForMarksheet(c)}
          />
        )}
        {currentView === 'admin-exam-dates' && (
          <AdminExamDates onNavigate={navigateTo} />
        )}
        {currentView === 'admin-exam-centers' && (
          <AdminExamCenters onNavigate={navigateTo} />
        )}
        {currentView === 'admin-date-requests' && (
          <AdminDateRequests onNavigate={navigateTo} />
        )}
        {currentView === 'admin-center-requests' && (
          <AdminCenterRequests onNavigate={navigateTo} />
        )}
        {currentView === 'admin-marksheets' && (
          <AdminMarksheets
            onNavigate={navigateTo}
            preSelectedCandidate={selectedCandidateForMarksheet}
          />
        )}
        {currentView === 'admin-audit-logs' && (
          <AdminAuditLogs onNavigate={navigateTo} />
        )}
        {currentView === 'admin-settings' && (
          <AdminSettings onNavigate={navigateTo} />
        )}
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Official Certificate & Result Verification Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        initialTab={verificationModalTab}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* SVP Reschedule Styled Footer with SVPI Main Portal Link */}
      <footer className="bg-[#0B3B3C] border-t border-[#135153] mt-16 py-10 text-xs text-teal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-teal-200">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm tracking-wide uppercase">
                  SVP RESCHEDULE
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-teal-800 text-teal-200 rounded border border-teal-600">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-teal-200/80">
                Skill Verification Program (SVP তাকামুল) • Rescheduling & Marksheet Verification
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-teal-200/70 space-y-1.5">
            <div>
              <a
                href="https://share.google/dqJYdIEwULNHFfTSr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-300 hover:text-white font-medium underline underline-offset-2 transition-colors"
              >
                <span>SVPI Main Official Portal (মূল ওয়েবসাইট)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p>© 2026 SVP Reschedule Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
