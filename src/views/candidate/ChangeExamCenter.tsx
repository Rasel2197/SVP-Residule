import React, { useEffect, useState } from 'react';
import { Building2, AlertCircle, Clock, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getAvailableExamCenters, submitCenterChangeRequest, getCenterRequestsByCandidate } from '../../services/apiService';
import { ExamCenter, CenterChangeRequest } from '../../types';
import { checkThreeDayCutoff } from '../../utils/rules';

interface ChangeExamCenterProps {
  onNavigate: (view: string) => void;
}

export const ChangeExamCenter: React.FC<ChangeExamCenterProps> = ({ onNavigate }) => {
  const { candidate, refreshCandidate } = useAuth();
  const { showToast } = useToast();

  const [availableCenters, setAvailableCenters] = useState<ExamCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<ExamCenter | null>(null);
  const [reason, setReason] = useState('');
  const [pendingRequest, setPendingRequest] = useState<CenterChangeRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cutoff = candidate?.examDate ? checkThreeDayCutoff(candidate.examDate) : null;
  const isCutoffPassed = cutoff ? !cutoff.allowed : true;

  useEffect(() => {
    async function loadData() {
      if (!candidate) return;
      const candUid = candidate.uid || candidate.candidateId;
      setIsLoading(true);
      try {
        const [centers, myRequests] = await Promise.all([
          getAvailableExamCenters(),
          getCenterRequestsByCandidate(candUid),
        ]);

        // Filter out current exam center
        const filtered = centers.filter((c) => c.name !== candidate.examCenter);
        setAvailableCenters(filtered);

        const existingPending = myRequests.find((r) => r.status === 'PENDING');
        setPendingRequest(existingPending || null);
      } catch (err) {
        console.error('Failed to load exam centers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [candidate]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!candidate) return;

    if (isCutoffPassed) {
      setErrorMessage('Exam center change is no longer available because the exam is less than 3 days away.');
      return;
    }

    if (pendingRequest) {
      setErrorMessage('You already have a pending center change request under review.');
      return;
    }

    if (!selectedCenter) {
      setErrorMessage('Please select a target examination center from the available venues.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!candidate || !selectedCenter) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitCenterChangeRequest({
        candidate,
        targetCenterId: selectedCenter.id,
        targetCenterName: selectedCenter.name,
        reason: reason.trim(),
      });

      setShowConfirmModal(false);
      showToast('Your request has been submitted successfully.', 'success');
      await refreshCandidate();
      onNavigate('candidate-history');
    } catch (err: any) {
      console.error('Center change request failed:', err);
      setErrorMessage(err.message || 'Failed to submit center change request.');
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="candidate-change-center-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Request Exam Center Relocation</h1>
          <p className="text-sm text-slate-600 mt-1">
            Choose an alternative accredited examination facility closer to your location.
          </p>
        </div>
      </div>

      {/* 3-Day Rule Status Card */}
      <div
        id="center-change-cutoff-box"
        className={`p-5 rounded-2xl border ${
          isCutoffPassed
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {isCutoffPassed ? (
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isCutoffPassed ? 'Center Relocation Locked (3-Day Cutoff Rule)' : 'Center Relocation Window Open'}
              </h3>
              {cutoff && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white/70 rounded-md">
                  {cutoff.daysRemaining} days remaining
                </span>
              )}
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              {isCutoffPassed
                ? 'Exam center change is no longer available because the exam is less than 3 days away.'
                : `Cutoff policy: Center adjustments must be requested at least 3 full days before the exam date (Cutoff deadline: ${cutoff?.cutoffDateStr}).`}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Pending Request Warning */}
      {pendingRequest && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pending Request in Progress:</span> You have already submitted a center relocation request for <strong>{pendingRequest.requestedExamCenter}</strong> on {pendingRequest.requestDate}. Only one pending request is permitted at a time.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Center Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Current Center Assignment
        </h2>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{candidate?.examCenter || 'No Center Assigned Yet'}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled Date: <strong>{candidate?.examDate || 'Pending'}</strong> • Trade: <strong>{candidate?.trade}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Available Centers Selection Form */}
      <form onSubmit={handleOpenConfirm} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Select Alternative Exam Center</h2>
          <p className="text-xs text-slate-500">
            Certified technical testing centers currently accepting candidates.
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading testing centers...</div>
        ) : availableCenters.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Alternative Exam Centers Currently Available</p>
            <p className="text-xs text-slate-500 mt-1">
              All other testing centers are at capacity or inactive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableCenters.map((item) => {
              const isSelected = selectedCenter?.id === item.id;
              const remainingCapacity = item.capacity - item.bookedCount;
              const isFull = remainingCapacity <= 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`center-option-${item.id}`}
                  disabled={isCutoffPassed || !!pendingRequest || isFull}
                  onClick={() => setSelectedCenter(item)}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                      : isFull
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.city}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.address}</p>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {isFull ? 'Center At Capacity' : `${remainingCapacity} available seats`}
                    </span>
                    {isSelected && (
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Reason for Center Relocation (Optional)
          </label>
          <textarea
            id="textarea-center-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isCutoffPassed || !!pendingRequest}
            placeholder="e.g. Relocated to accommodation closer to Dubai center."
            className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('candidate-dashboard')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-submit-center-request"
            type="submit"
            disabled={isCutoffPassed || !!pendingRequest || !selectedCenter}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            Submit Center Request
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Exam Center Change Request"
        message={`Are you sure you want to submit this change request? You are requesting to change your exam venue from "${candidate?.examCenter || 'Current Center'}" to "${selectedCenter?.name}". Your record will be updated once reviewed by the administrator.`}
        confirmText="Yes, Submit Request"
        cancelText="Review Again"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
