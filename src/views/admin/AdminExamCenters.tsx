import React, { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, ArrowLeft, MapPin, X } from 'lucide-react';
import { getAvailableExamCenters, createExamCenter, deleteExamCenter } from '../../services/apiService';
import { ExamCenter } from '../../types';
import { useToast } from '../../components/Toast';

interface AdminExamCentersProps {
  onNavigate: (view: string) => void;
}

export const AdminExamCenters: React.FC<AdminExamCentersProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [centers, setCenters] = useState<ExamCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: 'Dubai',
    address: '',
    capacity: 100,
    bookedCount: 0,
    isActive: true,
  });

  const loadCenters = async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableExamCenters();
      setCenters(data);
    } catch (err) {
      console.error('Failed to load centers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createExamCenter(formData);
      showToast('New examination center registered successfully.', 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        code: '',
        city: 'Dubai',
        address: '',
        capacity: 100,
        bookedCount: 0,
        isActive: true,
      });
      await loadCenters();
    } catch (err: any) {
      showToast(err.message || 'Failed to create center.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete testing center "${name}"?`)) return;
    try {
      await deleteExamCenter(id, name);
      showToast('Exam center record deleted.', 'success');
      await loadCenters();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete exam center.', 'error');
    }
  };

  return (
    <div id="admin-exam-centers-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Exam Center Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Maintain authorized technical assessment facilities, testing bays, and maximum candidate capacities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Testing Center
        </button>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm">
            Loading testing venues...
          </div>
        ) : centers.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Testing Centers Configured</p>
            <p className="text-xs text-slate-500 mt-1">
              Add testing venues or click "Load Demo Seed Data" on the dashboard.
            </p>
          </div>
        ) : (
          centers.map((item) => {
            const availableSeats = item.capacity - (item.bookedCount || 0);
            const isFull = availableSeats <= 0;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      {item.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {item.city}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    {item.address}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Center Capacity:</span>
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
                            : availableSeats <= 10
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((item.bookedCount || 0) / item.capacity) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1 block text-right">
                      {isFull ? 'Center At Maximum' : `${availableSeats} available slots`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ID: {item.id.substring(0, 6)}</span>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
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

      {/* Create Center Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Certified Testing Center</h3>
            <p className="text-xs text-slate-500 mb-4">Register a new testing facility and set seat limits.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Center Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dubai Main Technical Testing Complex"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Center Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DXB-01"
                    className="w-full p-2.5 uppercase font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Dubai"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Physical Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Al Quoz Industrial Area 3, Street 18B, Dubai, UAE"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Maximum Candidate Capacity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-active-center"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="chk-active-center" className="text-slate-700 font-semibold cursor-pointer">
                  Available for candidate relocation requests
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
                  {isSubmitting ? 'Registering...' : 'Save Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
