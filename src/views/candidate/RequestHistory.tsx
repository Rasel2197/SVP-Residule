import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Building2, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDateRequestsByCandidate, getCenterRequestsByCandidate } from '../../services/apiService';
import { DateChangeRequest, CenterChangeRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/rules';

interface RequestHistoryProps {
  onNavigate: (view: string) => void;
}

export const RequestHistory: React.FC<RequestHistoryProps> = ({ onNavigate }) => {
  const { candidate } = useAuth();
  const [dateRequests, setDateRequests] = useState<DateChangeRequest[]>([]);
  const [centerRequests, setCenterRequests] = useState<CenterChangeRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'date' | 'center'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!candidate) return;
      const candUid = candidate.uid || candidate.candidateId;
      setIsLoading(true);
      try {
        const [dates, centers] = await Promise.all([
          getDateRequestsByCandidate(candUid),
          getCenterRequestsByCandidate(candUid),
        ]);
        setDateRequests(dates);
        setCenterRequests(centers);
      } catch (err) {
        console.error('Failed to load candidate requests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, [candidate]);

  return (
    <div id="candidate-history-view" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Change Request History</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track administrative decisions on your exam date and examination center change submissions.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All ({dateRequests.length + centerRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('date')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'date' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Date Changes ({dateRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('center')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'center' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Center Changes ({centerRequests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          Loading submission history...
        </div>
      ) : dateRequests.length === 0 && centerRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Change Requests Submitted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not submitted any exam date or testing center modification requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Date Requests Section */}
          {(activeTab === 'all' || activeTab === 'date') && dateRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Exam Date Rescheduling Submissions
              </h3>
              {dateRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        REQ #{req.id.substring(0, 8)}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <span className="text-xs text-slate-500">
                      Submitted on: <strong>{req.requestDate}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Current Exam Date:</span>
                      <strong className="text-slate-800 text-sm">{formatDate(req.currentExamDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Requested Exam Date:</span>
                      <strong className="text-blue-700 text-sm">{formatDate(req.requestedExamDate)}</strong>
                    </div>
                  </div>

                  {req.reason && (
                    <p className="text-xs text-slate-600">
                      <strong>Candidate Reason:</strong> {req.reason}
                    </p>
                  )}

                  {req.adminNote && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 border border-slate-200">
                      <strong>Administrator Note:</strong> {req.adminNote}
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Reviewed by: {req.reviewedBy}</span>
                      {req.reviewedAt && <span>Decision time: {new Date(req.reviewedAt).toLocaleString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Center Requests Section */}
          {(activeTab === 'all' || activeTab === 'center') && centerRequests.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Exam Center Relocation Submissions
              </h3>
              {centerRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        REQ #{req.id.substring(0, 8)}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <span className="text-xs text-slate-500">
                      Submitted on: <strong>{req.requestDate}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Current Assigned Center:</span>
                      <strong className="text-slate-800 text-sm">{req.currentExamCenter}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Requested Target Center:</span>
                      <strong className="text-indigo-700 text-sm">{req.requestedExamCenter}</strong>
                    </div>
                  </div>

                  {req.reason && (
                    <p className="text-xs text-slate-600">
                      <strong>Candidate Reason:</strong> {req.reason}
                    </p>
                  )}

                  {req.adminNote && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 border border-slate-200">
                      <strong>Administrator Note:</strong> {req.adminNote}
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Reviewed by: {req.reviewedBy}</span>
                      {req.reviewedAt && <span>Decision time: {new Date(req.reviewedAt).toLocaleString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
