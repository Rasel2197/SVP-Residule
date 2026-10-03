import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  HelpCircle,
  FileText,
  Trash2,
  Users
} from 'lucide-react';
import { bulkImportTtcCandidates } from '../services/apiService';
import { Candidate } from '../types';
import { useToast } from './Toast';
import { ALL_TAKAMUL_TRADES, BANGLADESH_TAKAMUL_TTCS } from '../data/bangladeshTTCs';

interface BulkCandidateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidates: Candidate[]) => void;
  operatorId?: string;
  operatorEmail?: string;
}

interface ParsedRow {
  email: string;
  password?: string;
  candidateId?: string;
  fullName: string;
  passportNumber: string;
  trade: string;
  examCenter?: string;
  examDate?: string;
  mobileNumber?: string;
  isValid: boolean;
  error?: string;
}

export const BulkCandidateImportModal: React.FC<BulkCandidateImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  operatorId,
  operatorEmail,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Generate and download a sample CSV file
  const handleDownloadSample = () => {
    const csvContent =
      'Email,Password,TicketNumber,FullName,PassportNumber,Trade,ExamCenter,ExamDate,MobileNumber\n' +
      'md_zakir_hossain@yopmail.com,Shamim@160,5841823,MD ZAKIR HOSSAIN,A10061651,Load and Unload Worker,Bogura Technical Training Centre. Nishindara Bogura Rajshahi,2026-10-03,01712982314\n' +
      'ismail_elect@yopmail.com,Ismail@123,5841990,Mohammad Ismail,A18294520,Electrical Installation,Technical Training Centre (TTC) Dhaka,2026-10-15,01819633400\n' +
      'alamin_plumber@yopmail.com,Alamin@2026,5842100,Md. Al-Amin Khan,A03422998,Plumbing & Pipefitting,Technical Training Centre (TTC) Cumilla,2026-10-18,01912345678\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Takamul_TTC_Candidates_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('নমুনা CSV ফাইল ডাউনলোড হয়েছে। এটি পূরণ করে আপলোড করতে পারেন।', 'info');
  };

  // Parse text lines (supports Comma, Tab, Pipe, or Semicolon delimiters)
  const parseRawLines = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: ParsedRow[] = [];

    lines.forEach((line, index) => {
      // Determine delimiter
      let delimiter = ',';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes('|')) delimiter = '|';
      else if (line.includes(';') && !line.includes(',')) delimiter = ';';

      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));

      // Skip header row if detected
      if (
        index === 0 &&
        (parts[0].toLowerCase().includes('email') ||
          parts[3]?.toLowerCase().includes('name') ||
          parts[4]?.toLowerCase().includes('pass'))
      ) {
        return;
      }

      // Format expected:
      // 0: Email
      // 1: Password
      // 2: Ticket Number / Candidate ID
      // 3: Full Name
      // 4: Passport Number
      // 5: Trade
      // 6: Exam Center
      // 7: Exam Date
      // 8: Mobile Number

      const email = parts[0] || '';
      const password = parts[1] || '';
      const candidateId = parts[2] || '';
      const fullName = parts[3] || parts[0] || '';
      const passportNumber = parts[4] || '';
      const trade = parts[5] || 'Load and Unload Worker';
      const examCenter = parts[6] || '';
      const examDate = parts[7] || new Date().toISOString().split('T')[0];
      const mobileNumber = parts[8] || '';

      const isValid = Boolean(fullName && (passportNumber || email));
      let error = '';
      if (!fullName) error = 'নাম অনুপস্থিত';
      else if (!passportNumber && !email) error = 'পাসপোর্ট অথবা ইমেইল প্রয়োজন';

      rows.push({
        email,
        password: password || passportNumber || '123456',
        candidateId,
        fullName,
        passportNumber: passportNumber.toUpperCase(),
        trade,
        examCenter,
        examDate,
        mobileNumber,
        isValid,
        error,
      });
    });

    setParsedRows(rows);
    setImportResults(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedText(val);
    parseRawLines(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        parseRawLines(content);
        setActiveTab('paste');
        showToast(`${file.name} ফাইলটি লোড হয়েছে। প্রিভিউ দেখে সেভ করুন।`, 'info');
      }
    };
    reader.readAsText(file);
  };

  // Perform bulk database save
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('কোনো সঠিক প্রার্থীর ডাটা পাওয়া যায়নি। অনুগ্রহ করে ফিল্ডগুলো পরীক্ষা করুন।', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await bulkImportTtcCandidates(
        validRows.map((r) => ({
          email: r.email || `${r.passportNumber.toLowerCase()}@candidate.takamul.gov.bd`,
          password: r.password || r.passportNumber || '123456',
          candidateId: r.candidateId,
          fullName: r.fullName,
          passportNumber: r.passportNumber,
          trade: r.trade,
          examCenter: r.examCenter,
          examDate: r.examDate,
          mobileNumber: r.mobileNumber,
        })),
        operatorId,
        operatorEmail
      );

      setImportResults(result);
      if (result.successful > 0) {
        showToast(
          `🎉 সফলভাবে ${result.successful} জন প্রার্থীর আসল ডাটাবেজ রেকর্ড সক্রিয় হয়েছে!`,
          'success'
        );
        onSuccess(result.importedCandidates);
      }
    } catch (err: any) {
      showToast(err.message || 'বাল্ক ইমপোর্ট করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-[#0B3B3C] to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                তাকামুল আসল প্রার্থী ডাটাবেজ বাল্ক ইমপোর্ট
              </h3>
              <p className="text-xs text-teal-100/80">
                TTC টিকিট প্রাপ্ত সকল প্রার্থীর ডাটা এক সাথে ডাটাবেজে যুক্ত করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              title="Download Sample CSV Template"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>নমুনা CSV ডাউনলোড</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 text-xs text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>কিভাবে কাজ করে:</b> আপনার এক্সেল বা তাকামুল বুকিং শিট থেকে সারিগুলো কপি করে নিচের বক্সে পেস্ট করুন। সিস্টেমে ডাটা যুক্ত হওয়া মাত্রই প্রার্থীরা তাদের ইমেইল ও পাসওয়ার্ড দিয়ে ওটিপি নিয়ে সরাসরি লগইন ও রিশিডিউল করতে পারবে।
            </p>
          </div>
          <button
            onClick={handleDownloadSample}
            className="sm:hidden flex items-center gap-1 text-[11px] font-bold text-teal-800 underline"
          >
            <Download className="w-3 h-3" />
            নমুনা ফরম্যাট ডাউনলোড
          </button>
        </div>

        {/* Tab Controls */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white text-[#0B3B3C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 টেক্সট / এক্সেল পেস্ট (Paste Rows)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white text-[#0B3B3C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📁 CSV ফাইল আপলোড (Upload CSV)
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-700">
              সনাক্তকৃত প্রার্থী: <strong className="text-teal-800">{parsedRows.length}</strong> জন
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'paste' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  ডাটা পেস্ট করুন (কমা, ট্যাব বা পাইপ সেপারেটেড):
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Email, Password, TicketNo, FullName, Passport, Trade, Center, Date, Mobile
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={handleTextChange}
                rows={5}
                placeholder="যেমন:
md_zakir_hossain@yopmail.com, Shamim@160, 5841823, MD ZAKIR HOSSAIN, A10061651, Load and Unload Worker, Bogura TTC, 2026-10-03, 01712982314
ismail@yopmail.com, Pass@123, 5841990, Mohammad Ismail, A18294520, Electrical Installation, Dhaka TTC, 2026-10-15, 01819633400"
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
              />
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  আপনার কম্পিউটারের CSV ফাইল এখানে ড্রপ করুন অথবা নির্বাচন করুন
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  সাপোর্টেড ফরম্যাট: .csv (UTF-8)
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all">
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>CSV ফাইল সিলেক্ট করুন</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  ডাটাবেজে যুক্ত হওয়ার পূর্ববর্তী প্রিভিউ ({parsedRows.length} জন):
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText('');
                    setParsedRows([]);
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  মুছে ফেলুন
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">প্রার্থীর নাম</th>
                        <th className="p-2.5">পাসপোর্ট নম্বর</th>
                        <th className="p-2.5">টিকিট নং</th>
                        <th className="p-2.5">পেশা (Trade)</th>
                        <th className="p-2.5">টিটিসি কেন্দ্র</th>
                        <th className="p-2.5">পরীক্ষার তারিখ</th>
                        <th className="p-2.5">ইমেইল ও পাসওয়ার্ড</th>
                        <th className="p-2.5">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                        >
                          <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                            {row.fullName || '—'}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-teal-800 whitespace-nowrap">
                            {row.passportNumber || '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">
                            {row.candidateId || '—'}
                          </td>
                          <td className="p-2.5 text-slate-700 whitespace-nowrap">
                            {row.trade}
                          </td>
                          <td className="p-2.5 text-slate-600 max-w-[180px] truncate" title={row.examCenter}>
                            {row.examCenter || 'Pending Center'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">
                            {row.examDate}
                          </td>
                          <td className="p-2.5 text-[11px] whitespace-nowrap font-mono text-slate-500">
                            {row.email} | {row.password}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={row.error}>
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                {row.error || 'Invalid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Results Notification */}
          {importResults && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ইমপোর্ট প্রক্রিয়া সম্পন্ন হয়েছে!</span>
              </div>
              <p>
                ✅ সফলভাবে যুক্ত হয়েছে: <b>{importResults.successful}</b> জন প্রার্থী
                {importResults.failed > 0 && ` | ⚠️ ব্যর্থ: ${importResults.failed} জন`}
              </p>
              {importResults.errors.length > 0 && (
                <div className="text-[11px] text-rose-800 mt-2 bg-rose-50 p-2 rounded-xl">
                  {importResults.errors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            যুক্ত হওয়া মাত্রই ফায়ারবেস ক্লাউড ডাটাবেজে স্থায়ীভাবে সেভ হয়ে যাবে।
          </p>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              বন্ধ করুন
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || parsedRows.filter((r) => r.isValid).length === 0}
              className="px-6 py-2.5 bg-[#0B3B3C] hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ডাটাবেজে সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {parsedRows.filter((r) => r.isValid).length > 0
                      ? `${parsedRows.filter((r) => r.isValid).length} জন প্রার্থীকে ডাটাবেজে সেভ করুন`
                      : 'প্রার্থী ডাটা সেভ করুন'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
