import React, { useState, useEffect } from 'react';
import {
  Coins,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Building,
  Phone,
  Mail,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  AlertCircle,
  RefreshCw,
  X,
  Send,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import {
  getAllOperators,
  createOperatorUser,
  updateOperatorCredits,
  toggleOperatorStatus,
  getAllCreditTransactions,
  getAllRechargeRequests,
  approveRechargeRequest
} from '../../services/apiService';
import { OperatorUser, CreditTransaction, RechargeRequest } from '../../types';

interface AdminOperatorsProps {
  onNavigate: (view: string) => void;
}

export const AdminOperators: React.FC<AdminOperatorsProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [globalTransactions, setGlobalTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedOperatorForCredit, setSelectedOperatorForCredit] = useState<OperatorUser | null>(null);

  // New Operator Form
  const [newFullName, setNewFullName] = useState('');
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [initialCredits, setInitialCredits] = useState(10);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Credit Adjustment Form
  const [creditAdjustmentType, setCreditAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditNote, setCreditNote] = useState('');
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'operators' | 'requests' | 'ledger'>('operators');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ops, reqs, txs] = await Promise.all([
        getAllOperators(),
        getAllRechargeRequests(),
        getAllCreditTransactions(),
      ]);
      setOperators(ops);
      setRechargeRequests(reqs);
      setGlobalTransactions(txs);
    } catch (err) {
      console.error('Failed to load operators data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered operators
  const filteredOperators = operators.filter((op) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      op.fullName.toLowerCase().includes(q) ||
      op.email.toLowerCase().includes(q) ||
      op.agencyName?.toLowerCase().includes(q) ||
      op.phoneNumber?.toLowerCase().includes(q)
    );
  });

  // Handle Create Operator
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('অনুগ্রহ করে নাম, ইমেইল/ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন।', 'error');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const newOp = await createOperatorUser({
        fullName: newFullName.trim(),
        agencyName: newAgencyName.trim() || 'General Agency',
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        phoneNumber: newPhone.trim(),
        initialCredits: Number(initialCredits) || 0,
        createdBy: userProfile?.email || 'admin',
      });

      setOperators((prev) => [newOp, ...prev]);
      showToast(`ইউজার "${newOp.fullName}" সফলভাবে তৈরি হয়েছে! প্রাথমিক ক্রেডিট: ${newOp.credits}`, 'success');

      // Reset form
      setNewFullName('');
      setNewAgencyName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setInitialCredits(10);
      setIsCreateModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'ইউজার তৈরি করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Credit Adjustment (Recharge or Deduct)
  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperatorForCredit) return;

    if (creditAmount <= 0) {
      showToast('ক্রেডিট সংখ্যা অবশ্যই ১ বা তার বেশি হতে হবে।', 'error');
      return;
    }

    setIsSubmittingCredit(true);
    try {
      const delta = creditAdjustmentType === 'ADD' ? creditAmount : -creditAmount;
      const res = await updateOperatorCredits({
        operatorUid: selectedOperatorForCredit.uid,
        deltaCredits: delta,
        actionType: creditAdjustmentType === 'ADD' ? 'RECHARGE' : 'DEDUCT',
        description: creditNote.trim() || (creditAdjustmentType === 'ADD' ? `Admin manual recharge (+${creditAmount})` : `Admin deduction (-${creditAmount})`),
        performedBy: userProfile?.email || 'admin',
      });

      showToast(`সফলভাবে ${selectedOperatorForCredit.fullName}-এর ব্যালেন্স আপডেট হয়েছে! নতুন ব্যালেন্স: ${res.newBalance} Credits`, 'success');

      setIsCreditModalOpen(false);
      setSelectedOperatorForCredit(null);
      setCreditNote('');
      setCreditAmount(10);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'ক্রেডিট আপডেট ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Toggle Operator Status (Active / Suspended)
  const handleToggleStatus = async (op: OperatorUser) => {
    try {
      const nextStatus = !op.isActive;
      await toggleOperatorStatus(op.uid, nextStatus);
      setOperators((prev) =>
        prev.map((item) => (item.uid === op.uid ? { ...item, isActive: nextStatus } : item))
      );
      showToast(`ইউজার "${op.fullName}" এখন ${nextStatus ? 'সক্রিয় (Active)' : 'স্থগিত (Suspended)'}`, 'success');
    } catch (err: any) {
      showToast('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।', 'error');
    }
  };

  // Approve Recharge Request
  const handleApproveRequest = async (req: RechargeRequest) => {
    try {
      await approveRechargeRequest(req.id, req, userProfile?.email || 'admin');
      showToast(`${req.operatorName}-এর ${req.requestedCredits} ক্রেডিটের রিচার্জ অনুমোদন করা হয়েছে!`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Computed stats
  const totalCredits = operators.reduce((acc, op) => acc + Number(op.credits || 0), 0);
  const pendingRequests = rechargeRequests.filter((r) => r.status === 'PENDING').length;
  const totalActions = globalTransactions.filter((t) => t.type === 'RESCHEDULE' || t.type === 'MARKSHEET').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                <span>Credit Management</span>
              </span>
              <span className="text-xs text-slate-400">• Super Admin Controls</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ইউজার ও ক্রেডিট ম্যানেজমেন্ট (Operators & Credits)
            </h1>
            <p className="text-xs text-slate-500">
              অ্যাপের ইউজারদের একাউন্ট তৈরি করুন, পাসওয়ার্ড দিন এবং ক্রেডিট রিচার্জ / পরিচালনা করুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="btn-admin-create-operator"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-700/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন ইউজার তৈরি করুন (Create User)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">মোট ইউজার</span>
              <Building className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{operators.length}</p>
            <p className="text-[11px] text-slate-400">নিবন্ধিত অপারেটর ও এজেন্সি</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">মোট সক্রিয় ক্রেডিট</span>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{totalCredits}</p>
            <p className="text-[11px] text-slate-400">ইউজারদের বর্তমান ব্যালেন্স</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">পেন্ডিং রিচার্জ অনুরোধ</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-700">{pendingRequests}</p>
            <p className="text-[11px] text-slate-400">অনুমোদনের অপেক্ষায়</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">মোট সম্পন্ন কাজ</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">{totalActions}</p>
            <p className="text-[11px] text-slate-400">রিশিডিউল + মার্কশিট কর্তন</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('operators')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'operators'
                ? 'bg-[#0B3B3C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>সকল ইউজার তালিকা ({operators.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'requests'
                ? 'bg-[#0B3B3C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>রিচার্জ অনুরোধ ({pendingRequests})</span>
            {pendingRequests > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
                {pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-[#0B3B3C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>গ্লোবাল ট্রানজ্যাকশন লেজার ({globalTransactions.length})</span>
          </button>
        </div>

        {/* TAB 1: OPERATORS LIST */}
        {activeTab === 'operators' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, agency, email, phone..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>

              <span className="text-xs text-slate-400 font-semibold">
                প্রদর্শিত: {filteredOperators.length} জন ইউজার
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3">ইউজার ও এজেন্সি</th>
                    <th className="p-3">ইমেইল / ইউজারনেম</th>
                    <th className="p-3">মোবাইল</th>
                    <th className="p-3 text-center">ক্রেডিট ব্যালেন্স</th>
                    <th className="p-3 text-center">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        কোন ইউজার পাওয়া যায়নি। উপরে "নতুন ইউজার তৈরি করুন" বাটনে ক্লিক করে প্রথম ইউজার তৈরি করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredOperators.map((op) => (
                      <tr key={op.id || op.uid} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 text-sm">{op.fullName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{op.agencyName || 'Personal / General'}</span>
                          </p>
                        </td>

                        <td className="p-3 font-mono font-medium text-slate-700">
                          {op.email}
                        </td>

                        <td className="p-3 text-slate-600 font-mono">
                          {op.phoneNumber || 'N/A'}
                        </td>

                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs rounded-full shadow-xs">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            <span>{op.credits} Credits</span>
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(op)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              op.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {op.isActive ? 'সক্রিয় (Active)' : 'স্থগিত (Suspended)'}
                          </button>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOperatorForCredit(op);
                                setCreditAdjustmentType('ADD');
                                setIsCreditModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>রিচার্জ</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedOperatorForCredit(op);
                                setCreditAdjustmentType('DEDUCT');
                                setIsCreditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Deduct credits"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING RECHARGE REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">অপারেটরদের রিচার্জের অনুরোধ তালিকা</h3>

            {rechargeRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                কোন রিচার্জের অনুরোধ জমা নেই।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">অপারেটর নাম</th>
                      <th className="p-3">অনুরোধকৃত ক্রেডিট</th>
                      <th className="p-3">পেমেন্ট মেথড</th>
                      <th className="p-3">Trx ID / নোট</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rechargeRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {req.operatorName} ({req.agencyName})
                        </td>
                        <td className="p-3 font-black text-amber-700 font-mono">
                          +{req.requestedCredits} Credits
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {req.paymentMethod}
                        </td>
                        <td className="p-3">
                          <p className="font-mono font-bold text-slate-800">{req.trxId}</p>
                          {req.note && <p className="text-[11px] text-slate-400">{req.note}</p>}
                        </td>
                        <td className="p-3">
                          {req.status === 'PENDING' ? (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                              পেন্ডিং (Pending)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              অনুমোদিত (Approved)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>অনুমোদন করুন</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GLOBAL TRANSACTION LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">সমগ্র সিস্টেমের ক্রেডিট ব্যবহারের হিস্ট্রি</h3>

            {globalTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                কোন ট্রানজ্যাকশন রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3">সময়</th>
                      <th className="p-3">অপারেটর আইডি</th>
                      <th className="p-3">কাজের ধরন</th>
                      <th className="p-3">বিবরণ / প্রার্থী</th>
                      <th className="p-3 text-center">ক্রেডিট পরিবর্তন</th>
                      <th className="p-3 text-right">অবশিষ্ট ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {globalTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {tx.operatorUid.substring(0, 10)}...
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              tx.type === 'RESCHEDULE'
                                ? 'bg-blue-100 text-blue-800'
                                : tx.type === 'MARKSHEET'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-800 font-medium">
                          {tx.description}
                        </td>
                        <td className="p-3 text-center font-bold font-mono">
                          {tx.amount < 0 ? (
                            <span className="text-rose-600">{tx.amount} Cr</span>
                          ) : (
                            <span className="text-emerald-600">+{tx.amount} Cr</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          {tx.balanceAfter} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE OPERATOR MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">নতুন ইউজার / অপারেটর তৈরি করুন</h3>
                  <p className="text-xs text-slate-500">ইউজার নিজের পাসওয়ার্ড দিয়ে লগইন করে কাজ করবে</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    সম্পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Md. Faruk Hossain"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    এজেন্সি বা দোকানের নাম (Agency Name)
                  </label>
                  <input
                    type="text"
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    placeholder="e.g. Al-Razi Travels & Services"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ইমেইল বা ইউজারনেম (Login Username/Email) *
                  </label>
                  <input
                    type="text"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. faruk@agency.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    পাসওয়ার্ড (Password) *
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="লগইন পাসওয়ার্ড সেট করুন"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    প্রাথমিক ক্রেডিট বরাদ্দ (Initial Credits)
                  </label>
                  <input
                    type="number"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <Coins className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  এই ইউজার একাউন্ট দিয়ে লগইন করলে ১ রিশিডিউল (Reschedule) বা ১ মার্কশিট তোলার সময় এই একাউন্ট থেকে ১ ক্রেডিট করে কেটে নেওয়া হবে।
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCreate ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>তৈরি করুন (Create Operator)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDIT ADJUSTMENT (RECHARGE / DEDUCT) MODAL */}
      {isCreditModalOpen && selectedOperatorForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {creditAdjustmentType === 'ADD' ? 'ক্রেডিট রিচার্জ করুন' : 'ক্রেডিট কর্তন করুন'}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedOperatorForCredit.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustCredits} className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-600">বর্তমান ব্যালেন্স:</span>
                <span className="text-base font-black text-amber-700">
                  {selectedOperatorForCredit.credits} Credits
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  দ্রুত পরিমাণ বেছে নিন (Quick Select)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCreditAmount(num)}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        creditAmount === num
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  নির্দিষ্ট ক্রেডিট সংখ্যা (Exact Credits) *
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  min={1}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 font-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  রিচার্জ নোট বা পেমেন্ট রেফারেন্স (Note / Trx ID)
                </label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="e.g. Received bKash payment / Cash"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCredit}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCredit ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>নিশ্চিত করুন (Confirm Balance)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
