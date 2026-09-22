import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, ArrowLeft, CheckCircle2, XCircle, X } from 'lucide-react';
import { getAvailableExamDates, createExamDate, deleteExamDate } from '../../services/apiService';
import { ExamDate } from '../../types';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../utils/rules';

interface AdminExamDatesProps {
  onNavigate: (view: string) => void;
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

export const AdminExamDates: React.FC<AdminExamDatesProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: '2026-10-15',
    sessionTime: '09:00 AM - 01:00 PM',
    trade: TRADES[0],
    capacity: 25,
    bookedCount: 0,
    isActive: true,
  });

  const loadDates = async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableExamDates();
      setExamDates(data);
    } catch (err) {
      console.error('Failed to load exam dates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createExamDate(formData);
      showToast('New exam date session scheduled successfully.', 'success');
      setIsModalOpen(false);
      await loadDates();
    } catch (err: any) {
      showToast(err.message || 'Failed to create exam date.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, dateStr: string) => {
    if (!confirm(`Delete exam session on ${dateStr}?`)) return;
    try {
      await deleteExamDate(id, dateStr);
      showToast('Exam date session deleted.', 'success');
      await loadDates();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete exam date.', 'error');
    }
  };

  return (
    <div id="admin-exam-dates-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Exam Date Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure examination testing schedules, trade constraints, and seat quotas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule New Exam Date
        </button>
      </div>

      {/* Exam Dates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm">
            Loading scheduled sessions...
          </div>
        ) : examDates.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Examination Dates Configured</p>
            <p className="text-xs text-slate-500 mt-1">
              Add your first exam session using the button above or load demo seed data.
            </p>
          </div>
        ) : (
          examDates.map((item) => {
            const availableSeats = item.capacity - (item.bookedCount || 0);
            const isFull = availableSeats <= 0;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatDate(item.date)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-mono">Date Key: {item.date}</p>
                  <p className="text-xs font-bold text-slate-800 mt-2">{item.sessionTime}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Assessed: {item.trade}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Seat Capacity:</span>
                      <strong className="text-slate-900">
                        {item.bookedCount || 0} / {item.capacity}
                      </strong>
                    </div>
                    {/* Visual Capacity Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isFull
                            ? 'bg-rose-500'
                            : availableSeats <= 5
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((item.bookedCount || 0) / item.capacity) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1 block text-right">
                      {isFull ? 'Capacity Full' : `${availableSeats} seats remaining`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ID: {item.id.substring(0, 6)}</span>
                  <button
                    onClick={() => handleDelete(item.id, item.date)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule New Exam Session</h3>
            <p className="text-xs text-slate-500 mb-4">Define date, trade scope, and maximum seat capacity.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Time Interval *</label>
                <input
                  type="text"
                  required
                  value={formData.sessionTime}
                  onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                  placeholder="e.g. 09:00 AM - 01:00 PM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Qualification *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Total Candidate Capacity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={200}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-active-date"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="chk-active-date" className="text-slate-700 font-semibold cursor-pointer">
                  Activate for candidate booking immediately
                </label>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save Exam Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
