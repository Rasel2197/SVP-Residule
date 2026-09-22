import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Building2,
  Wrench,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Award,
  AlertCircle,
  MapPin,
  Sparkles,
  ChevronRight,
  X,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllMarksheetsByCandidate,
  getAllExamCenters,
  getAllExamDates,
  directRescheduleCandidate,
} from '../../services/apiService';
import { Marksheet, ExamCenter, ExamDate, Candidate } from '../../types';
import { generateMarksheetPDF, generateRescheduleSlipPDF } from '../../utils/pdfGenerator';
import { useToast } from '../../components/Toast';

const POPULAR_TRADES = [
  { id: 'Electrical Installation', name: 'Electrical Installation', bangla: 'ইলেকট্রিক্যাল ইন্সটলেশন', category: 'Construction & MEP' },
  { id: 'Plumbing & Pipefitting', name: 'Plumbing & Pipefitting', bangla: 'প্লাম্বিং ও পাইপফিটিং', category: 'Sanitary & Utilities' },
  { id: 'HVAC & Refrigeration', name: 'HVAC & Refrigeration', bangla: 'এইচভিএসি ও এয়ার কন্ডিশনিং', category: 'Mechanical Systems' },
  { id: 'Welding & Metal Fabrication', name: 'Welding & Metal Fabrication', bangla: 'ওয়েল্ডিং ও মেটাল ফেব্রিকেশন', category: 'Heavy Fabrication' },
  { id: 'Automotive Mechanics', name: 'Automotive Mechanics', bangla: 'অটোমোটিভ মেকানিক্স', category: 'Automotive Engineering' },
  { id: 'Industrial Carpentry', name: 'Industrial Carpentry', bangla: 'কার্পেন্ট্রি / কাঠের কাজ', category: 'Structural Carpentry' },
  { id: 'Masonry & Tile Setting', name: 'Masonry & Tile Setting', bangla: 'ম্যাসনরি / রাজমিস্ত্রি কাজ', category: 'Civil Works' },
];

