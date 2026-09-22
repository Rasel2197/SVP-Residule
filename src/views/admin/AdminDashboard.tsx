import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  ArrowRight,
  Database,
  History,
  AlertTriangle,
  Coins
} from 'lucide-react';
import {
  getAllCandidates,
  getAllDateRequests,
  getAllCenterRequests,
  getAllMarksheets,
  seedInitialPortalData,
} from '../../services/apiService';
import { Candidate, DateChangeRequest, CenterChangeRequest, Marksheet } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dateRequests, setDateRequests] = useState<DateChangeRequest[]>([]);
  const [centerRequests, setCenterRequests] = useState<CenterChangeRequest[]>([]);
  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [cands, dReqs, cReqs, marks] = await Promise.all([
        getAllCandidates(),
        getAllDateRequests(),
        getAllCenterRequests(),
        getAllMarksheets(),
      ]);
      setCandidates(cands);
      setDateRequests(dReqs);
      setCenterRequests(cReqs);
      setMarksheets(marks);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedInitialPortalData();
      showToast('Development seed data initialized successfully!', 'success');
      await loadAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to seed data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const pendingDateCount = dateRequests.filter((r) => r.status === 'PENDING').length;
  const pendingCenterCount = centerRequests.filter((r) => r.status === 'PENDING').length;
  const passedCount = marksheets.filter((m) => m.resultStatus === 'PASS').length;
  const failedCount = marksheets.filter((m) => m.resultStatus === 'FAIL').length;
  const upcomingExamCount = candidates.filter((c) => c.examStatus === 'UPCOMING').length;

  const pendingRequestsCombined = [
    ...dateRequests
      .filter((r) => r.status === 'PENDING')
      .map((r) => ({ ...r, type: 'DATE' as const })),
    ...centerRequests
      .filter((r) => r.status === 'PENDING')
      .map((r) => ({ ...r, type: 'CENTER' as const })),
  ].slice(0, 5);

  return (
    <div id="admin-dashboard-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0B3B3C] text-white p-6 sm:p-8 rounded-3xl border border-[#145658] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full">
              Takamul Examination Governance • Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
            Oversee examination sessions, candidate enrollments, marksheet publishing, and change approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('admin-operators')}
            className="px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-900" />
            Users & Credits (অপারেটর)
          </button>
          <button
            id="btn-seed-demo-data"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="px-4 py-2.5 text-xs font-bold text-[#0B3B3C] bg-white hover:bg-slate-100 rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#0B3B3C]" />
            {isSeeding ? 'Populating Records...' : 'Load Demo Seed Data'}
          </button>
          <button
            onClick={() => onNavigate('admin-candidates')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#145658] hover:bg-[#196B6E] border border-teal-400/40 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Manage Candidates
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Candidates</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{candidates.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Enrolled records</p>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Upcoming</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{upcomingExamCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Booked sessions</p>
        </div>

        {/* Pending Date Requests */}
        <div
          onClick={() => onNavigate('admin-date-requests')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Date Reqs</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{pendingDateCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending review</p>
        </div>

        {/* Pending Center Requests */}
        <div
          onClick={() => onNavigate('admin-center-requests')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Center Reqs</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{pendingCenterCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending review</p>
        </div>

        {/* Passed Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{passedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Certified competent</p>
        </div>

        {/* Failed Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Failed</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{failedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Re-take scheduled</p>
        </div>
      </div>

      {/* Navigation Quick Panels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <button
          onClick={() => onNavigate('admin-operators')}
          className="p-3.5 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition-all"
        >
          <Coins className="w-5 h-5 text-amber-600 mb-1.5" />
          <p className="text-xs font-bold text-amber-950">Users & Credits</p>
          <span className="text-[10px] text-amber-700">Operators / ব্যালেন্স</span>
        </button>

        <button
          onClick={() => onNavigate('admin-candidates')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <Users className="w-5 h-5 text-blue-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Candidates</p>
          <span className="text-[10px] text-slate-500">Registry & Profiles</span>
        </button>

        <button
          onClick={() => onNavigate('admin-date-requests')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <Clock className="w-5 h-5 text-amber-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Date Requests</p>
          <span className="text-[10px] text-slate-500">{pendingDateCount} Awaiting</span>
        </button>

        <button
          onClick={() => onNavigate('admin-center-requests')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <Building2 className="w-5 h-5 text-indigo-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Center Requests</p>
          <span className="text-[10px] text-slate-500">{pendingCenterCount} Awaiting</span>
        </button>

        <button
          onClick={() => onNavigate('admin-marksheets')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <FileText className="w-5 h-5 text-emerald-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Marksheets</p>
          <span className="text-[10px] text-slate-500">Grading & Transcripts</span>
        </button>

        <button
          onClick={() => onNavigate('admin-exam-dates')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <Calendar className="w-5 h-5 text-purple-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Exam Dates</p>
          <span className="text-[10px] text-slate-500">Session Slots</span>
        </button>

        <button
          onClick={() => onNavigate('admin-exam-centers')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <Building2 className="w-5 h-5 text-teal-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Exam Centers</p>
          <span className="text-[10px] text-slate-500">Venues & Capacity</span>
        </button>

        <button
          onClick={() => onNavigate('admin-audit-logs')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all"
        >
          <History className="w-5 h-5 text-slate-700 mb-1.5" />
          <p className="text-xs font-bold text-slate-900">Audit Logs</p>
          <span className="text-[10px] text-slate-500">Security Trail</span>
        </button>
      </div>

      {/* Pending Submissions Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Change Requests Requiring Action</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve or reject candidate rescheduling requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('admin-date-requests')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View Date Queue ({pendingDateCount}) →
            </button>
          </div>
        </div>

        {pendingRequestsCombined.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">All change requests have been reviewed.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">There are no pending submissions in the queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequestsCombined.map((req) => (
              <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-700">
                      {req.type === 'DATE' ? 'Date Change' : 'Center Relocation'}
                    </span>
                    <strong className="text-xs text-slate-900">{req.candidateName}</strong>
                    <span className="text-[11px] text-slate-500 font-mono">({req.candidateId})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {req.type === 'DATE'
                      ? `Requesting date change: ${(req as any).currentExamDate} → ${(req as any).requestedExamDate}`
                      : `Requesting center relocation: ${(req as any).currentExamCenter} → ${(req as any).requestedExamCenter}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onNavigate(req.type === 'DATE' ? 'admin-date-requests' : 'admin-center-requests')}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Open Review Modal →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
