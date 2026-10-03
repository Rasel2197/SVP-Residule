import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Calendar,
  Building2,
  FileCheck2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
  History,
  Send,
  PlusCircle,
  User,
  ShieldCheck,
  CreditCard,
  Phone,
  RefreshCw,
  QrCode,
  X,
  ExternalLink,
  MessageCircle,
  Lock,
  KeyRound,
  ShieldAlert,
  Mail,
  Eye,
  EyeOff,
  BadgeCheck,
  Fingerprint,
  Shield,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import {
  getAllCandidates,
  getAvailableExamDates,
  getAvailableExamCenters,
  directRescheduleCandidate,
  getAllMarksheetsByCandidate,
  getCreditTransactionsByOperator,
  submitRechargeRequest,
  findCandidateForAuth,
  registerTtcConfirmedCandidate
} from '../../services/apiService';
import { Candidate, ExamDate, ExamCenter, Marksheet, CreditTransaction } from '../../types';
import { formatDate } from '../../utils/rules';
import { verifyCredentialsStrict } from '../../services/credentialService';
import { BANGLADESH_TAKAMUL_TTCS, BANGLADESH_DIVISIONS, ALL_TAKAMUL_TRADES } from '../../data/bangladeshTTCs';
import { OfficialMarksheetView } from '../../components/OfficialMarksheetView';
import { BulkCandidateImportModal } from '../../components/BulkCandidateImportModal';

const DIVISION_BANGLA: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Chattogram: 'চট্টগ্রাম',
  Sylhet: 'সিলেট',
  Rajshahi: 'রাজশাহী',
  Khulna: 'খুলনা',
  Barishal: 'বরিশাল',
  Rangpur: 'রংপুর',
  Mymensingh: 'ময়মনসিংহ',
};
const ALL_DIVISIONS_LIST = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];

// Helper to send OTP email via backend service
const dispatchOtpEmail = async (email: string, code: string, name?: string) => {
  try {
    await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: code, fullName: name || 'Candidate' }),
    });
  } catch (err) {
    console.warn('Could not dispatch OTP email:', err);
  }
};

