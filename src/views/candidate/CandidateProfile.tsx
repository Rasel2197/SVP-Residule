import React, { useState } from 'react';
import {
  User,
  CreditCard,
  Phone,
  Mail,
  Wrench,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Hash,
  Edit3,
  X,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/rules';
import { ALL_TAKAMUL_TRADES, BANGLADESH_TAKAMUL_TTCS } from '../../data/bangladeshTTCs';
import { useToast } from '../../components/Toast';

interface CandidateProfileProps {
  onNavigate: (view: string) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({ onNavigate }) => {
  const { candidate, currentUser, updateCandidateProfileData } = useAuth();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(candidate?.fullName || '');
  const [passportNumber, setPassportNumber] = useState(candidate?.passportNumber || '');
  const [nationalId, setNationalId] = useState(candidate?.nationalId || '');
  const [mobileNumber, setMobileNumber] = useState(candidate?.mobileNumber || '');
  const [trade, setTrade] = useState(candidate?.trade || ALL_TAKAMUL_TRADES[0]);
  const [examCenter, setExamCenter] = useState(candidate?.examCenter || BANGLADESH_TAKAMUL_TTCS[0]?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(candidate?.dateOfBirth || '1996-01-15');

  const openEditModal = () => {
    setFullName(candidate?.fullName || '');
    setPassportNumber(candidate?.passportNumber || '');
    setNationalId(candidate?.nationalId || '');
    setMobileNumber(candidate?.mobileNumber || '');
    setTrade(candidate?.trade || ALL_TAKAMUL_TRADES[0]);
    setExamCenter(candidate?.examCenter || BANGLADESH_TAKAMUL_TTCS[0]?.name || '');
    setDateOfBirth(candidate?.dateOfBirth || '1996-01-15');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('অনুগ্রহ করে সম্পূর্ণ নাম লিখুন।', 'error');
      return;
    }
    if (!passportNumber.trim()) {
      showToast('অনুগ্রহ করে পাসপোর্ট নম্বর লিখুন।', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateCandidateProfileData({
        fullName: fullName.trim(),
        passportNumber: passportNumber.trim().toUpperCase(),
        nationalId: nationalId.trim(),
        mobileNumber: mobileNumber.trim(),
        trade,
        examCenter,
        dateOfBirth,
      });

      showToast('আপনার আসল তথ্য সফলভাবে সংরক্ষিত ও আপডেট হয়েছে!', 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update candidate profile:', err);
      showToast('প্রোফাইল আপডেট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="candidate-profile-view" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard (ড্যাশবোর্ডে ফিরুন)
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            প্রার্থী প্রোফাইল রেকর্ড (Candidate Profile Record)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            আপনার আসল পাসপোর্ট, জাতীয় পরিচয়পত্র ও তাকামুল ট্রেড বিবরণী।
          </p>
        </div>

        <button
          id="btn-edit-candidate-profile"
          type="button"
          onClick={openEditModal}
          className="px-4 py-2.5 bg-[#0e8a75] hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4 text-teal-100" />
          <span>আসল তথ্য এডিট করুন (Edit Real Profile)</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0e8a75] text-white flex items-center justify-center font-bold text-xl shadow-md border border-teal-400/30">
              {candidate?.fullName ? candidate.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold">{candidate?.fullName || 'Candidate Profile'}</h2>
              <p className="text-xs text-slate-300 font-mono">Candidate ID: {candidate?.candidateId || 'N/A'}</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Profile
          </span>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Full Name */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <User className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Full Legal Name (সম্পূর্ণ নাম)</span>
              <strong className="text-slate-900 text-base">{candidate?.fullName || 'N/A'}</strong>
            </div>
          </div>

          {/* Tracking ID */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Hash className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Candidate Tracking ID</span>
              <strong className="text-slate-900 font-mono text-base">{candidate?.candidateId || 'N/A'}</strong>
            </div>
          </div>

          {/* Passport */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <CreditCard className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Passport Number (পাসপোর্ট নম্বর)</span>
              <strong className="text-slate-900 font-mono text-base uppercase">
                {candidate?.passportNumber || (
                  <span className="text-rose-500 font-sans text-xs">যুক্ত করা হয়নি (Not Added)</span>
                )}
              </strong>
            </div>
          </div>

          {/* National ID */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <CreditCard className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">National ID (জাতীয় পরিচয়পত্র নম্বর)</span>
              <strong className="text-slate-900 font-mono text-base">
                {candidate?.nationalId || (
                  <span className="text-slate-400 font-sans text-xs">যুক্ত করা হয়নি</span>
                )}
              </strong>
            </div>
          </div>

          {/* Registered Mobile */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Phone className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Registered Mobile (মোবাইল নম্বর)</span>
              <strong className="text-slate-900 text-base">{candidate?.mobileNumber || 'N/A'}</strong>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Mail className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Takamul Registration Email (ইমেইল)</span>
              <strong className="text-slate-900 text-base">{candidate?.email || currentUser?.email || 'N/A'}</strong>
            </div>
          </div>

          {/* Trade */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Wrench className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Assessed Trade (পেশা / ট্রেড)</span>
              <strong className="text-slate-900 text-base">{candidate?.trade || 'N/A'}</strong>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Calendar className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Date of Birth (জন্ম তারিখ)</span>
              <strong className="text-slate-900 text-base">{formatDate(candidate?.dateOfBirth)}</strong>
            </div>
          </div>

          {/* Examination TTC Center */}
          <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Building2 className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Assigned Examination TTC Center (পরীক্ষা কেন্দ্র)</span>
              <strong className="text-slate-900 text-base">{candidate?.examCenter || 'N/A'}</strong>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Security Record: আপনার তথ্য সরাসরি ফায়ারবেস ক্লাউডে সুরক্ষিত রাখা হয়।</span>
          <button
            type="button"
            onClick={openEditModal}
            className="text-[#0e8a75] font-bold hover:underline cursor-pointer"
          >
            তথ্য সংশোধন করতে এখানে ক্লিক করুন →
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0e8a75]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    আসল তথ্য আপডেট করুন (Update Real Takamul Profile)
                  </h3>
                  <p className="text-xs text-slate-500">
                    আপনার আসল পাসপোর্ট, এনআইডি ও ট্রেড তথ্য দিয়ে প্রোফাইল আপডেট করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Legal Name (পাসপোর্ট অনুযায়ী সম্পূর্ণ নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: MD MITUL HOSEN"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-semibold"
                />
              </div>

              {/* Passport & NID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Passport Number (পাসপোর্ট নম্বর) *
                  </label>
                  <input
                    type="text"
                    required
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                    placeholder="যেমন: A09012936"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    National ID (জাতীয় পরিচয়পত্র নম্বর)
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="যেমন: 9179075925"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-mono"
                  />
                </div>
              </div>

              {/* Mobile & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Number (মোবাইল নম্বর) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Date of Birth (জন্ম তারিখ)
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75]"
                  />
                </div>
              </div>

              {/* Trade Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assessed Trade (পেশা / ট্রেড) *
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-medium"
                >
                  {ALL_TAKAMUL_TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Center Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assigned Examination TTC Center (পরীক্ষা কেন্দ্র) *
                </label>
                <select
                  value={examCenter}
                  onChange={(e) => setExamCenter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0e8a75] font-medium"
                >
                  {BANGLADESH_TAKAMUL_TTCS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#0e8a75] hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>তথ্য সেভ করুন (Save Real Profile)</span>
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
