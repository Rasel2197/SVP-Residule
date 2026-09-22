import React, { useState } from 'react';
import { Database, RefreshCw, Trash2, ArrowLeft, Shield, CheckCircle2, Server, Key, AlertTriangle } from 'lucide-react';
import { seedInitialPortalData, clearAllPortalData } from '../../services/apiService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface AdminSettingsProps {
  onNavigate: (view: string) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedInitialPortalData();
      showToast('Comprehensive portal sample dataset successfully initialized.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to seed sample data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearAllPortalData();
      setShowClearConfirm(false);
      showToast('All candidate registrations, sessions, and logs cleared.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear portal data.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div id="admin-settings-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration & Data Maintenance</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage database instances, seed development testing fixtures, and inspect security rules.
        </p>
      </div>

      {/* Database Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Firestore & Cloud Service Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Database Type:</span>
            <strong className="text-slate-900">Google Cloud Firestore</strong>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Authentication Engine:</span>
            <strong className="text-slate-900">Firebase Auth (Email/Password)</strong>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Security Rules Pattern:</span>
            <strong className="text-emerald-700">Hardened RBAC (Master Gate)</strong>
          </div>
        </div>
      </div>

      {/* Development Seed Data Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-600" />
          Development Fixtures & Seed Tools
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Instantly populate testing examination dates, testing centers in Dubai/Abu Dhabi/Sharjah, verified candidates across multiple trades, and pre-graded marksheets with sample Pass and Fail outcomes.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="btn-seed-data-action"
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Populating Database Records...' : 'Populate Sample Data Fixtures'}
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearing}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Test Data
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing Data */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Portal Data"
        message="Are you sure you want to clear all candidate records, test schedules, centers, and change requests? This action cannot be undone."
        confirmText="Yes, Clear All Data"
        cancelText="Cancel"
        variant="danger"
        isLoading={isClearing}
        onConfirm={handleClear}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