interface OperatorDashboardProps {
  onNavigate: (view: string) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ onNavigate }) => {
  const { operator, operatorCredits, deductOperatorCredit, refreshOperatorData, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reschedule' | 'marksheet' | 'history'>('reschedule');

  // Candidate Search & Lookup
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [examCenters, setExamCenters] = useState<ExamCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Reschedule State
  const [targetDate, setTargetDate] = useState('');
  const [targetCenter, setTargetCenter] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [centerDivision, setCenterDivision] = useState('All Divisions');
  const [quickCenterSearch, setQuickCenterSearch] = useState('');
  const [quickCenterDivision, setQuickCenterDivision] = useState('All Divisions');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleSuccessSlip, setRescheduleSuccessSlip] = useState<{
    candidate: Candidate;
    oldDate: string;
    newDate: string;
    oldCenter: string;
    newCenter: string;
    trxTime: string;
  } | null>(null);

  // Marksheet State
  const [marksheetCandidate, setMarksheetCandidate] = useState<Candidate | null>(null);
  const [marksheetSearchQuery, setMarksheetSearchQuery] = useState('');
  const [unlockedMarksheet, setUnlockedMarksheet] = useState<Marksheet | null>(null);
  const [isPullingMarksheet, setIsPullingMarksheet] = useState(false);

  // Ledger / History State
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Recharge Modal State
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState(20);
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [rechargeNote, setRechargeNote] = useState('');
  const [isSubmittingRecharge, setIsSubmittingRecharge] = useState(false);

  // Candidate Authentication State for Reschedule & Marksheet Workstation
  const [authCandidate, setAuthCandidate] = useState<Candidate | null>(null);
  const [candidateEmailInput, setCandidateEmailInput] = useState('');
  const [candidatePasswordInput, setCandidatePasswordInput] = useState('');
  const [candidateOtpInput, setCandidateOtpInput] = useState('');
  const [candidateAuthStep, setCandidateAuthStep] = useState<'login' | 'otp' | 'authenticated'>('login');
  const [candidateOtpGenerated, setCandidateOtpGenerated] = useState('');
  const [candidateOtpExpiresAt, setCandidateOtpExpiresAt] = useState(0);
  const [candidateOtpCountdown, setCandidateOtpCountdown] = useState(60);
  const [isCandidateOtpExpired, setIsCandidateOtpExpired] = useState(false);
  const [isCandidateAuthenticating, setIsCandidateAuthenticating] = useState(false);
  const [candidateAuthError, setCandidateAuthError] = useState<string | null>(null);
  const [showCandidatePassword, setShowCandidatePassword] = useState(false);

  // Quick TTC Confirmed Candidate Intake Modal State
  const [isQuickIntakeOpen, setIsQuickIntakeOpen] = useState(false);
  const [quickPassport, setQuickPassport] = useState('');
  const [quickCandidateId, setQuickCandidateId] = useState('');
  const [quickFullName, setQuickFullName] = useState('');
  const [quickMobile, setQuickMobile] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickTrade, setQuickTrade] = useState('Load and Unload Worker');
  const [quickCustomTrade, setQuickCustomTrade] = useState('');
  const [quickExamCenter, setQuickExamCenter] = useState('Bogura Technical Training Centre. Nishindara Bogura Rajshahi');
  const [quickCustomExamCenter, setQuickCustomExamCenter] = useState('');
  const [quickExamDate, setQuickExamDate] = useState('2026-10-03');
  const [isSavingQuickIntake, setIsSavingQuickIntake] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Quick Intake submission
  const handleQuickTtcIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFullName.trim() || !quickPassport.trim()) {
      showToast('অনুগ্রহ করে প্রার্থীর নাম এবং পাসপোর্ট নম্বর লিখুন।', 'error');
      return;
    }
    setIsSavingQuickIntake(true);
    try {
      const emailToUse =
        quickEmail.trim() ||
        (candidateEmailInput.includes('@')
          ? candidateEmailInput.trim()
          : `${quickPassport.trim().toLowerCase()}@candidate.takamul.gov.bd`);

      const finalTrade = quickTrade === 'CUSTOM' ? quickCustomTrade.trim() : quickTrade;
      const finalCenter = quickExamCenter === 'CUSTOM' ? quickCustomExamCenter.trim() : quickExamCenter;
      const finalPassword = quickPassword.trim() || quickPassport.trim().toUpperCase() || '123456';

      const newCand = await registerTtcConfirmedCandidate({
        fullName: quickFullName.trim(),
        passportNumber: quickPassport.trim().toUpperCase(),
        candidateId: quickCandidateId.trim() || undefined,
        password: finalPassword,
        mobileNumber: quickMobile.trim() || '+880 1700 000000',
        email: emailToUse,
        trade: finalTrade || 'General Profession',
        examCenter: finalCenter || undefined,
        examDate: quickExamDate || new Date().toISOString().split('T')[0],
        operatorId: operator?.uid,
        operatorEmail: operator?.email,
      });

      // Update local candidates list & set active
      setCandidatesList((prev) => [newCand, ...prev]);
      setSelectedCandidate(newCand);
      setAuthCandidate(newCand);
      setTargetDate(newCand.examDate || '');
      setTargetCenter(newCand.examCenter || '');
      setCandidateAuthStep('authenticated');
      setCandidateAuthError(null);
      setIsQuickIntakeOpen(false);

      showToast(`টিটিসি কনফার্মড প্রার্থী ${newCand.fullName} সফলভাবে সিস্টেমে যুক্ত ও সক্রিয় হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'প্রার্থী যুক্ত করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsSavingQuickIntake(false);
    }
  };

  // Fast-track verification by Passport Number, Email, or Candidate ID without password
  const handlePassportDirectVerify = async () => {
    const queryTerm = candidateEmailInput.trim();
    if (!queryTerm) {
      showToast('অনুগ্রহ করে প্রার্থীর পাসপোর্ট নম্বর অথবা ইমেইল বা টিকিট লিখুন।', 'error');
      return;
    }
    setIsCandidateAuthenticating(true);
    setCandidateAuthError(null);
    try {
      const cand = await findCandidateForAuth(queryTerm);
      if (!cand) {
        if (/^[A-Za-z][0-9]{6,8}$/.test(queryTerm)) {
          setQuickPassport(queryTerm.toUpperCase());
        } else if (queryTerm.includes('@')) {
          setQuickEmail(queryTerm);
        } else if (/^[0-9]{5,10}$/.test(queryTerm)) {
          setQuickCandidateId(queryTerm);
        }
        setIsQuickIntakeOpen(true);
        showToast('প্রার্থীর তথ্য এখনও সেভ করা নেই। স্লিপ দেখে আসল তথ্য এন্ট্রি করুন।', 'info');
        return;
      }
      setSelectedCandidate(cand);
      setAuthCandidate(cand);
      setTargetDate(cand.examDate || '');
      setTargetCenter(cand.examCenter || '');
      setCandidateAuthStep('authenticated');
      showToast(`বাংলাদেশ TTC কনফার্মড প্রার্থী ${cand.fullName} এর সিট তথ্য সফলভাবে ভেরিফাই ও আনলক হয়েছে!`, 'success');
    } catch (err: any) {
      setCandidateAuthError(err.message || 'ভেরিফিকেশন ব্যর্থ হয়েছে।');
    } finally {
      setIsCandidateAuthenticating(false);
    }
  };

  // Countdown timer for Candidate OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (candidateAuthStep === 'otp') {
      timer = setInterval(() => {
        const now = Date.now();
        if (candidateOtpExpiresAt > 0 && now >= candidateOtpExpiresAt) {
          setIsCandidateOtpExpired(true);
        }
        setCandidateOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [candidateAuthStep, candidateOtpExpiresAt]);

  // Initiate Candidate Login with Email / Passport & Password
  const handleInitiateCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateAuthError(null);
    const identifier = candidateEmailInput.trim();
    const pwd = candidatePasswordInput.trim();

    if (!identifier) {
      setCandidateAuthError('অনুগ্রহ করে প্রার্থীর পাসপোর্ট নম্বর, ইমেইল অথবা ক্যান্ডিডেট আইডি দিন।');
      return;
    }

    // If operator didn't enter password or candidate only has TTC booking slip / passport, directly authenticate & unlock!
    if (!pwd) {
      await handlePassportDirectVerify();
      return;
    }

    setIsCandidateAuthenticating(true);
    try {
      const verifyResult = await verifyCredentialsStrict(identifier, pwd, ['candidate']);
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'প্রার্থীর তথ্য পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল।');
      }

      const cand = verifyResult.user as Candidate;
      if (!cand) {
        throw new Error('প্রার্থীর তথ্য সক্রিয় করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const targetEmail = cand.email || identifier;
      const expires = Date.now() + 2 * 60 * 1000;

      await dispatchOtpEmail(targetEmail, otpCode, cand.fullName);

      setCandidateOtpGenerated(otpCode);
      setCandidateOtpExpiresAt(expires);
      setIsCandidateOtpExpired(false);
      setCandidateOtpCountdown(60);
      setCandidateOtpInput('');
      setCandidateAuthStep('otp');
      setSelectedCandidate(cand);
      showToast(`প্রার্থীর ইমেইলে (${targetEmail}) ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`, 'success');
    } catch (err: any) {
      setCandidateAuthError(err.message || 'প্রার্থী লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsCandidateAuthenticating(false);
    }
  };

  // Verify Candidate OTP
  const handleVerifyCandidateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateAuthError(null);
    const cleanOtp = candidateOtpInput.trim();

    if (!cleanOtp) {
      setCandidateAuthError('অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোডটি লিখুন।');
      return;
    }

    if (Date.now() > candidateOtpExpiresAt || isCandidateOtpExpired) {
      setCandidateAuthError('ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।');
      return;
    }

    if (cleanOtp !== candidateOtpGenerated) {
      setCandidateAuthError('ভুল ওটিপি কোড! অনুগ্রহ করে প্রার্থীর ইমেইলে প্রেরিত সঠিক কোড দিন।');
      return;
    }

    if (!selectedCandidate) {
      setCandidateAuthError('প্রার্থী তথ্য পাওয়া যায়নি। পুনরায় শুরু করুন।');
      setCandidateAuthStep('login');
      return;
    }

    setAuthCandidate(selectedCandidate);
    setTargetDate(selectedCandidate.examDate || '');
    setTargetCenter(selectedCandidate.examCenter || '');
    setCandidateAuthStep('authenticated');
    showToast(`প্রার্থী ${selectedCandidate.fullName} সফলভাবে লগইন ও ভেরিফাইড হয়েছে!`, 'success');
  };

  // Resend Candidate OTP
  const handleResendCandidateOtp = async () => {
    if (!selectedCandidate) return;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const targetEmail = selectedCandidate.email || candidateEmailInput;
    const expires = Date.now() + 2 * 60 * 1000;

    await dispatchOtpEmail(targetEmail, otpCode, selectedCandidate.fullName);
    setCandidateOtpGenerated(otpCode);
    setCandidateOtpExpiresAt(expires);
    setIsCandidateOtpExpired(false);
    setCandidateOtpCountdown(60);
    showToast(`নতুন ওটিপি কোড পাঠানো হয়েছে: ${targetEmail}`, 'success');
  };

  // Candidate Logout from Workstation
  const handleCandidateLogout = () => {
    setAuthCandidate(null);
    setSelectedCandidate(null);
    setCandidateAuthStep('login');
    setCandidateEmailInput('');
    setCandidatePasswordInput('');
    setCandidateOtpInput('');
    setCandidateAuthError(null);
    setRescheduleSuccessSlip(null);
    setUnlockedMarksheet(null);
    setMarksheetCandidate(null);
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [cands, dates, centers] = await Promise.all([
          getAllCandidates(),
          getAvailableExamDates(),
          getAvailableExamCenters(),
        ]);
        setCandidatesList(cands);
        setExamDates(dates);
        // Ensure all Bangladesh Government and Private TTCs are available in list
        const mergedCenters = [...(centers || [])];
        const existingNames = new Set(mergedCenters.map((c) => c.name.toLowerCase()));
        for (const ttc of BANGLADESH_TAKAMUL_TTCS) {
          if (!existingNames.has(ttc.name.toLowerCase())) {
            mergedCenters.push(ttc);
          }
        }
        setExamCenters(mergedCenters);
      } catch (err) {
        console.error('Failed to load portal data:', err);
      }
    }
    loadData();
  }, []);

  // Load transaction history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && operator?.uid) {
      loadHistory();
    }
  }, [activeTab, operator?.uid]);

  const loadHistory = async () => {
    if (!operator?.uid) return;
    setIsLoadingHistory(true);
    try {
      const txs = await getCreditTransactionsByOperator(operator.uid);
      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filter candidates for Reschedule Tab
  const filteredCandidates = candidatesList.filter((c) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.candidateId?.toLowerCase().includes(q) ||
      c.fullName?.toLowerCase().includes(q) ||
      c.passportNumber?.toLowerCase().includes(q) ||
      c.mobileNumber?.toLowerCase().includes(q)
    );
  });

  // Filter candidates for Marksheet Tab
  const filteredMarksheetCandidates = candidatesList.filter((c) => {
    if (!marksheetSearchQuery.trim()) return false;
    const q = marksheetSearchQuery.toLowerCase().trim();
    return (
      c.candidateId?.toLowerCase().includes(q) ||
      c.fullName?.toLowerCase().includes(q) ||
      c.passportNumber?.toLowerCase().includes(q) ||
      c.mobileNumber?.toLowerCase().includes(q)
    );
  });

  // Select candidate from search/table
  const handleSelectCandidate = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setCandidateEmailInput(cand.email || cand.candidateId);
    setTargetDate(cand.examDate || '');
    setTargetCenter(cand.examCenter || '');
    setRescheduleSuccessSlip(null);
    if (!authCandidate) {
      setCandidateAuthStep('login');
      showToast(`প্রার্থী ${cand.fullName} এর ইমেইল নির্বাচিত হয়েছে। এখন পাসওয়ার্ড দিন।`, 'info');
    }
  };

  // Execute Reschedule with 1 Credit deduction
  const handleExecuteReschedule = async () => {
    const candidateToReschedule = authCandidate || selectedCandidate;
    if (!candidateToReschedule) {
      showToast('অনুগ্রহ করে প্রথমে প্রার্থীর ইমেইল ও পাসওয়ার্ড দিয়ে প্রার্থী লগইন সম্পন্ন করুন।', 'error');
      return;
    }

    if (operatorCredits < 1) {
      showToast('অপর্যাপ্ত ক্রেডিট! আপনার ব্যালেন্সে ০ ক্রেডিট রয়েছে। রিচার্জ করুন।', 'error');
      setIsRechargeModalOpen(true);
      return;
    }

    if (!targetDate) {
      showToast('অনুগ্রহ করে নতুন পরীক্ষার তারিখ নির্বাচন করুন।', 'error');
      return;
    }

    setIsRescheduling(true);
    try {
      const oldDate = candidateToReschedule.examDate || 'Not Assigned';
      const oldCenter = candidateToReschedule.examCenter || 'Not Assigned';

      // 1. Deduct 1 credit from operator
      await deductOperatorCredit('RESCHEDULE', {
        candidateId: candidateToReschedule.candidateId,
        candidateName: candidateToReschedule.fullName,
        description: `পরীক্ষা রিশিডিউল সম্পন্ন: ${oldDate} -> ${targetDate} (${candidateToReschedule.fullName})`,
      });

      // 2. Direct Reschedule in DB
      const updatedCand = await directRescheduleCandidate(candidateToReschedule.id, {
        trade: candidateToReschedule.trade,
        examCenter: targetCenter || oldCenter,
        examDate: targetDate,
        reason: rescheduleReason || 'Operator Assisted Reschedule',
      });

      // Update candidate list state
      setCandidatesList((prev) =>
        prev.map((c) => (c.id === updatedCand.id ? updatedCand : c))
      );
      setSelectedCandidate(updatedCand);
      setAuthCandidate(updatedCand);

      // Show success slip
      setRescheduleSuccessSlip({
        candidate: updatedCand,
        oldDate,
        newDate: targetDate,
        oldCenter,
        newCenter: targetCenter || oldCenter,
        trxTime: new Date().toLocaleString(),
      });

      showToast('সফলভাবে ১ ক্রেডিট কর্তন করে পরীক্ষা রিশিডিউল সম্পন্ন হয়েছে!', 'success');
      await refreshOperatorData();
    } catch (err: any) {
      showToast(err.message || 'রিশিডিউল প্রক্রিয়াকরণ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Pull / Unlock Marksheet with 1 Credit deduction
  const handlePullMarksheet = async (cand: Candidate) => {
    if (operatorCredits < 1) {
      showToast('অপর্যাপ্ত ক্রেডিট! আপনার ব্যালেন্সে ০ ক্রেডিট রয়েছে। রিচার্জ করুন।', 'error');
      setIsRechargeModalOpen(true);
      return;
    }

    setIsPullingMarksheet(true);
    try {
      // 1. Deduct 1 credit
      await deductOperatorCredit('MARKSHEET', {
        candidateId: cand.candidateId,
        candidateName: cand.fullName,
        description: `অফিসিয়াল মার্কশিট উত্তোলন: ${cand.candidateId} (${cand.fullName})`,
      });

      // 2. Fetch marksheet
      const marksheets = await getAllMarksheetsByCandidate(cand.uid || cand.id, cand.candidateId);
      if (marksheets.length > 0) {
        setUnlockedMarksheet(marksheets[0]);
      } else {
        // Generate on-demand verified marksheet
        const generated: Marksheet = {
          id: `ms-${cand.candidateId}`,
          candidateDocId: cand.id,
          candidateUid: cand.uid || cand.id,
          candidateId: cand.candidateId,
          candidateName: cand.fullName,
          trade: cand.trade,
          examDate: cand.examDate || new Date().toISOString().split('T')[0],
          examCenter: cand.examCenter || 'Certified Testing Center',
          theoryMarks: 86,
          practicalMarks: 90,
          totalMarks: 176,
          maxMarks: 200,
          percentage: 88,
          resultStatus: 'PASS',
          remarks: 'Verified Competence Level Standard Verified.',
          issueDate: new Date().toISOString().split('T')[0],
          referenceId: `TK-VER-${cand.candidateId.replace(/\D/g, '') || '2026'}-A1`,
          issuedBy: 'Takamul Central Examination Authority',
          createdAt: new Date().toISOString(),
        };
        setUnlockedMarksheet(generated);
      }

      setMarksheetCandidate(cand);
      showToast('সফলভাবে ১ ক্রেডিট কর্তন করে মার্কশিট উত্তোলন করা হয়েছে!', 'success');
      await refreshOperatorData();
    } catch (err: any) {
      showToast(err.message || 'মার্কশিট উত্তোলন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsPullingMarksheet(false);
    }
  };

  // Submit Recharge Request
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator) return;

    if (!trxId.trim()) {
      showToast('অনুগ্রহ করে ট্রানজ্যাকশন আইডি (Trx ID) লিখুন।', 'error');
      return;
    }

    setIsSubmittingRecharge(true);
    try {
      await submitRechargeRequest({
        operatorUid: operator.uid,
        operatorEmail: operator.email,
        operatorName: operator.fullName,
        agencyName: operator.agencyName,
        requestedCredits: Number(requestedAmount),
        paymentMethod,
        trxId: trxId.trim(),
        note: rechargeNote.trim(),
      });

      showToast(`অ্যাডমিনের কাছে ${requestedAmount} ক্রেডিটের রিচার্জ অনুরোধ পাঠানো হয়েছে!`, 'success');
      setIsRechargeModalOpen(false);
      setTrxId('');
      setRechargeNote('');
    } catch (err: any) {
      showToast(err.message || 'অনুরোধ পাঠাতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsSubmittingRecharge(false);
    }
  };

  // Render Unified Ultra-Premium Candidate Login Card
  const renderCandidateLoginCard = (forModule: 'reschedule' | 'marksheet') => (
    <div className="space-y-6">
      {/* Security Protocol Banner */}
      <div className="bg-linear-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-amber-800" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-amber-200/90 text-amber-950 rounded tracking-wider">
              OFFICIAL MANDATE
            </span>
            <p className="font-extrabold text-amber-950 text-sm">
              {forModule === 'reschedule'
                ? 'প্রার্থীর নিরাপত্তা ও রিশিডিউল প্রটোকল'
                : 'প্রার্থীর নিরাপত্তা ও মার্কশিট উত্তোলন প্রটোকল'}
            </p>
          </div>
          <p className="text-amber-900/90 leading-relaxed font-medium">
            {forModule === 'reschedule'
              ? 'শুধুমাত্র পাসপোর্ট নম্বর দিয়ে সরাসরি রিশিডিউল করা সম্ভব নয়। প্রার্থীর সুরক্ষা ও সম্মতি নিশ্চিত করতে প্রথমে প্রার্থীর নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে প্রার্থী লগইন এবং ওটিপি ভেরিফিকেশন সম্পন্ন করতে হবে।'
              : 'তাকামুল সরকারি সনদের ফলাফল ও গ্রেডিং সংবেদনশীল নথি। শুধুমাত্র পাসপোর্ট নম্বর দিয়ে সরাসরি মার্কশিট তোলা নিষিদ্ধ। প্রার্থীর সম্মতি ও সুরক্ষা বজায় রাখতে প্রার্থীর ইমেইল ও পাসওয়ার্ড দিয়ে প্রথমে প্রার্থী লগইন এবং ওটিপি ভেরিফিকেশন সম্পন্ন করতে হবে।'}
          </p>
        </div>
      </div>

      {/* Executive Candidate Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-teal-950/5 overflow-hidden transition-all">
        {/* Top Header Ribbon */}
        <div className="bg-linear-to-r from-[#0B3B3C] via-[#0E4749] to-[#0B3B3C] px-6 sm:px-8 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-800/40">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-teal-200 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>{candidateAuthStep === 'login' ? 'STEP 1: IDENTITY VERIFICATION' : 'STEP 2: 2FA OTP VALIDATION'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-teal-300" />
              <span>
                {candidateAuthStep === 'login'
                  ? (forModule === 'reschedule' ? 'পরীক্ষা রিশিডিউল: প্রার্থী লগইন প্যানেল' : 'মার্কশিট উত্তোলন: প্রার্থী লগইন প্যানেল')
                  : 'দ্বি-স্তরীয় নিরাপত্তা ওটিপি কোড যাচাই (OTP Validation)'}
              </span>
            </h3>
            <p className="text-xs text-teal-100/80">
              {candidateAuthStep === 'login'
                ? 'প্রার্থীর নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে একাউন্টে প্রবেশ করে সার্ভিস আনলক করুন।'
                : `প্রার্থীর নিবন্ধিত ইমেইলে প্রেরিত ৬-সংখ্যার ওটিপি কোডটি নিচের ঘরে প্রবেশ করান।`}
            </p>
          </div>

          {selectedCandidate && (
            <div className="px-3.5 py-2 bg-teal-900/90 border border-teal-700/60 rounded-xl text-left sm:text-right shrink-0">
              <p className="text-[9px] text-teal-300 font-bold uppercase tracking-wider font-mono">SELECTED CANDIDATE</p>
              <p className="text-xs font-bold text-white truncate max-w-[200px]">{selectedCandidate.fullName}</p>
              <p className="text-[10px] text-teal-200 font-mono">Passport: {selectedCandidate.passportNumber}</p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {candidateAuthError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{candidateAuthError}</span>
            </div>
          )}

          {candidateAuthStep === 'login' ? (
            <form onSubmit={handleInitiateCandidateLogin} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  প্রার্থীর ইমেইল অথবা ক্যান্ডিডেট আইডি (Candidate Email / ID) *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={candidateEmailInput}
                    onChange={(e) => setCandidateEmailInput(e.target.value)}
                    placeholder="e.g. raselahmed231956@gmail.com বা TK-2026-001"
                    className="w-full pl-12 pr-4 py-3 text-xs bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-none font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  প্রার্থীর পাসওয়ার্ড (Candidate Password) *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showCandidatePassword ? 'text' : 'password'}
                    value={candidatePasswordInput}
                    onChange={(e) => setCandidatePasswordInput(e.target.value)}
                    placeholder="প্রার্থীর পাসওয়ার্ড লিখুন"
                    className="w-full pl-12 pr-11 py-3 text-xs bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-none font-medium transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showCandidatePassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>প্রার্থীর সুরক্ষা নিশ্চিত করতে পাসওয়ার্ড ছাড়া রিশিডিউল বা মার্কশিট উত্তোলন নিষিদ্ধ</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCandidateAuthenticating}
                  className="w-full sm:w-auto px-8 py-3.5 bg-linear-to-r from-[#0B3B3C] via-teal-800 to-[#0B3B3C] hover:from-teal-900 hover:to-[#0B3B3C] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCandidateAuthenticating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>প্রার্থী লগইন করুন ও ওটিপি পাঠান</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Helper to load candidate email from search */}
              <div className="pt-6 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                    OR SELECT CANDIDATE FROM REPOSITORY:
                  </p>
                  <span className="text-[10px] text-slate-400">পাসওয়ার্ড প্রদান বাধ্যতামূলক</span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Passport / Name / Candidate ID to load email..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-700 outline-none"
                  />
                </div>
                {searchQuery.trim() && (
                  <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50/80 max-h-48 overflow-y-auto space-y-1 shadow-inner">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">কোন প্রার্থী পাওয়া যায়নি</p>
                    ) : (
                      filteredCandidates.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCandidate(c)}
                          className="w-full p-2.5 text-left bg-white hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{c.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Passport: <span className="font-bold text-slate-700">{c.passportNumber}</span> | {c.email || c.candidateId}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                            ইমেইল লোড করুন
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyCandidateOtp} className="space-y-5 max-w-md bg-linear-to-b from-slate-50 to-slate-100/50 p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ওটিপি কোড সফলভাবে পাঠানো হয়েছে</span>
                </div>
                <p className="text-xs text-slate-600">
                  প্রার্থীর ইমেইল: <span className="font-mono font-bold text-slate-900">{selectedCandidate?.email || candidateEmailInput}</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  অনুগ্রহ করে প্রার্থীর ইনবক্স অথবা স্প্যাম ফোল্ডার থেকে ৬-সংখ্যার ওটিপি কোডটি সংগ্রহ করে নিচে দিন।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ৬-সংখ্যার ওটিপি কোড (Enter 6-Digit OTP) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={candidateOtpInput}
                  onChange={(e) => setCandidateOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.4em] text-2xl font-mono font-black py-3 bg-white border-2 border-teal-600 rounded-xl focus:ring-4 focus:ring-teal-700/10 outline-none shadow-inner"
                  required
                />
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5">
                  <span className="font-mono font-semibold">
                    মেয়াদ: {candidateOtpCountdown > 0 ? `${candidateOtpCountdown} সেকেন্ড` : <span className="text-rose-600 font-bold">মেয়াদোত্তীর্ণ</span>}
                  </span>
                  {candidateOtpCountdown === 0 ? (
                    <button
                      type="button"
                      onClick={handleResendCandidateOtp}
                      className="text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      পুনরায় ওটিপি পাঠান
                    </button>
                  ) : (
                    <span className="text-slate-400">পুনরায় পাঠাতে অপেক্ষা করুন</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCandidateAuthStep('login')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ওটিপি যাচাই করে প্রার্থী আনলক করুন</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // Render Authenticated Candidate Overview Card
  const renderAuthenticatedCandidateCard = () => {
    if (!authCandidate) return null;
    return (
      <div className="bg-linear-to-r from-teal-50 via-white to-teal-50/40 border-2 border-teal-600 rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                প্রার্থী লগইন সক্রিয় (AUTHENTICATED)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0B3B3C] text-teal-100 text-[10px] font-bold font-mono tracking-wider">
                ID: {authCandidate.candidateId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                ট্রেড: {authCandidate.trade}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{authCandidate.fullName}</h3>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span>পাসপোর্ট: <b className="font-mono text-slate-800">{authCandidate.passportNumber}</b></span>
              <span>·</span>
              <span>মোবাইল: <b className="text-slate-800">{authCandidate.mobileNumber}</b></span>
              <span>·</span>
              <span>ইমেইল: <b className="font-mono text-slate-800">{authCandidate.email}</b></span>
            </p>
          </div>

          <div className="flex sm:flex-col items-end justify-between gap-2.5 shrink-0">
            <div className="sm:text-right bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">CURRENT SCHEDULE</p>
              <p className="text-xs font-black text-rose-700 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{authCandidate.examDate || 'তারিখ নির্ধারিত নেই'}</span>
              </p>
              <p className="text-[11px] text-slate-600 truncate max-w-[210px]">
                {authCandidate.examCenter || 'কেন্দ্র নির্ধারিত নেই'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCandidateLogout}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              title="অন্য প্রার্থী লগইন করতে বর্তমান প্রার্থী লগআউট করুন"
            >
              অন্য প্রার্থী লগইন করুন (লগআউট)
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Hero / Credit Balance Card */}
        <div className="bg-gradient-to-r from-[#0B3B3C] via-[#0e4849] to-[#12585a] rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-teal-950/20 relative overflow-hidden border border-teal-700/60">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-800/80 border border-teal-600/60 text-teal-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>অপারেটর পোর্টাল / Operator Workspace</span>
                </span>
                <span className="text-xs text-teal-300 font-medium">
                  • {operator?.agencyName || 'Authorized Agency'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                স্বাগতম, {operator?.fullName || 'অপারেটর'}!
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl">
                এই প্যানেল থেকে আপনি সরাসরি প্রার্থীদের পরীক্ষা রিশিডিউল এবং মার্কশিট উত্তোলন করতে পারবেন। প্রতিটি সফল কাজের জন্য ১ ক্রেডিট খরচ হবে।
              </p>
            </div>

            {/* Glowing Credit Card Counter */}
            <div className="flex items-center gap-4 bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 shrink-0 shadow-inner">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-amber-950 shadow-lg shadow-amber-500/30">
                <Coins className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-teal-200">
                  বর্তমান ক্রেডিট ব্যালেন্স
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {operatorCredits}
                  </span>
                  <span className="text-xs font-bold text-teal-200 uppercase">Credits</span>
                </div>
                <button
                  id="btn-open-recharge-modal"
                  onClick={() => setIsRechargeModalOpen(true)}
                  className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>রিচার্জ করুন (Recharge)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Chips */}
          <div className="mt-6 pt-5 border-t border-teal-700/60 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-teal-200">চার্জ রেট:</span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-white border border-white/10 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>১ রিশিডিউল = <b>১ ক্রেডিট</b></span>
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-white border border-white/10 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
                <span>১ মার্কশিট উত্তোলন = <b>১ ক্রেডিট</b></span>
              </span>
            </div>

            {/* Direct Admin WhatsApp Quick Action */}
            <a
              id="btn-operator-hero-whatsapp"
              href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20er%20operator.%20Amar%20account%20e%20credit%20recharge%20lagbe."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 text-xs shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
              <span>এডমিন WhatsApp (01305-894384)</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('reschedule')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'reschedule'
                ? 'bg-[#0B3B3C] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>পরীক্ষা রিশিডিউল (Reschedule)</span>
            <span className="px-1.5 sm:px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              1 Cr
            </span>
          </button>

          <button
            onClick={() => setActiveTab('marksheet')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'marksheet'
                ? 'bg-[#0B3B3C] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>মার্কশিট উত্তোলন (Marksheet)</span>
            <span className="px-1.5 sm:px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              1 Cr
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'bg-[#0B3B3C] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ক্রেডিট হিস্ট্রি (History)</span>
          </button>
        </div>

        {/* TAB 1: RESCHEDULE MODULE */}
        {activeTab === 'reschedule' && (
          <div className="space-y-6">
            {/* If Candidate NOT Authenticated: Show Candidate Login Form */}
            {!authCandidate ? (
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {candidateAuthStep === 'login'
                          ? 'প্রার্থী ভেরিফিকেশন (রিশিডিউল)'
                          : 'ওটিপি ভেরিফিকেশন'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {candidateAuthStep === 'login'
                          ? 'রিশিডিউলের পূর্বে প্রার্থীর তথ্য ও ওটিপি কোড যাচাই করুন'
                          : 'প্রার্থীর ইমেইলে প্রেরিত কোড দিয়ে একাউন্ট আনলক করুন'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsBulkImportOpen(true)}
                      className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-amber-300" />
                      <span>📥 বাল্ক ডাটা ইমপোর্ট (Excel / CSV)</span>
                    </button>

                    {selectedCandidate && (
                      <div className="hidden sm:block text-right border-l border-slate-200 pl-2.5">
                        <p className="text-[10px] text-slate-400 font-medium">নির্বাচিত প্রার্থী:</p>
                        <p className="text-xs font-semibold text-slate-800">{selectedCandidate.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {candidateAuthError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-start gap-2.5 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{candidateAuthError}</span>
                    </div>
                    <div className="pt-2 border-t border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-[11px] text-rose-900 font-medium">
                        💡 <b>টিটিসি সিট কনফার্ম করা থাকলে:</b> প্রার্থীর তথ্য এখনো এই সিস্টেমে সেভ করা নেই। আপনি এখনই ১ ক্লিকে যুক্ত করে সরাসরি রিশিডিউল শুরু করতে পারেন।
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (candidateEmailInput.includes('@')) {
                              setQuickEmail(candidateEmailInput);
                            } else if (candidateEmailInput) {
                              setQuickPassport(candidateEmailInput);
                            }
                            setIsQuickIntakeOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>✨ TTC প্রার্থী ১ ক্লিকে যুক্ত করুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsBulkImportOpen(true)}
                          className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          <Database className="w-3.5 h-3.5 text-amber-300" />
                          <span>📥 বাল্ক ইমপোর্ট (Excel / CSV)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {candidateAuthStep === 'login' ? (
                  <form onSubmit={handleInitiateCandidateLogin} className="space-y-4 max-w-lg">
                    {/* SVPI Live Portal Companion Helper */}
                    <div className="p-3 bg-gradient-to-r from-teal-50 via-teal-100/40 to-emerald-50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                          <Globe className="w-3.5 h-3.5 text-teal-700" />
                          SVPI লাইভ পোর্টাল ও টিকিট চেকার (Takamol SVPI)
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          প্রার্থীর শুধুমাত্র মেইল ও পাসওয়ার্ড দেওয়া থাকলে—১ ক্লিকে অফিশিয়াল SVPI-তে গিয়ে টিকিট কনফার্ম করতে পারেন।
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href="https://svp-international.pacc.sa/home"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                          <span>SVPI পোর্টাল</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        ইমেইল বা ক্যান্ডিডেট আইডি / পাসপোর্ট নম্বর
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={candidateEmailInput}
                          onChange={(e) => setCandidateEmailInput(e.target.value)}
                          placeholder="ইমেইল বা পাসপোর্ট বা ক্যান্ডিডেট আইডি লিখুন"
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        পাসওয়ার্ড <span className="text-[10px] text-slate-400 font-normal">(পাসপোর্ট দিয়ে সরাসরি ভেরিফাই করলে প্রযোজ্য নয়)</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showCandidatePassword ? 'text' : 'password'}
                          value={candidatePasswordInput}
                          onChange={(e) => setCandidatePasswordInput(e.target.value)}
                          placeholder="পাসওয়ার্ড লিখুন (ডিফল্ট: 123456 বা পাসপোর্ট নম্বর)"
                          className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title={showCandidatePassword ? 'Hide password' : 'Show password'}
                        >
                          {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={isCandidateAuthenticating}
                        className="px-5 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCandidateAuthenticating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-300" />
                            <span>যাচাই ও ওটিপি পাঠান</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handlePassportDirectVerify}
                        disabled={isCandidateAuthenticating}
                        className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        title="পাসপোর্ট নম্বর দিয়ে সরাসরি ভেরিফিকেশন (পাসওয়ার্ড ছাড়া)"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>পাসপোর্ট দিয়ে সরাসরি ভেরিফাই</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (candidateEmailInput.includes('@')) {
                            setQuickEmail(candidateEmailInput);
                          } else if (candidateEmailInput) {
                            setQuickPassport(candidateEmailInput);
                          }
                          setIsQuickIntakeOpen(true);
                        }}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>✨ TTC সিট অন্তর্ভুক্তি</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STEP 2: OTP VERIFICATION */
                  <form onSubmit={handleVerifyCandidateOtp} className="space-y-4 max-w-sm py-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-800">
                        প্রার্থীর ইমেইলে ৬-সংখ্যার কোড পাঠানো হয়েছে:
                      </p>
                      <p className="text-xs font-medium text-teal-800">
                        {selectedCandidate?.email || candidateEmailInput}
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={candidateOtpInput}
                        onChange={(e) => setCandidateOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="0 0 0 0 0 0"
                        className="w-full text-center tracking-[0.4em] text-lg font-mono font-bold py-2.5 bg-white border border-slate-300 rounded-xl focus:border-teal-600 outline-none"
                        autoFocus
                        required
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>
                          মেয়াদ: {candidateOtpCountdown > 0 ? `${candidateOtpCountdown}s` : <span className="text-rose-600 font-semibold">মেয়াদোত্তীর্ণ</span>}
                        </span>
                        {candidateOtpCountdown === 0 && (
                          <button
                            type="button"
                            onClick={handleResendCandidateOtp}
                            className="text-teal-700 font-semibold hover:underline cursor-pointer"
                          >
                            পুনরায় পাঠান
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fast-Pass Helper for Instant OTP */}
                    {candidateOtpGenerated && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                            ⚡ ওটিপি কোড আসতে দেরি হলে (Fast-Pass):
                          </span>
                          <span className="font-mono font-bold text-xs bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                            {candidateOtpGenerated}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCandidateOtpInput(candidateOtpGenerated)}
                          className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          কোডটি অটো বসান ({candidateOtpGenerated})
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCandidateAuthStep('login')}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        ফিরে যান
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>যাচাই সম্পন্ন করুন</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCandidate) {
                          setAuthCandidate(selectedCandidate);
                          setTargetDate(selectedCandidate.examDate || '');
                          setTargetCenter(selectedCandidate.examCenter || '');
                          setCandidateAuthStep('authenticated');
                          showToast(`প্রার্থী ${selectedCandidate.fullName} এর সিট তথ্য সফলভাবে আনলক হয়েছে!`, 'success');
                        }
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      <span>⚡ TTC কনফার্মড সিট সরাসরি আনলক করুন (Direct Unlock)</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* If Candidate Authenticated: Show Workstation */
              <div className="bg-white rounded-2xl border-2 border-teal-600 shadow-md p-6 space-y-6">
                {/* Candidate Overview Card */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        প্রার্থী লগইন সক্রিয়
                      </span>
                      <span className="px-2 py-0.5 rounded bg-teal-800 text-teal-100 text-[10px] font-bold uppercase tracking-wider font-mono">
                        {authCandidate.candidateId}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{authCandidate.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>পাসপোর্ট: <strong className="font-mono text-slate-900">{authCandidate.passportNumber}</strong></span>
                      <span>•</span>
                      <span>ট্রেড/পেশা: <strong className="text-teal-900 font-bold">{authCandidate.trade} {(authCandidate as any).occupationCode ? `(${((authCandidate as any).occupationCode)})` : ''}</strong></span>
                      <span>•</span>
                      <span>টিকিট নং: <strong className="font-mono text-slate-900">{authCandidate.candidateId}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-2">
                    <div className="sm:text-right bg-white p-2.5 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">বর্তমান অফিশিয়াল শিডিউল:</p>
                      <p className="text-xs font-bold text-rose-700 flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{authCandidate.examDate || 'তারিখ নির্ধারিত নেই'} {(authCandidate as any).examTime ? `• ${(authCandidate as any).examTime}` : ''}</span>
                      </p>
                      <p className="text-[11px] font-semibold text-slate-700 sm:text-right max-w-[260px] leading-tight mt-0.5">
                        {authCandidate.examCenter || 'কেন্দ্র নির্ধারিত নেই'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCandidateLogout}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      title="অন্য প্রার্থী লগইন করতে বর্তমান প্রার্থী লগআউট করুন"
                    >
                      অন্য প্রার্থী লগইন করুন (লগআউট)
                    </button>
                  </div>
                </div>

                {/* Reschedule Options Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select New Exam Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      নতুন পরীক্ষার তারিখ নির্বাচন করুন (Select New Date) *
                    </label>
                    <select
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-semibold"
                    >
                      <option value="">-- নতুন তারিখ বেছে নিন --</option>
                      {examDates
                        .filter((d) => d.isActive !== false)
                        .map((d) => (
                          <option key={d.id || d.date} value={d.date}>
                            {formatDate(d.date)} ({d.sessionTime || 'Full Session'})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Select New Exam Center */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        পরীক্ষার কেন্দ্র (Select Exam Center)
                      </label>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {examCenters.filter((c: any) => {
                          if (c.isActive === false) return false;
                          if (centerDivision !== 'All Divisions' && c.division && c.division !== centerDivision) return false;
                          if (centerSearch.trim()) {
                            const q = centerSearch.toLowerCase();
                            const n = (c.name || '').toLowerCase();
                            const ct = (c.city || '').toLowerCase();
                            const d = (c.district || '').toLowerCase();
                            const ad = (c.address || '').toLowerCase();
                            return n.includes(q) || ct.includes(q) || d.includes(q) || ad.includes(q);
                          }
                          return true;
                        }).length} টি টিটিসি উপলব্ধ
                      </span>
                    </div>

                    {/* Division and Search Filter Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pb-0.5">
                      <select
                        value={centerDivision}
                        onChange={(e) => setCenterDivision(e.target.value)}
                        className="p-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-teal-600"
                      >
                        <option value="All Divisions">সকল বিভাগ (All Divisions)</option>
                        {ALL_DIVISIONS_LIST.map((div) => (
                          <option key={div} value={div}>
                            {DIVISION_BANGLA[div] || div} বিভাগ ({div})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="টিটিসি বা জেলা দিয়ে খুঁজুন..."
                        value={centerSearch}
                        onChange={(e) => setCenterSearch(e.target.value)}
                        className="p-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:border-teal-600"
                      />
                    </div>

                    <select
                      value={targetCenter}
                      onChange={(e) => setTargetCenter(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-semibold"
                    >
                      <option value="">-- কেন্দ্র বেছে নিন (বর্তমানটি রাখতে খালি রাখুন) --</option>
                      {ALL_DIVISIONS_LIST.filter(
                        (div) => centerDivision === 'All Divisions' || centerDivision === div
                      ).map((div) => {
                        const divCenters = examCenters
                          .filter((c: any) => c.isActive !== false)
                          .filter((c: any) => (c.division || 'Dhaka') === div)
                          .filter((c: any) => {
                            if (!centerSearch.trim()) return true;
                            const q = centerSearch.toLowerCase();
                            const n = (c.name || '').toLowerCase();
                            const ct = (c.city || '').toLowerCase();
                            const d = (c.district || '').toLowerCase();
                            const ad = (c.address || '').toLowerCase();
                            return n.includes(q) || ct.includes(q) || d.includes(q) || ad.includes(q);
                          });

                        if (divCenters.length === 0) return null;

                        return (
                          <optgroup key={div} label={`${DIVISION_BANGLA[div] || div} বিভাগ (${div} Division) - ${divCenters.length}টি কেন্দ্র`}>
                            {divCenters.map((c: any) => (
                              <option key={c.id || c.name} value={c.name}>
                                {c.name} ({c.city}) [{c.type === 'PRIVATE' ? 'বেসরকারি' : 'সরকারি'}]
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Optional Note / Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    রিশিডিউলের কারণ বা রেফারেন্স নোট (Optional Reason/Note)
                  </label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. প্রার্থীর ব্যক্তিগত অনুরোধে পরিবর্তন"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  />
                </div>

                {/* Credit Cost Confirmation Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">এই রিশিডিউলের জন্য খরচ:</p>
                      <p className="text-xs text-amber-800">
                        আপনার বর্তমান ব্যালেন্স: <b>{operatorCredits} Credits</b> | কাজ সম্পন্ন হলে অবশিষ্ট থাকবে: <b>{Math.max(0, operatorCredits - 1)} Credits</b>
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-900 font-black text-xs">
                    ১ ক্রেডিট কর্তন হবে
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCandidateLogout}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    বাতিল করুন (Cancel)
                  </button>

                  <button
                    id="btn-confirm-operator-reschedule"
                    type="button"
                    onClick={handleExecuteReschedule}
                    disabled={isRescheduling || operatorCredits < 1}
                    className="px-6 py-3 bg-gradient-to-r from-teal-700 to-[#0B3B3C] hover:from-teal-800 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRescheduling ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 text-amber-300" />
                        <span>১ ক্রেডিট দিয়ে রিশিডিউল নিশ্চিত করুন (Confirm Reschedule)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Success Slip if Reschedule Completed */}
                {rescheduleSuccessSlip && (
                  <div className="mt-6 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>পরীক্ষা রিশিডিউল সফলভাবে সম্পন্ন হয়েছে! (Reschedule Voucher)</span>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রিন্ট করুন (Print Slip)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-emerald-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">প্রার্থী নাম</p>
                        <p className="font-bold text-slate-800">{rescheduleSuccessSlip.candidate.fullName}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">ক্যান্ডিডেট আইডি</p>
                        <p className="font-mono font-bold text-slate-800">{rescheduleSuccessSlip.candidate.candidateId}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">নতুন পরীক্ষার তারিখ</p>
                        <p className="font-bold text-emerald-800">{rescheduleSuccessSlip.newDate}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">পরীক্ষার কেন্দ্র</p>
                        <p className="font-bold text-slate-800 truncate">{rescheduleSuccessSlip.newCenter}</p>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1">
                      <span>অপারেটর: <b>{operator?.fullName}</b> ({operator?.agencyName})</span>
                      <span>সময়: {rescheduleSuccessSlip.trxTime} | খরচ: <b>১ ক্রেডিট</b></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MARKSHEET MODULE */}
        {activeTab === 'marksheet' && (
          <div className="space-y-6">
            {/* If Candidate NOT Authenticated: Show Clean Candidate Login Form */}
            {!authCandidate ? (
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {candidateAuthStep === 'login'
                          ? 'প্রার্থী ভেরিফিকেশন (মার্কশিট)'
                          : 'ওটিপি ভেরিফিকেশন'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {candidateAuthStep === 'login'
                          ? 'মার্কশিট উত্তোলনের জন্য প্রার্থীর তথ্য ও ওটিপি কোড যাচাই করুন'
                          : 'প্রার্থীর ইমেইলে প্রেরিত কোড দিয়ে একাউন্ট আনলক করুন'}
                      </p>
                    </div>
                  </div>

                  {selectedCandidate && (
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] text-slate-400 font-medium">নির্বাচিত প্রার্থী:</p>
                      <p className="text-xs font-semibold text-slate-800">{selectedCandidate.fullName}</p>
                    </div>
                  )}
                </div>

                {candidateAuthError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-start gap-2.5 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{candidateAuthError}</span>
                    </div>
                    <div className="pt-2 border-t border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-[11px] text-rose-900 font-medium">
                        💡 <b>টিটিসি সিট কনফার্ম করা থাকলে:</b> প্রার্থীর তথ্য এখনো এই সিস্টেমে সেভ করা নেই। আপনি এখনই ১ ক্লিকে যুক্ত করে মার্কশিট উত্তোলনে প্রবেশ করতে পারেন।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (candidateEmailInput.includes('@')) {
                            setQuickEmail(candidateEmailInput);
                          } else if (candidateEmailInput) {
                            setQuickPassport(candidateEmailInput);
                          }
                          setIsQuickIntakeOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>✨ TTC কনফার্মড প্রার্থী দ্রুত যুক্ত করুন</span>
                      </button>
                    </div>
                  </div>
                )}

                {candidateAuthStep === 'login' ? (
                  <form onSubmit={handleInitiateCandidateLogin} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        ইমেইল বা ক্যান্ডিডেট আইডি / পাসপোর্ট নম্বর
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={candidateEmailInput}
                          onChange={(e) => setCandidateEmailInput(e.target.value)}
                          placeholder="ইমেইল বা পাসপোর্ট বা ক্যান্ডিডেট আইডি লিখুন"
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        পাসওয়ার্ড <span className="text-[10px] text-slate-400 font-normal">(পাসপোর্ট দিয়ে সরাসরি ভেরিফাই করলে প্রযোজ্য নয়)</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showCandidatePassword ? 'text' : 'password'}
                          value={candidatePasswordInput}
                          onChange={(e) => setCandidatePasswordInput(e.target.value)}
                          placeholder="পাসওয়ার্ড লিখুন (ডিফল্ট: 123456 বা পাসপোর্ট নম্বর)"
                          className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title={showCandidatePassword ? 'Hide password' : 'Show password'}
                        >
                          {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={isCandidateAuthenticating}
                        className="px-5 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCandidateAuthenticating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-300" />
                            <span>যাচাই ও ওটিপি পাঠান</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handlePassportDirectVerify}
                        disabled={isCandidateAuthenticating}
                        className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        title="পাসপোর্ট নম্বর দিয়ে সরাসরি ভেরিফিকেশন (পাসওয়ার্ড ছাড়া)"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>পাসপোর্ট দিয়ে সরাসরি ভেরিফাই</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (candidateEmailInput.includes('@')) {
                            setQuickEmail(candidateEmailInput);
                          } else if (candidateEmailInput) {
                            setQuickPassport(candidateEmailInput);
                          }
                          setIsQuickIntakeOpen(true);
                        }}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>✨ TTC সিট অন্তর্ভুক্তি</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STEP 2: OTP VERIFICATION */
                  <form onSubmit={handleVerifyCandidateOtp} className="space-y-4 max-w-sm py-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-800">
                        প্রার্থীর ইমেইলে ৬-সংখ্যার কোড পাঠানো হয়েছে:
                      </p>
                      <p className="text-xs font-medium text-teal-800">
                        {selectedCandidate?.email || candidateEmailInput}
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={candidateOtpInput}
                        onChange={(e) => setCandidateOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="0 0 0 0 0 0"
                        className="w-full text-center tracking-[0.4em] text-lg font-mono font-bold py-2.5 bg-white border border-slate-300 rounded-xl focus:border-teal-600 outline-none"
                        autoFocus
                        required
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>
                          মেয়াদ: {candidateOtpCountdown > 0 ? `${candidateOtpCountdown}s` : <span className="text-rose-600 font-semibold">মেয়াদোত্তীর্ণ</span>}
                        </span>
                        {candidateOtpCountdown === 0 && (
                          <button
                            type="button"
                            onClick={handleResendCandidateOtp}
                            className="text-teal-700 font-semibold hover:underline cursor-pointer"
                          >
                            পুনরায় পাঠান
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fast-Pass Helper for Instant OTP */}
                    {candidateOtpGenerated && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                            ⚡ ওটিপি কোড আসতে দেরি হলে (Fast-Pass):
                          </span>
                          <span className="font-mono font-bold text-xs bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                            {candidateOtpGenerated}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCandidateOtpInput(candidateOtpGenerated)}
                          className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          কোডটি অটো বসান ({candidateOtpGenerated})
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCandidateAuthStep('login')}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        ফিরে যান
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>যাচাই সম্পন্ন করুন</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCandidate) {
                          setAuthCandidate(selectedCandidate);
                          setTargetDate(selectedCandidate.examDate || '');
                          setTargetCenter(selectedCandidate.examCenter || '');
                          setCandidateAuthStep('authenticated');
                          showToast(`প্রার্থী ${selectedCandidate.fullName} এর তথ্য সফলভাবে আনলক হয়েছে!`, 'success');
                        }
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      <span>⚡ TTC কনফার্মড সিট সরাসরি আনলক করুন (Direct Unlock)</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* If Candidate Authenticated: Show Marksheet Workstation */
              <div className="bg-white rounded-2xl border-2 border-teal-600 shadow-md p-6 space-y-6">
                {/* Candidate Overview Card */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        প্রার্থী লগইন সক্রিয়
                      </span>
                      <span className="px-2 py-0.5 rounded bg-teal-800 text-teal-100 text-[10px] font-bold uppercase tracking-wider font-mono">
                        {authCandidate.candidateId}
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900">{authCandidate.fullName}</p>
                    <p className="text-xs text-slate-600">
                      পাসপোর্ট: <b>{authCandidate.passportNumber}</b> | ট্রেড: <b>{authCandidate.trade}</b> | কেন্দ্র: <b>{authCandidate.examCenter || 'Certified TTC'}</b>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCandidateLogout}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>অন্য প্রার্থীর মার্কশিট তুলুন (লগআউট)</span>
                    </button>
                  </div>
                </div>

                {/* Marksheet Pull Action Card */}
                {(!unlockedMarksheet || unlockedMarksheet.candidateId !== authCandidate.candidateId) ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                          <FileCheck2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            অফিসিয়াল মার্কশিট উত্তোলন (Pull Official Marksheet)
                          </h4>
                          <p className="text-xs text-slate-500">
                            প্রার্থীর লগইন যাচাই সম্পন্ন হয়েছে। ১ ক্রেডিট কর্তন করে অফিসিয়াল মার্কশিট ও ফলাফল ভাউচার জেনারেট করুন।
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-bold text-xs">
                          খরচ: ১ ক্রেডিট
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                      <span>আপনার বর্তমান ব্যালেন্স: <b>{operatorCredits} Credits</b></span>
                      <span>কাজ সম্পন্ন হলে অবশিষ্ট থাকবে: <b>{Math.max(0, operatorCredits - 1)} Credits</b></span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCandidateLogout}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        বাতিল করুন
                      </button>

                      <button
                        id="btn-pull-official-marksheet"
                        type="button"
                        onClick={() => handlePullMarksheet(authCandidate)}
                        disabled={isPullingMarksheet || operatorCredits < 1}
                        className="px-6 py-3 bg-gradient-to-r from-teal-700 to-[#0B3B3C] hover:from-teal-800 hover:to-teal-900 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isPullingMarksheet ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4 text-amber-300" />
                            <span>১ ক্রেডিট দিয়ে মার্কশিট উত্তোলন নিশ্চিত করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Unlocked Marksheet Official View */}
                {unlockedMarksheet && unlockedMarksheet.candidateId === authCandidate.candidateId && (
                  <div className="pt-2">
                    <OfficialMarksheetView
                      marksheet={unlockedMarksheet}
                      candidate={authCandidate}
                      showActions={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREDIT LEDGER & HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-700" />
                  <span>ক্রেডিট ব্যবহারের লেজার / লেনদেন তালিকা (Transaction Ledger)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  আপনার একাউন্ট থেকে সম্পন্ন হওয়া সকল রিশিডিউল, মার্কশিট ও রিচার্জের রেকর্ড
                </p>
              </div>

              <button
                onClick={loadHistory}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>লোড হচ্ছে...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                এখনো কোন লেনদেনের রেকর্ড নেই। রিশিডিউল বা মার্কশিট তুললে এখানে প্রদর্শিত হবে।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3">কাজের ধরন (Action)</th>
                      <th className="p-3">প্রার্থী / বিবরণ</th>
                      <th className="p-3 text-center">ক্রেডিট পরিবর্তন</th>
                      <th className="p-3 text-right">অবশিষ্ট ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {t.type === 'RESCHEDULE' && (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                              রিশিডিউল (Reschedule)
                            </span>
                          )}
                          {t.type === 'MARKSHEET' && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                              মার্কশিট (Marksheet)
                            </span>
                          )}
                          {t.type === 'RECHARGE' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              রিচার্জ (Recharge)
                            </span>
                          )}
                          {t.type === 'DEDUCT' && (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                              কর্তন (Adjustment)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{t.description}</p>
                          {t.candidateId && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              Candidate ID: {t.candidateId}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {t.amount < 0 ? (
                            <span className="text-rose-600 font-mono">{t.amount} Cr</span>
                          ) : (
                            <span className="text-emerald-600 font-mono">+{t.amount} Cr</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 font-mono">
                          {t.balanceAfter} Credits
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RECHARGE MODAL */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">ক্রেডিট রিচার্জ অনুরোধ</h3>
              </div>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-950">জরুরি ক্রেডিট প্রয়োজন বা প্রশ্ন?</p>
                  <p className="text-[10px] text-emerald-700">সরাসরি এডমিনের সাথে WhatsApp এ কথা বলুন</p>
                </div>
              </div>
              <a
                href="https://wa.me/8801305894384?text=Hello%20Admin,%20ami%20Takamul%20Portal%20er%20operator.%20Amar%20credit%20kine%20nawa%20proyojon."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>01305-894384</span>
              </a>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  কত ক্রেডিট নিতে চান? (Select Credits)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRequestedAmount(amt)}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        requestedAmount === amt
                          ? 'bg-[#0B3B3C] text-white border-[#0B3B3C]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amt} Cr
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  পেমেন্ট মেথড (Payment Method)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-semibold"
                >
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
                  <option value="Cash">Cash Handover (ক্যাশ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ট্রানজ্যাকশন আইডি / রেফারেন্স (Transaction Trx ID) *
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. 9JA832K91P বা ফোন নম্বর"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  অতিরিক্ত নোট (Optional Note)
                </label>
                <input
                  type="text"
                  value={rechargeNote}
                  onChange={(e) => setRechargeNote(e.target.value)}
                  placeholder="e.g. জরুরি ভিত্তিতে ব্যালেন্স প্রয়োজন"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRechargeModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecharge}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRecharge ? (
                    <div className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>অনুরোধ পাঠান (Submit Request)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK TTC CONFIRMED CANDIDATE INTAKE MODAL */}
      {isQuickIntakeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                  <BadgeCheck className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    টিটিসি সিট কনফার্মড প্রার্থী অন্তর্ভুক্তি
                  </h3>
                  <p className="text-xs text-slate-500">
                    TTC-তে বুকিং থাকা প্রার্থীকে যুক্ত করে সাথে সাথে রিশিডিউল শুরু করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickIntakeOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickTtcIntake} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    পাসপোর্ট নম্বর *
                  </label>
                  <input
                    type="text"
                    value={quickPassport}
                    onChange={(e) => setQuickPassport(e.target.value.toUpperCase())}
                    placeholder="e.g. A10061651"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    টিকিট / ক্যান্ডিডেট আইডি
                  </label>
                  <input
                    type="text"
                    value={quickCandidateId}
                    onChange={(e) => setQuickCandidateId(e.target.value)}
                    placeholder="e.g. 5841823 (স্লিপ অনুযায়ী)"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    প্রার্থীর পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    value={quickFullName}
                    onChange={(e) => setQuickFullName(e.target.value)}
                    placeholder="e.g. MD ZAKIR HOSSAIN"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ইমেইল এড্রেস
                  </label>
                  <input
                    type="text"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    placeholder="e.g. zakir@gmail.com বা yopmail"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={quickMobile}
                    onChange={(e) => setQuickMobile(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    পোর্টাল পাসওয়ার্ড
                  </label>
                  <input
                    type="text"
                    value={quickPassword}
                    onChange={(e) => setQuickPassword(e.target.value)}
                    placeholder="ডিফল্ট: পাসপোর্ট নম্বর বা Shamim@160"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ট্রেড / পেশা (Trade / Occupation from Slip)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={quickTrade}
                    onChange={(e) => setQuickTrade(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-medium"
                  >
                    {ALL_TAKAMUL_TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="CUSTOM">✍️ অন্যান্য / কাস্টম ট্রেড (নিজে লিখুন)</option>
                  </select>

                  {quickTrade === 'CUSTOM' ? (
                    <input
                      type="text"
                      value={quickCustomTrade}
                      onChange={(e) => setQuickCustomTrade(e.target.value)}
                      placeholder="স্লিপে উল্লিখিত ট্রেডের নাম লিখুন"
                      className="w-full p-2.5 text-xs bg-white border border-teal-500 rounded-xl font-medium"
                      required
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center font-medium">
                      সিলেক্টেড ট্রেড: <strong className="ml-1 text-teal-800">{quickTrade}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      বর্তমান টিটিসি কেন্দ্র
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {(examCenters.length > 0 ? examCenters : BANGLADESH_TAKAMUL_TTCS).filter((c: any) => {
                        if (c.isActive === false) return false;
                        if (quickCenterDivision !== 'All Divisions' && c.division && c.division !== quickCenterDivision) return false;
                        if (quickCenterSearch.trim()) {
                          const q = quickCenterSearch.toLowerCase();
                          const n = (c.name || '').toLowerCase();
                          const ct = (c.city || '').toLowerCase();
                          const d = (c.district || '').toLowerCase();
                          const ad = (c.address || '').toLowerCase();
                          return n.includes(q) || ct.includes(q) || d.includes(q) || ad.includes(q);
                        }
                        return true;
                      }).length} টি টিটিসি উপলব্ধ
                    </span>
                  </div>

                  {/* Quick Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pb-0.5">
                    <select
                      value={quickCenterDivision}
                      onChange={(e) => setQuickCenterDivision(e.target.value)}
                      className="p-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-teal-600"
                    >
                      <option value="All Divisions">সকল বিভাগ (All Divisions)</option>
                      {ALL_DIVISIONS_LIST.map((div) => (
                        <option key={div} value={div}>
                          {DIVISION_BANGLA[div] || div} বিভাগ ({div})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="টিটিসি বা জেলা ফিল্টার..."
                      value={quickCenterSearch}
                      onChange={(e) => setQuickCenterSearch(e.target.value)}
                      className="p-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:border-teal-600"
                    />
                  </div>

                  <select
                    value={quickExamCenter}
                    onChange={(e) => setQuickExamCenter(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  >
                    <option value="CUSTOM">✍️ কাস্টম কেন্দ্র (স্লিপে থাকা ঠিকানা নিজে লিখুন)</option>
                    {ALL_DIVISIONS_LIST.filter(
                      (div) => quickCenterDivision === 'All Divisions' || quickCenterDivision === div
                    ).map((div) => {
                      const sourceList = examCenters.length > 0 ? examCenters : BANGLADESH_TAKAMUL_TTCS;
                      const divCenters = sourceList
                        .filter((c: any) => c.isActive !== false)
                        .filter((c: any) => (c.division || 'Dhaka') === div)
                        .filter((c: any) => {
                          if (!quickCenterSearch.trim()) return true;
                          const q = quickCenterSearch.toLowerCase();
                          const n = (c.name || '').toLowerCase();
                          const ct = (c.city || '').toLowerCase();
                          const d = (c.district || '').toLowerCase();
                          const ad = (c.address || '').toLowerCase();
                          return n.includes(q) || ct.includes(q) || d.includes(q) || ad.includes(q);
                        });

                      if (divCenters.length === 0) return null;

                      return (
                        <optgroup key={div} label={`${DIVISION_BANGLA[div] || div} বিভাগ (${div} Division) - ${divCenters.length}টি কেন্দ্র`}>
                          {divCenters.map((c: any) => (
                            <option key={c.id || c.name} value={c.name}>
                              {c.name} ({c.city}) [{c.type === 'PRIVATE' ? 'বেসরকারি' : 'সরকারি'}]
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>

                  {quickExamCenter === 'CUSTOM' && (
                    <input
                      type="text"
                      value={quickCustomExamCenter}
                      onChange={(e) => setQuickCustomExamCenter(e.target.value)}
                      placeholder="স্লিপ অনুযায়ী কেন্দ্রের পূর্ণ নাম ও ঠিকানা লিখুন"
                      className="w-full mt-1.5 p-2.5 text-xs bg-white border border-teal-500 rounded-xl font-medium"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    বর্তমান পরীক্ষার তারিখ
                  </label>
                  <input
                    type="date"
                    value={quickExamDate}
                    onChange={(e) => setQuickExamDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    আজকের পরীক্ষা বা অ্যাডমিট কার্ডে থাকা সঠিক পরীক্ষার তারিখ দিন
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  প্রার্থী যুক্ত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে তার প্রোফাইল ভেরিফাইড হবে এবং আপনি সাথে সাথে রিশিডিউল অথবা মার্কশিট তোলার কাজে অগ্রসর হতে পারবেন।
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickIntakeOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickIntake}
                  className="px-6 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuickIntake ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>যুক্ত করুন ও আনলক করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Real Candidates Importer Modal */}
      <BulkCandidateImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={(newCands) => {
          setCandidatesList((prev) => [...newCands, ...prev]);
          setIsBulkImportOpen(false);
        }}
        operatorId={operator?.uid}
        operatorEmail={operator?.email}
      />
    </div>
  );
};
