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
          Instantly populate testing examination dates, testing centers in Government & Private Technical Training Centres (TTCs) across Bangladesh (Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, Cumilla, etc.), verified candidates across multiple trades, and pre-graded marksheets with sample Pass and Fail outcomes.
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

      {/* Bangladesh SMS Gateway & OTP Delivery Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-lg">📱</span>
              বাংলাদেশ রিয়েল এসএমএস গেটওয়ে ও ওটিপি কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-600">
              বাংলাদেশের সব অপারেটরে (GP, Banglalink, Robi, Teletalk) ১-৩ সেকেন্ডের মধ্যে ওটিপি এসএমএস পাঠাতে নিচের সেটিংস কনফিগার করুন।
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
            Active Engine: Multi-Gateway
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Greenweb SMS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">১. Greenweb SMS Gateway (বাংলাদেশ)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">১-২ সেকেন্ড</span>
            </div>
            <p className="text-[11px] text-slate-500">
              greenweb.com.bd থেকে আপনার SMS API Token টি এখানে সংরক্ষণ করুন:
            </p>
            <input
              type="text"
              placeholder="e.g. 104710189951717282..."
              id="input-admin-greenweb-token"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C]"
            />
          </div>

          {/* BulkSMS BD */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">২. BulkSMS BD Gateway</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">বিকল্প গেটওয়ে</span>
            </div>
            <p className="text-[11px] text-slate-500">
              bulksmsbd.net থেকে আপনার API Key টি এখানে দিন:
            </p>
            <input
              type="text"
              placeholder="e.g. Y76326176527..."
              id="input-admin-bulksms-key"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0B3B3C]/10 focus:border-[#0B3B3C]"
            />
          </div>
        </div>

        {/* Live Delivery Summary */}
        <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-xl text-xs space-y-1.5 text-teal-950">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>সিস্টেম ওটিপি ও লগইন পলিসি সক্রিয় রয়েছে:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
            <li><strong>তাৎক্ষণিক লগইন (০ সেকেন্ড):</strong> ব্যবহারকারী ও প্রার্থীরা পাসওয়ার্ড দিয়ে ১ ক্লিকেই সরাসরি প্রবেশ করতে পারবেন।</li>
            <li><strong>হাই-স্পিড Gmail SMTP:</strong> Port 465 SSL এবং প্রি-কানেক্টেড পুলে মুহূর্তেই ইনবক্সে ইমেইল চলে যাচ্ছে।</li>
            <li><strong>Fast-Pass রেজিলিয়েন্স:</strong> নেটওয়ার্ক বা টেলিকম ট্রাফিকে ওটিপি ডেলিভারিতে বিলম্ব হলে ১ ক্লিকে তাৎক্ষণিক কোড দেখার সুবিধা বিদ্যমান।</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              const gwInput = (document.getElementById('input-admin-greenweb-token') as HTMLInputElement)?.value;
              const bsInput = (document.getElementById('input-admin-bulksms-key') as HTMLInputElement)?.value;
              try {
                const res = await fetch('/api/settings/sms-gateway', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    greenwebToken: gwInput || undefined,
                    bulksmsKey: bsInput || undefined,
                  }),
                });
                const data = await res.json();
                showToast(data.message || 'এসএমএস গেটওয়ে সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
              } catch (e: any) {
                showToast('সেটিংস আপডেট ব্যর্থ হয়েছে: ' + e.message, 'error');
              }
            }}
            className="px-5 py-2.5 bg-[#0B3B3C] hover:bg-[#135153] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            এসএমএস গেটওয়ে সেটিংস সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
