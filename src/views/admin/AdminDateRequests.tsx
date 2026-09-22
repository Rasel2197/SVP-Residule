import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Check, X, ArrowLeft, Search, Filter, AlertCircle } from 'lucide-react';
import { getAllDateRequests, approveDateChangeRequest, rejectDateChangeRequest } from '../../services/apiService';
import { DateChangeRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/rules';

interface AdminDateRequestsProps {
  onNavigate: (view: string) => void;
}

export const AdminDateRequests: React.FC<AdminDateRequestsProps> = ({ onNavigate }) => {
  const { userProfile, currentUser } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<DateChangeRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Reject modal state
  const [rejectingRequest, setRejectingRequest] = useState<DateChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const adminEmail = userProfile?.email || currentUser?.email || 'admin';

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDateRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load date requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: DateChangeRequest) => {
    if (!confirm(`Approve date change for candidate ${req.candidateName} to ${req.requestedExamDate}?`)) return;
    setIsProcessing(true);
    try {
      await approveDateChangeRequest(req.id, adminEmail);
      showToast(`Approved request for ${req.candidateName}. Exam date updated.`, 'success');
      await loadRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    setIsProcessing(true);
    try {
      await rejectDateChangeRequest(
        rejectingRequest.id,
        adminEmail,
        rejectReason.trim() || 'Session rescheduling rejected by examination committee.'
      );
      showToast(`Request rejected for ${rejectingRequest.candidateName}.`, 'info');
      setRejectingRequest(null);
      setRejectReason('');
      await loadRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      r.candidateName.toLowerCase().includes(q) ||
      r.candidateId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  return (
    <div id="admin-date-requests-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Exam Date Change Requests</h1>
          <p className="text-sm text-slate-600 mt-1">
            Review candidate rescheduling petitions and verify seat availability before approval.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or Candidate ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
          >
            <option value="ALL">All Submissions</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading change requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No date change requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Current Date</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      #{req.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{req.candidateName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{req.candidateId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {formatDate(req.currentExamDate)}
                    </td>
                    <td className="py-3 px-4 text-blue-700 font-bold">
                      {formatDate(req.requestedExamDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.requestDate}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectReason('');
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {req.reviewedBy ? `Decided by ${req.reviewedBy}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setRejectingRequest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Reject Date Change Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide an official notification reason for {rejectingRequest.candidateName}.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Target examination session has reached certified examiner capacity."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
