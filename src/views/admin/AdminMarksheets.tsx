import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Download,
  Eye,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Award,
  Hash
} from 'lucide-react';
import {
  getAllCandidates,
  getAllMarksheets,
  issueOrUpdateMarksheet,
} from '../../services/apiService';
import { Candidate, Marksheet } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { generateMarksheetPDF } from '../../utils/pdfGenerator';
import { formatDate } from '../../utils/rules';

interface AdminMarksheetsProps {
  onNavigate: (view: string) => void;
  preSelectedCandidate?: Candidate | null;
}

export const AdminMarksheets: React.FC<AdminMarksheetsProps> = ({
  onNavigate,
  preSelectedCandidate,
}) => {
  const { userProfile, currentUser } = useAuth();
  const { showToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Issue/Edit Modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [existingMarksheet, setExistingMarksheet] = useState<Marksheet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Preview Modal
  const [previewMarksheet, setPreviewMarksheet] = useState<Marksheet | null>(null);

  // Form Fields
  const [theoryMarks, setTheoryMarks] = useState<number>(75);
  const [practicalMarks, setPracticalMarks] = useState<number>(80);
  const [remarks, setRemarks] = useState<string>('Candidate demonstrated sound workshop competency.');

  const adminEmail = userProfile?.email || currentUser?.email || 'admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cands, marks] = await Promise.all([getAllCandidates(), getAllMarksheets()]);
      setCandidates(cands);
      setMarksheets(marks);
    } catch (err) {
      console.error('Failed to load marksheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preSelectedCandidate) {
      openIssueModal(preSelectedCandidate);
    }
  }, [preSelectedCandidate, marksheets]);

  const openIssueModal = (cand: Candidate) => {
    setSelectedCandidate(cand);
    const existing = marksheets.find((m) => m.candidateUid === cand.uid);
    setExistingMarksheet(existing || null);

    if (existing) {
      setTheoryMarks(existing.theoryMarks);
      setPracticalMarks(existing.practicalMarks);
      setRemarks(existing.remarks || '');
    } else {
      setTheoryMarks(75);
      setPracticalMarks(80);
      setRemarks('Certified competency assessment completed.');
    }
    setIsModalOpen(true);
  };

  const totalCalculated = Number(theoryMarks || 0) + Number(practicalMarks || 0);
  const isPassCalculated = theoryMarks >= 50 && practicalMarks >= 50 && totalCalculated >= 100;

  const handleSaveMarksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (theoryMarks < 0 || theoryMarks > 100 || practicalMarks < 0 || practicalMarks > 100) {
      showToast('Marks must be between 0 and 100 for each section.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await issueOrUpdateMarksheet({
        candidate: selectedCandidate,
        theoryMarks: Number(theoryMarks),
        practicalMarks: Number(practicalMarks),
        remarks: remarks.trim(),
        adminEmail,
      });

      showToast(`Marksheet issued successfully for ${selectedCandidate.fullName}.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to issue marksheet.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = (ms: Marksheet) => {
    const cand = candidates.find((c) => c.uid === ms.candidateUid);
    generateMarksheetPDF(ms, cand);
    showToast(`Downloaded marksheet PDF for ${ms.candidateName}.`, 'success');
  };

  const filteredCandidates = candidates.filter((cand) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      cand.fullName.toLowerCase().includes(q) ||
      cand.candidateId.toLowerCase().includes(q) ||
      cand.trade.toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-marksheets-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Marksheet & Grade Registry</h1>
          <p className="text-sm text-slate-600 mt-1">
            Grade candidate examination components, compute Pass/Fail certifications, and issue transcripts.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, ID, or trade track..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>
      </div>

      {/* Candidate List with Marksheet Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading marksheets and candidates...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">No candidate records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Trade</th>
                  <th className="py-3 px-4">Marksheet Status</th>
                  <th className="py-3 px-4">Theory / Pract. / Total</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand) => {
                  const ms = marksheets.find((m) => m.candidateUid === cand.uid);
                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{cand.candidateId}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{cand.fullName}</td>
                      <td className="py-3 px-4 text-slate-700">{cand.trade}</td>
                      <td className="py-3 px-4">
                        {ms ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Pending Grading
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {ms ? `${ms.theoryMarks} / ${ms.practicalMarks} (${ms.totalMarks}/200)` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {ms ? <StatusBadge status={ms.resultStatus} size="sm" /> : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ms && (
                            <>
                              <button
                                title="View Marksheet"
                                onClick={() => setPreviewMarksheet(ms)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                title="Download PDF"
                                onClick={() => handleDownloadPDF(ms)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openIssueModal(cand)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            {ms ? 'Update Marks' : 'Issue Marksheet'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue / Edit Marksheet Modal */}
      {isModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {existingMarksheet ? 'Update Official Marksheet' : 'Issue Official Marksheet'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Recording verified scores for candidate <strong>{selectedCandidate.fullName}</strong> ({selectedCandidate.candidateId}).
            </p>

            <form onSubmit={handleSaveMarksheet} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Candidate:</span>
                  <strong className="text-slate-900">{selectedCandidate.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Trade Track:</span>
                  <strong className="text-slate-900">{selectedCandidate.trade}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Exam Date:</span>
                  <strong className="text-slate-900">{formatDate(selectedCandidate.examDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Testing Center:</span>
                  <strong className="text-slate-900">{selectedCandidate.examCenter || 'Certified Bay'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Theory Marks (Max 100) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={theoryMarks}
                    onChange={(e) => setTheoryMarks(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                  <span className="text-[10px] text-slate-500">Min 50 to pass</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Practical Marks (Max 100) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={practicalMarks}
                    onChange={(e) => setPracticalMarks(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                  <span className="text-[10px] text-slate-500">Min 50 to pass</span>
                </div>
              </div>

              {/* Live Aggregate Preview Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isPassCalculated
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                    Computed Score & Standing
                  </span>
                  <p className="text-base font-extrabold mt-0.5">
                    {totalCalculated} / 200 Marks Total
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                      isPassCalculated ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isPassCalculated ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Examiner Evaluation Notes</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Completed all electrical terminal connections within allotted time limit."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Publishing...' : 'Publish Official Marksheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Marksheet Modal */}
      {previewMarksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewMarksheet(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Official Marksheet Record</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ref: <strong className="font-mono">{previewMarksheet.referenceId}</strong> • Issued: {formatDate(previewMarksheet.issueDate)}
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Candidate:</span>
                  <strong className="text-slate-900">{previewMarksheet.candidateName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Candidate ID:</span>
                  <strong className="text-slate-900 font-mono">{previewMarksheet.candidateId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Trade:</span>
                  <strong className="text-slate-900">{previewMarksheet.trade}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Exam Date:</span>
                  <strong className="text-slate-900">{formatDate(previewMarksheet.examDate)}</strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Paper / Component</th>
                      <th className="p-2.5 text-center">Score</th>
                      <th className="p-2.5 text-center">Pass Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">Section 1: Theoretical Assessment</td>
                      <td className="p-2.5 text-center font-bold">{previewMarksheet.theoryMarks} / 100</td>
                      <td className="p-2.5 text-center text-slate-500">50</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Section 2: Practical Workshop Execution</td>
                      <td className="p-2.5 text-center font-bold">{previewMarksheet.practicalMarks} / 100</td>
                      <td className="p-2.5 text-center text-slate-500">50</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2.5">Cumulative Total Score</td>
                      <td className="p-2.5 text-center text-blue-700 font-extrabold">
                        {previewMarksheet.totalMarks} / 200
                      </td>
                      <td className="p-2.5 text-center text-slate-500">100</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  previewMarksheet.resultStatus === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="font-bold">Result Classification:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-900 uppercase">
                  {previewMarksheet.resultStatus}
                </span>
              </div>

              {previewMarksheet.remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Remarks:</span>
                  {previewMarksheet.remarks}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Certified by: {previewMarksheet.issuedBy}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMarksheet(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(previewMarksheet)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
