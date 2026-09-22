import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getAvailableExamDates, submitDateChangeRequest, getDateRequestsByCandidate } from '../../services/apiService';
import { ExamDate, DateChangeRequest } from '../../types';
import { checkThreeDayCutoff, formatDate } from '../../utils/rules';

interface ChangeExamDateProps {
  onNavigate: (view: string) => void;
}

export const ChangeExamDate: React.FC<ChangeExamDateProps> = ({ onNavigate }) => {
  const { candidate, refreshCandidate } = useAuth();
  const { showToast } = useToast();

  const [availableDates, setAvailableDates] = useState<ExamDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<ExamDate | null>(null);
  const [reason, setReason] = useState('');
  const [pendingRequest, setPendingRequest] = useState<DateChangeRequest | null>(null);
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
        const [dates, myRequests] = await Promise.all([
          getAvailableExamDates(candidate.trade),
          getDateRequestsByCandidate(candUid),
        ]);

        // Filter out current exam date
        const filtered = dates.filter((d) => d.date !== candidate.examDate);
        setAvailableDates(filtered);

        const existingPending = myRequests.find((r) => r.status === 'PENDING');
        setPendingRequest(existingPending || null);
      } catch (err) {
        console.error('Failed to load exam dates:', err);
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

    // Strict Frontend Pre-check (backend service also checks)
    if (isCutoffPassed) {
      setErrorMessage('Exam date change is no longer available because the exam is less than 3 days away.');
      return;
    }

    if (pendingRequest) {
      setErrorMessage('You already have a pending date change request under review.');
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Please select a target examination date from the available list.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!candidate || !selectedDate) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitDateChangeRequest({
        candidate,
        targetExamDateId: selectedDate.id,
        targetExamDateStr: selectedDate.date,
        reason: reason.trim(),
      });

      setShowConfirmModal(false);
      showToast('Your request has been submitted successfully.', 'success');
      await refreshCandidate();
      onNavigate('candidate-history');
    } catch (err: any) {
      console.error('Date change request failed:', err);
      setErrorMessage(err.message || 'Failed to submit date change request.');
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="candidate-change-date-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Request Exam Date Change</h1>
          <p className="text-sm text-slate-600 mt-1">
            Submit an official rescheduling request subject to committee approval.
          </p>
        </div>
      </div>

      {/* 3-Day Rule Status Card */}
      <div
        id="date-change-cutoff-box"
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
                {isCutoffPassed ? 'Rescheduling Locked (3-Day Cutoff Rule)' : 'Rescheduling Window Open'}
              </h3>
              {cutoff && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white/70 rounded-md">
                  {cutoff.daysRemaining} days remaining
                </span>
              )}
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              {isCutoffPassed
                ? 'Exam date change is no longer available because the exam is less than 3 days away.'
                : `Cutoff policy: Rescheduling must be submitted at least 3 full days prior to the test date (Cutoff deadline: ${cutoff?.cutoffDateStr}).`}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Pending Request Warning */}
      {pendingRequest && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pending Request in Progress:</span> You have already submitted a date change request for <strong>{pendingRequest.requestedExamDate}</strong> on {pendingRequest.requestDate}. You cannot create a duplicate request while this is pending review.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Assignment Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Current Assigned Schedule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-500">Current Exam Date</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatDate(candidate?.examDate)} ({candidate?.examDate || 'Unassigned'})
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Assigned Center</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {candidate?.examCenter || 'Pending Center'}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Trade Track</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {candidate?.trade || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Future Dates Selection Form */}
      <form onSubmit={handleOpenConfirm} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Select New Available Date</h2>
          <p className="text-xs text-slate-500">
            Dates with open seating capacity matching your trade qualification.
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading available examination sessions...</div>
        ) : availableDates.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Alternative Exam Dates Currently Available</p>
            <p className="text-xs text-slate-500 mt-1">
              All upcoming sessions are either full or not yet published. Check back soon or consult portal support.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableDates.map((item) => {
              const isSelected = selectedDate?.id === item.id;
              const remainingCapacity = item.capacity - item.bookedCount;
              const isFull = remainingCapacity <= 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`date-option-${item.id}`}
                  disabled={isCutoffPassed || !!pendingRequest || isFull}
                  onClick={() => setSelectedDate(item)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                      : isFull
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                      {formatDate(item.date)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 mt-1">{item.sessionTime}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.trade}</div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className={isFull ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                      {isFull ? 'Session Full' : `${remainingCapacity} seats available`}
                    </span>
                    {isSelected && (
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
            Reason for Rescheduling Request (Optional)
          </label>
          <textarea
            id="textarea-date-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isCutoffPassed || !!pendingRequest}
            placeholder="e.g. Schedule conflict with employer work shift or emergency."
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
            id="btn-submit-date-request"
            type="submit"
            disabled={isCutoffPassed || !!pendingRequest || !selectedDate}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            Submit Change Request
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Confirmation Dialog per prompt requirement */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Exam Date Reschedule Request"
        message={`Are you sure you want to submit this change request? You are requesting to change your exam date from ${candidate?.examDate} to ${selectedDate?.date}. This request will require administrative review before your official record is updated.`}
        confirmText="Yes, Submit Request"
        cancelText="Review Again"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