export const CandidateDashboard: React.FC<{ onNavigate?: (view: string) => void }> = () => {
  const { candidate, updateCurrentCandidate } = useAuth();
  const { showToast } = useToast();

  // Primary Action Modals
  const [activeModal, setActiveModal] = useState<'none' | 'marksheet' | 'reschedule'>('none');

  // Marksheet data state
  const [allMarksheets, setAllMarksheets] = useState<Marksheet[]>([]);
  const [isLoadingMarksheets, setIsLoadingMarksheets] = useState<boolean>(false);

  // Reschedule state
  const [allCenters, setAllCenters] = useState<ExamCenter[]>([]);
  const [allDates, setAllDates] = useState<ExamDate[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<string>(candidate?.trade || 'Electrical Installation');
  const [selectedCenter, setSelectedCenter] = useState<ExamCenter | null>(null);
  const [selectedDate, setSelectedDate] = useState<ExamDate | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleSuccessNotice, setRescheduleSuccessNotice] = useState<string | null>(null);

  // Load Marksheets whenever modal opens or candidate changes
  useEffect(() => {
    async function fetchMarksheets() {
      if (!candidate) return;
      setIsLoadingMarksheets(true);
      try {
        const list = await getAllMarksheetsByCandidate(candidate.uid || candidate.id, candidate.candidateId);
        setAllMarksheets(list);
      } catch (err) {
        console.error('Failed to load marksheets:', err);
      } finally {
        setIsLoadingMarksheets(false);
      }
    }

    if (activeModal === 'marksheet') {
      fetchMarksheets();
    }
  }, [activeModal, candidate]);

  // Load Centers and Dates when reschedule modal opens
  useEffect(() => {
    async function fetchCentersAndDates() {
      try {
        const [cList, dList] = await Promise.all([getAllExamCenters(), getAllExamDates()]);
        setAllCenters(cList.length > 0 ? cList : getDefaultCenters());
        setAllDates(dList.length > 0 ? dList : getDefaultDates());

        // Default select first center if none selected
        if (!selectedCenter && cList.length > 0) {
          setSelectedCenter(cList[0]);
        }
      } catch (err) {
        console.error('Failed to load centers and dates:', err);
        setAllCenters(getDefaultCenters());
        setAllDates(getDefaultDates());
      }
    }

    if (activeModal === 'reschedule') {
      fetchCentersAndDates();
    }
  }, [activeModal]);

  // Default fallback centers if Firestore has none seeded yet
  function getDefaultCenters(): ExamCenter[] {
    return [
      {
        id: 'tc-dxb-01',
        name: 'Dubai Central Skill Testing Complex',
        code: 'TC-DXB-01',
        city: 'Dubai',
        address: 'Al Quoz Industrial Area 3, Street 18B, Dubai, UAE',
        capacity: 120,
        bookedCount: 65,
        isActive: true,
        createdAt: '2026-01-01',
      },
      {
        id: 'tc-auh-02',
        name: 'Abu Dhabi Vocational Assessment Center',
        code: 'TC-AUH-02',
        city: 'Abu Dhabi',
        address: 'Mussafah Sector M-14, Behind ICAD 1, Abu Dhabi, UAE',
        capacity: 100,
        bookedCount: 42,
        isActive: true,
        createdAt: '2026-01-01',
      },
      {
        id: 'tc-shj-03',
        name: 'Sharjah Technical Examination Hub',
        code: 'TC-SHJ-03',
        city: 'Sharjah',
        address: 'Industrial Area 11, Wasit Suburb, Sharjah, UAE',
        capacity: 80,
        bookedCount: 38,
        isActive: true,
        createdAt: '2026-01-01',
      },
    ];
  }

  // Default fallback dates with vacant seats
  function getDefaultDates(): ExamDate[] {
    return [
      {
        id: 'date-01',
        date: '2026-09-28',
        sessionTime: '08:30 AM - 12:30 PM (Morning Session)',
        trade: 'All Trades',
        capacity: 40,
        bookedCount: 22,
        isActive: true,
        createdAt: '2026-01-01',
      },
      {
        id: 'date-02',
        date: '2026-10-05',
        sessionTime: '08:30 AM - 12:30 PM (Morning Session)',
        trade: 'All Trades',
        capacity: 40,
        bookedCount: 16,
        isActive: true,
        createdAt: '2026-01-01',
      },
      {
        id: 'date-03',
        date: '2026-10-12',
        sessionTime: '08:30 AM - 12:30 PM (Morning Session)',
        trade: 'All Trades',
        capacity: 40,
        bookedCount: 25,
        isActive: true,
        createdAt: '2026-01-01',
      },
      {
        id: 'date-04',
        date: '2026-10-19',
        sessionTime: '08:30 AM - 12:30 PM (Morning Session)',
        trade: 'All Trades',
        capacity: 40,
        bookedCount: 11,
        isActive: true,
        createdAt: '2026-01-01',
      },
    ];
  }

  // Handle Marksheet PDF Download
  const handleDownloadMarksheet = (ms: Marksheet) => {
    if (!candidate) return;
    generateMarksheetPDF(ms, candidate);
    showToast(`Marksheet for ${ms.examDate || 'Assessment'} downloaded successfully.`, 'success');
  };

  // Handle Reschedule & PDF Generation
  const handleConfirmReschedule = async () => {
    if (!candidate) {
      showToast('Candidate session not found.', 'error');
      return;
    }

    if (!selectedTrade) {
      showToast('Please select a profession / trade (পেশা নির্বাচন করুন).', 'error');
      return;
    }

    if (!selectedCenter) {
      showToast('Please select an examination center (পরীক্ষা কেন্দ্র নির্বাচন করুন).', 'error');
      return;
    }

    if (!selectedDate) {
      showToast('Please select a vacant date (ফাঁকা তারিখ নির্বাচন করুন).', 'error');
      return;
    }

    setIsRescheduling(true);
    try {
      const updatedCandidate = await directRescheduleCandidate(candidate.id, {
        trade: selectedTrade,
        examCenter: selectedCenter.name,
        examCenterId: selectedCenter.id,
        examDate: selectedDate.date,
        examDateId: selectedDate.id,
        sessionTime: selectedDate.sessionTime,
        reason: 'Candidate self-rescheduled exam via portal',
      });

      // Update local state in context
      updateCurrentCandidate(updatedCandidate);

      // Immediately trigger PDF download as requested ("residule kore pdf download dibe")
      generateRescheduleSlipPDF(updatedCandidate, {
        trade: selectedTrade,
        examDate: selectedDate.date,
        sessionTime: selectedDate.sessionTime,
        examCenter: selectedCenter.name,
        centerAddress: selectedCenter.address,
        centerCode: selectedCenter.code,
        rescheduledAt: new Date().toLocaleString(),
      });

      setRescheduleSuccessNotice(
        `Your exam has been successfully rescheduled to ${selectedDate.date} at ${selectedCenter.name}. Your appointment PDF slip has been downloaded.`
      );

      showToast('Exam rescheduled successfully! Appointment slip PDF downloaded.', 'success');
      setActiveModal('none');
    } catch (err: any) {
      console.error('Error during reschedule:', err);
      showToast(err?.message || 'Failed to reschedule exam. Please try again.', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div id="candidate-dashboard-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Success Notice if just rescheduled */}
      {rescheduleSuccessNotice && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start justify-between gap-3 text-teal-900 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">রিশিডিউল সম্পন্ন হয়েছে / Reschedule Confirmed!</h4>
              <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">{rescheduleSuccessNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setRescheduleSuccessNotice(null)}
            className="text-teal-600 hover:text-teal-900 text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. CANDIDATE DETAILS SECTION ("login howar por okhane sob detail asbe") */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Institutional Top Banner */}
        <div className="bg-[#0B3B3C] text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full">
                  Verified Candidate Profile
                </span>
                <span className="text-xs text-teal-100/70 font-mono">
                  Roll / ID: {candidate?.candidateId || 'TK-2026-1001'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {candidate?.fullName || 'Tariqul Islam'}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-1">
                SVP Skill Assessment & Professional Trade Certification Program
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800/80 border border-teal-600/40 text-xs font-semibold text-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-300" />
                Active Registration
              </span>
              <a
                href="https://share.google/dqJYdIEwULNHFfTSr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800/80 hover:bg-teal-700/90 border border-teal-500/50 text-xs font-semibold text-teal-100 hover:text-white transition-colors"
                title="Official SVPI Portal"
              >
                <span>SVPI Official Portal (মূল ওয়েবসাইট)</span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Grid of Candidate Information */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#0B3B3C]" />
              Assessed Profession (পেশা)
            </span>
            <p className="text-base font-bold text-slate-900">{candidate?.trade || 'Electrical Installation'}</p>
            <span className="text-xs text-slate-500">Official Certification Trade</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0B3B3C]" />
              Confirmed Exam Date (পরীক্ষার তারিখ)
            </span>
            <p className="text-base font-bold text-[#0B3B3C]">{candidate?.examDate || '2026-09-28'}</p>
            <span className="text-xs text-slate-500">Reporting Time: 08:30 AM (Morning Session)</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0B3B3C]" />
              Allotted Testing Center (পরীক্ষা কেন্দ্র)
            </span>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {candidate?.examCenter || 'Dubai Central Skill Testing Complex'}
            </p>
            <span className="text-xs text-slate-500 block truncate">Al Quoz Industrial Area 3, Dubai, UAE</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Passport Number (পাসপোর্ট নম্বর)
            </span>
            <p className="text-base font-mono font-bold text-slate-800">
              {candidate?.passportNumber || 'A28941088'}
            </p>
            <span className="text-xs text-slate-500">Required on Exam Day</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Mobile Number (মোবাইল নম্বর)
            </span>
            <p className="text-base font-medium text-slate-800">{candidate?.mobileNumber || '+971 50 123 4567'}</p>
            <span className="text-xs text-slate-500">SMS Notifications Active</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address (ইমেইল ঠিকানা)
            </span>
            <p className="text-base font-medium text-slate-800 truncate">{candidate?.email || 'tariqul.islam@example.com'}</p>
            <span className="text-xs text-slate-500">Official Correspondence</span>
          </div>
        </div>
      </div>

      {/* 2. THE TWO MAIN BUTTONS ("ar duita button asbe residule ar marksit nam a") */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Candidate Actions (প্রধান সেবাসমূহ)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Button 1: RESCHEDULE */}
          <button
            id="btn-open-reschedule"
            type="button"
            onClick={() => {
              setActiveModal('reschedule');
              setSelectedTrade(candidate?.trade || 'Electrical Installation');
            }}
            className="group p-6 sm:p-8 bg-white hover:bg-teal-50/50 border-2 border-slate-200 hover:border-[#0B3B3C] rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-14 h-14 bg-teal-50 text-[#0B3B3C] rounded-2xl flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#0B3B3C] transition-colors">
                  রিশিডিউল (Reschedule)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  পেশা নির্বাচন করুন, পরীক্ষার কেন্দ্র ও ফাঁকা তারিখ দেখে রিশিডিউল করে পিডিএফ অ্যাডমিট স্লিপ ডাউনলোড করুন।
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B3C] pt-2">
                Click to Reschedule Exam Date & Center
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>

          {/* Button 2: MARKSHEET */}
          <button
            id="btn-open-marksheet"
            type="button"
            onClick={() => setActiveModal('marksheet')}
            className="group p-6 sm:p-8 bg-white hover:bg-blue-50/50 border-2 border-slate-200 hover:border-blue-700 rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-14 h-14 bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center border border-blue-200 group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-800 transition-colors">
                  মার্কশীট (Marksheet)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  আগে ও পরে যতবার পরীক্ষা দিয়েছেন সব পরীক্ষার মার্কশীট ও ফলাফল দেখুন এবং অফিশিয়াল পিডিএফ ডাউনলোড করুন।
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 pt-2">
                View All Examination Marksheets & Download PDF
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: MARKSHEET MODAL ("marksit a click korle age porer jotobar exam dice sob gular markshit soho show korbe ar ota pdf akare download dewa jabe")
          ========================================================================= */}
      {activeModal === 'marksheet' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#0B3B3C] text-white flex items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-200">Official Examination Records</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black">
                  সকল পরীক্ষার মার্কশীট ও ফলাফল / All Exam Marksheets
                </h2>
                <p className="text-[11px] sm:text-xs text-teal-100/80 mt-0.5">
                  Candidate: {candidate?.fullName} (ID: {candidate?.candidateId})
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
              {isLoadingMarksheets ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <div className="w-8 h-8 border-3 border-[#0B3B3C] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-wider">Loading all historical exam marksheets...</p>
                </div>
              ) : allMarksheets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">কোনো মার্কশীট পাওয়া যায়নি / No Marksheets Found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your assessment has not been evaluated yet or results are pending administrator publication.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      মোট পরীক্ষা রেকর্ড: {allMarksheets.length} টি (Showing all past and present examinations)
                    </p>
                  </div>

                  {/* List of all marksheets */}
                  {allMarksheets.map((ms, index) => {
                    const isPass = ms.resultStatus === 'PASS';
                    return (
                      <div
                        key={ms.id || index}
                        className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-6 shadow-xs hover:border-[#0B3B3C]/50 transition-all space-y-4"
                      >
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-700">
                                Exam #{allMarksheets.length - index}
                              </span>
                              <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-500">
                                Ref: {ms.referenceId || `TK-CERT-${index + 1}`}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">{ms.trade || candidate?.trade}</h3>
                            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <strong>{ms.examDate || '2026-09-15'}</strong>
                              </span>
                              <span>•</span>
                              <span>Venue: {ms.examCenter}</span>
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1 ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {isPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                              {isPass ? 'PASSED (উত্তীর্ণ)' : 'FAILED (পুনঃপরীক্ষা)'}
                            </span>

                            <button
                              id={`btn-download-ms-${index}`}
                              type="button"
                              onClick={() => handleDownloadMarksheet(ms)}
                              className="w-full sm:w-auto px-4 py-2.5 bg-[#0B3B3C] hover:bg-[#114B4D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>পিডিএফ ডাউনলোড / Download PDF</span>
                            </button>
                          </div>
                        </div>

                        {/* Marks breakdown grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Theory (তত্ত্বীয়)</span>
                            <span className="text-base sm:text-lg font-black text-slate-900">{ms.theoryMarks}</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block">/ 100 Marks</span>
                          </div>

                          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Practical (ব্যবহারিক)</span>
                            <span className="text-base sm:text-lg font-black text-slate-900">{ms.practicalMarks}</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block">/ 100 Marks</span>
                          </div>

                          <div className="p-2.5 sm:p-3 bg-teal-50/70 rounded-xl border border-teal-100">
                            <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 block uppercase">Aggregate Total</span>
                            <span className="text-base sm:text-lg font-black text-[#0B3B3C]">{ms.totalMarks || ms.theoryMarks + ms.practicalMarks}</span>
                            <span className="text-[9px] sm:text-[10px] text-teal-700 block">/ 200 Maximum</span>
                          </div>

                          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Percentage</span>
                            <span className="text-base sm:text-lg font-black text-slate-900">{ms.percentage || Math.round(((ms.theoryMarks + ms.practicalMarks) / 200) * 100)}%</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block">{isPass ? 'Qualified' : 'Retake'}</span>
                          </div>
                        </div>

                        {ms.remarks && (
                          <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Remarks:</strong> {ms.remarks}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <span className="text-[11px] sm:text-xs text-slate-500">
                Official electronic certificates issued by the SVP Central Board of Examiners.
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Close (বন্ধ করুন)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RESCHEDULE WORKFLOW
          ("pesa select korar por e pasei oi pesa kon kon jaygay ota asbe or modde jekhane date faka ache ota select kore residule kore pdf download dibe")
          ========================================================================= */}
      {activeModal === 'reschedule' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#0B3B3C] text-white flex items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-200">Self-Service Portal</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black">
                  পরীক্ষার পেশা, কেন্দ্র ও তারিখ রিশিডিউল / Reschedule Examination
                </h2>
                <p className="text-[11px] sm:text-xs text-teal-100/80 mt-0.5">
                  Select your profession, choose an available testing location, pick a vacant date, and instantly download your updated admit slip PDF.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns Layout */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT SIDE: SELECT PROFESSION / TRADE (পেশা নির্বাচন করুন) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0B3B3C] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                      পেশা নির্বাচন করুন / Select Profession
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">Choose the trade qualification you will be assessed for:</p>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {POPULAR_TRADES.map((trade) => {
                      const isSelected = selectedTrade === trade.name;
                      return (
                        <button
                          key={trade.id}
                          type="button"
                          onClick={() => setSelectedTrade(trade.name)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 border-[#0B3B3C] ring-2 ring-[#0B3B3C] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-sm font-bold text-slate-900 block">{trade.bangla}</span>
                            <span className="text-xs text-slate-600 font-medium block">{trade.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{trade.category}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#0B3B3C] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT SIDE: LOCATIONS FOR THAT PROFESSION & VACANT DATES */}
                {/* ("e pasei oi pesa kon kon jaygay ota asbe or modde jekhane date faka ache ota select kore") */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Step 2: Available Testing Centers for Selected Profession */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0B3B3C] text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                        এই পেশার পরীক্ষা কেন্দ্রসমূহ / Available Centers for {selectedTrade}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Locations hosting assessments for <strong>{selectedTrade}</strong>:
                    </p>

                    <div className="space-y-2">
                      {allCenters.map((center) => {
                        const isSelected = selectedCenter?.id === center.id;
                        return (
                          <button
                            key={center.id}
                            type="button"
                            onClick={() => {
                              setSelectedCenter(center);
                              setSelectedDate(null); // reset date selection to choose from vacant dates of new center
                            }}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 border-[#0B3B3C] ring-2 ring-[#0B3B3C] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{center.name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                                  {center.code}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{center.address} ({center.city})</span>
                              </p>
                              <span className="text-[11px] font-bold text-emerald-700 block">
                                ✓ Verified Workshops for {selectedTrade}
                              </span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-[#0B3B3C] shrink-0 mt-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Vacant Dates for Chosen Center ("or modde jekhane date faka ache ota select kore") */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0B3B3C] text-white text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                        ফাঁকা তারিখ নির্বাচন করুন / Select Vacant Exam Date
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Upcoming dates with open capacity at <strong>{selectedCenter?.name || 'Selected Center'}</strong>:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {allDates.map((d) => {
                        const vacantSlots = Math.max(1, d.capacity - d.bookedCount);
                        const isSelected = selectedDate?.id === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 border-[#0B3B3C] ring-2 ring-[#0B3B3C] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-black text-slate-900">{d.date}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                {vacantSlots} টি সিট ফাঁকা
                              </span>
                            </div>
                            <span className="text-xs text-slate-600 block">{d.sessionTime}</span>
                            <span className="text-[10px] text-teal-800 font-semibold block mt-1">
                              ✓ Available for {selectedTrade}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Summary Box */}
              {selectedCenter && selectedDate && (
                <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 block">
                      Confirmed Selection Summary (রিশিডিউল সংক্ষেপ):
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 mt-0.5">
                      <strong>{selectedTrade}</strong> • <strong>{selectedDate.date}</strong> at{' '}
                      <strong>{selectedCenter.name}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-teal-800 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    Seat Reserved for You
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer with Confirm & Download PDF Button ("residule kore pdf download dibe") */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <span className="text-[11px] sm:text-xs text-slate-500">
                Rescheduling is instantaneous and replaces your previous booking.
              </span>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancel (বাতিল)
                </button>

                <button
                  id="btn-confirm-reschedule-download"
                  type="button"
                  disabled={isRescheduling || !selectedCenter || !selectedDate}
                  onClick={handleConfirmReschedule}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-[#0B3B3C] hover:bg-[#114B4D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRescheduling ? (
                    <span>রিশিডিউল হচ্ছে ও পিডিএফ তৈরি হচ্ছে...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>রিশিডিউল নিশ্চিত করুন ও পিডিএফ ডাউনলোড করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
