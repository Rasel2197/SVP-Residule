import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  X,
  CreditCard,
  Phone,
  Mail,
  Wrench,
  ArrowLeft
} from 'lucide-react';
import {
  getAllCandidates,
  getAvailableExamDates,
  getAvailableExamCenters,
  createCandidateByAdmin,
  updateCandidateByAdmin,
  deleteCandidateByAdmin,
} from '../../services/apiService';
import { Candidate, ExamDate, ExamCenter, ExamStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatDate } from '../../utils/rules';

interface AdminCandidatesProps {
  onNavigate: (view: string) => void;
  onSelectCandidateForMarksheet?: (candidate: Candidate) => void;
}

const TRADES = [
  'Electrical Installation',
  'Pipe Fitting & Welding',
  'HVAC Technology & Refrigeration',
  'Automotive Mechanics',
  'Industrial Carpentry',
  'Masonry & Tiling',
  'Heavy Equipment Operation',
  'Plumbing & Sanitation',
];

export const AdminCandidates: React.FC<AdminCandidatesProps> = ({
  onNavigate,
  onSelectCandidateForMarksheet,
}) => {
  const { showToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [examCenters, setExamCenters] = useState<ExamCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isCreatingCandidate, setIsCreatingCandidate] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for create / edit
  const [formData, setFormData] = useState<{
    fullName: string;
    candidateId: string;
    passportNumber: string;
    mobileNumber: string;
    email: string;
    trade: string;
    dateOfBirth: string;
    examDateId: string;
    examDate: string;
    examCenterId: string;
    examCenter: string;
    examStatus: ExamStatus;
    uid?: string;
  }>({
    fullName: '',
    candidateId: '',
    passportNumber: '',
    mobileNumber: '',
    email: '',
    trade: TRADES[0],
    dateOfBirth: '1995-01-01',
    examDateId: '',
    examDate: '',
    examCenterId: '',
    examCenter: '',
    examStatus: 'UPCOMING',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cands, dates, centers] = await Promise.all([
        getAllCandidates(),
        getAvailableExamDates(),
        getAvailableExamCenters(),
      ]);
      setCandidates(cands);
      setExamDates(dates);
      setExamCenters(centers);
    } catch (err) {
      console.error('Failed to load candidate directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCandidates = candidates.filter((cand) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      cand.fullName.toLowerCase().includes(q) ||
      cand.candidateId.toLowerCase().includes(q) ||
      cand.passportNumber.toLowerCase().includes(q) ||
      cand.email.toLowerCase().includes(q);

    const matchTrade = selectedTrade === 'ALL' || cand.trade === selectedTrade;
    const matchStatus = selectedStatus === 'ALL' || cand.examStatus === selectedStatus;

    return matchQuery && matchTrade && matchStatus;
  });

  const openCreateModal = () => {
    setFormData({
      fullName: '',
      candidateId: `TK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      passportNumber: '',
      mobileNumber: '',
      email: '',
      trade: TRADES[0],
      dateOfBirth: '1996-01-01',
      examDateId: examDates[0]?.id || '',
      examDate: examDates[0]?.date || '',
      examCenterId: examCenters[0]?.id || '',
      examCenter: examCenters[0]?.name || '',
      examStatus: 'UPCOMING',
    });
    setIsCreatingCandidate(true);
  };

  const openEditModal = (cand: Candidate) => {
    setEditingCandidate(cand);
    setFormData({
      fullName: cand.fullName,
      candidateId: cand.candidateId,
      passportNumber: cand.passportNumber,
      mobileNumber: cand.mobileNumber,
      email: cand.email,
      trade: cand.trade,
      dateOfBirth: cand.dateOfBirth,
      examDateId: cand.examDateId || '',
      examDate: cand.examDate || '',
      examCenterId: cand.examCenterId || '',
      examCenter: cand.examCenter || '',
      examStatus: cand.examStatus,
    });
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isCreatingCandidate) {
        await createCandidateByAdmin(formData);
        showToast('New candidate record enrolled successfully.', 'success');
        setIsCreatingCandidate(false);
      } else if (editingCandidate) {
        await updateCandidateByAdmin(editingCandidate.id, formData);
        showToast('Candidate record updated successfully.', 'success');
        setEditingCandidate(null);
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save candidate.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCandidateByAdmin(candidateToDelete.id, candidateToDelete.candidateId);
      showToast('Candidate record removed successfully.', 'success');
      setCandidateToDelete(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete candidate.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="admin-candidates-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate Directory</h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse registered candidates, assign exam dates and centers, and manage enrollment data.
          </p>
        </div>

        <button
          id="btn-add-new-candidate"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Enroll New Candidate
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-search-candidates"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, ID (e.g. TK-2026), passport, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            id="select-filter-trade"
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
          >
            <option value="ALL">All Trades</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            id="select-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading registered candidates...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No candidates matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Trade</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4">Exam Center</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{cand.candidateId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{cand.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Pass: {cand.passportNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{cand.trade}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {formatDate(cand.examDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                      {cand.examCenter || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cand.examStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="View Profile"
                          onClick={() => setViewCandidate(cand)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Candidate"
                          onClick={() => openEditModal(cand)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Marksheet Management"
                          onClick={() => {
                            if (onSelectCandidateForMarksheet) {
                              onSelectCandidateForMarksheet(cand);
                            }
                            onNavigate('admin-marksheets');
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete Record"
                          onClick={() => setCandidateToDelete(cand)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Candidate Details Modal */}
      {viewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setViewCandidate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Candidate Profile Dossier</h3>
            <p className="text-xs text-slate-500 mb-4">Complete registry parameters and assigned testing metadata.</p>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Full Name:</span>
                <strong className="text-slate-900">{viewCandidate.fullName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Candidate ID:</span>
                <strong className="font-mono text-slate-900">{viewCandidate.candidateId}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Passport Number:</span>
                <strong className="font-mono text-slate-900">{viewCandidate.passportNumber}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Mobile Phone:</span>
                <strong className="text-slate-900">{viewCandidate.mobileNumber}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Email Address:</span>
                <strong className="text-slate-900">{viewCandidate.email}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Assessed Trade:</span>
                <strong className="text-slate-900">{viewCandidate.trade}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Date of Birth:</span>
                <strong className="text-slate-900">{formatDate(viewCandidate.dateOfBirth)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Scheduled Exam Date:</span>
                <strong className="text-blue-700">{formatDate(viewCandidate.examDate)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Testing Center:</span>
                <strong className="text-slate-900">{viewCandidate.examCenter || 'Pending Center'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Examination Status:</span>
                <StatusBadge status={viewCandidate.examStatus} size="sm" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setViewCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Candidate Modal */}
      {(isCreatingCandidate || editingCandidate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-6 relative my-8">
            <button
              onClick={() => {
                setIsCreatingCandidate(false);
                setEditingCandidate(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isCreatingCandidate ? 'Enroll Candidate Record' : `Edit Candidate: ${editingCandidate?.candidateId}`}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter verified candidate particulars and allocate exam sessions.
            </p>

            <form onSubmit={handleSaveCandidate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.candidateId}
                    onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                    className="w-full p-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Passport Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 uppercase bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessed Trade *</label>
                  <select
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Examination Status *</label>
                  <select
                    value={formData.examStatus}
                    onChange={(e) => setFormData({ ...formData, examStatus: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Exam Date</label>
                  <select
                    value={formData.examDateId}
                    onChange={(e) => {
                      const selected = examDates.find((d) => d.id === e.target.value);
                      setFormData({
                        ...formData,
                        examDateId: e.target.value,
                        examDate: selected?.date || '',
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">-- Select Exam Date --</option>
                    {examDates.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.date} ({d.sessionTime} - {d.trade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Testing Center</label>
                  <select
                    value={formData.examCenterId}
                    onChange={(e) => {
                      const selected = examCenters.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        examCenterId: e.target.value,
                        examCenter: selected?.name || '',
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">-- Select Center --</option>
                    {examCenters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCandidate(false);
                    setEditingCandidate(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving Record...' : 'Save Candidate Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!candidateToDelete}
        title="Delete Candidate Record"
        message={`Are you sure you want to delete candidate ${candidateToDelete?.fullName} (${candidateToDelete?.candidateId})? This action cannot be reversed.`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setCandidateToDelete(null)}
      />
    </div>
  );
};
