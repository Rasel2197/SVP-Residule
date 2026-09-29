import React, { useState } from 'react';
import { Download, Printer, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Marksheet, Candidate } from '../types';
import { useToast } from './Toast';

interface OfficialMarksheetViewProps {
  marksheet: Marksheet;
  candidate?: Candidate | null;
  showActions?: boolean;
  onClose?: () => void;
}

export const OfficialMarksheetView: React.FC<OfficialMarksheetViewProps> = ({
  marksheet,
  candidate,
  showActions = true,
  onClose,
}) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  // Derive scores matching Takamul SVPI standards (25 CBT + 75 Practical = 100 Total)
  const cbtMax = 25;
  const cbtObtained =
    marksheet.theoryMarks <= 25
      ? marksheet.theoryMarks
      : Math.round((marksheet.theoryMarks / 100) * 25);
  const cbtPercent = Math.round((cbtObtained / cbtMax) * 100);
  const cbtRawScore = marksheet.theoryMarks || Math.round(cbtObtained * 2.06);
  const cbtTotalQuestions = 15;
  const cbtCorrect = Math.min(15, Math.max(1, Math.round((cbtPercent / 100) * cbtTotalQuestions)));
  const cbtWrong = cbtTotalQuestions - cbtCorrect;

  const pracMax = 75;
  const pracObtained =
    marksheet.practicalMarks <= 75
      ? marksheet.practicalMarks
      : Math.round((marksheet.practicalMarks / 100) * 75);
  const pracPercent = Math.round((pracObtained / pracMax) * 100);
  const pracRawScore = marksheet.practicalMarks || Math.round((pracObtained / 75) * 100);

  const totalMax = 100;
  const totalObtained = cbtObtained + pracObtained;
  const totalPercent = Math.round((totalObtained / totalMax) * 100);
  const isPass = marksheet.resultStatus === 'PASS' || totalPercent >= 50;

  // Format Date and Time
  const examDateFormatted = marksheet.examDate
    ? marksheet.examDate.includes('/')
      ? marksheet.examDate
      : marksheet.examDate.split('-').reverse().join('/') + ' 05:30'
    : '24/09/2026 05:30';

  // Format Generation Timestamp
  const generatedTimestamp = marksheet.issueDate
    ? marksheet.issueDate.includes('/')
      ? marksheet.issueDate
      : marksheet.issueDate.split('T')[0].split('-').reverse().join('/') + ', 14:46:31'
    : '24/09/2026, 14:46:31';

  // Reservation / Cert Number
  const reservationNumber = marksheet.referenceId
    ? marksheet.referenceId.replace(/\D/g, '').slice(-7) || '5739641'
    : '5739641';

  // National ID
  const nationalId =
    (candidate as any)?.nationalId ||
    candidate?.candidateId?.replace(/\D/g, '') ||
    marksheet.candidateId?.replace(/\D/g, '') ||
    '9179075925';

  // Passport Number
  const passportNumber =
    candidate?.passportNumber || (marksheet as any)?.passportNumber || 'A09012936';

  /**
   * Generates and downloads a clean, standalone PDF of ONLY this marksheet
   */
  const handleDownloadPDF = async () => {
    const element = document.getElementById('official-takamul-marksheet-card');
    if (!element) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Render marksheet card with scale 2 for crisp vector-like print resolution
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const margin = 12;
      const renderWidth = pdfWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, 15, renderWidth, renderHeight);

      const candidateSlug = (marksheet.candidateName || 'Candidate')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      const fileName = `Takamul_SVP_Marksheet_${candidateSlug}_${passportNumber}.pdf`;

      pdf.save(fileName);
      showToast('অফিসিয়াল মার্কশিট PDF সফলভাবে ডাউনলোড হয়েছে!', 'success');
    } catch (err) {
      console.error('Marksheet PDF generation error:', err);
      showToast('পিডিএফ তৈরিতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Opens isolated print view printing ONLY this marksheet sheet without dashboard screen
   */
  const handlePrintOnly = () => {
    const element = document.getElementById('official-takamul-marksheet-card');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Takamul SVP Marksheet - ${marksheet.candidateName}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff;
              color: #0f172a;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .marksheet-print-container {
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body class="p-4 flex justify-center items-start">
          <div class="marksheet-print-container">
            ${element.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Download & Print Buttons) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <ShieldCheck className="w-4 h-4 text-[#0e8a75]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                অফিসিয়াল তাকামুল পরীক্ষার ফলাফল ও মার্কশিট ভাউচার
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Verification Ref: #{reservationNumber} · {marksheet.candidateName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-official-marksheet-pdf"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 bg-[#0e8a75] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-teal-100" />
              )}
              <span>{isDownloading ? 'PDF তৈরি হচ্ছে...' : 'ডাউনলোড PDF (Download PDF)'}</span>
            </button>

            <button
              id="btn-print-official-marksheet-only"
              type="button"
              onClick={handlePrintOnly}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>প্রিন্ট ভিউ (Print Marksheet)</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE OFFICIAL TAKAMUL SVP INTERNATIONAL MARKSHEET (A4 PROPORTION) */}
      {/* ========================================================================= */}
      <div
        id="official-takamul-marksheet-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-3xl mx-auto overflow-hidden text-slate-900 font-sans print:border-none print:shadow-none print:m-0 print:p-0"
      >
        {/* Top Header Banner */}
        <div className="bg-[#0e8a75] text-white p-6 flex items-center justify-between relative">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-0.5">
              পরীক্ষার ফলাফল
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 font-normal tracking-wide">
              SVP International · Skill Verification Program
            </p>
          </div>

          <div>
            <span
              className={`inline-block px-4 py-1 rounded-full text-xs font-black shadow-xs tracking-wider ${
                isPass
                  ? 'bg-[#20b292] text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isPass ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ'}
            </span>
          </div>
        </div>

        {/* Candidate Information Grid (2 Columns) */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
            {/* Row 1 */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">নাম</p>
              <p className="text-sm font-bold text-slate-900 uppercase">
                {marksheet.candidateName}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">পেশা</p>
              <p className="text-sm font-bold text-slate-900">
                {marksheet.trade}
              </p>
            </div>

            {/* Row 2 */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">পাসপোর্ট নম্বর</p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                {passportNumber}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">জাতীয় পরিচয়পত্র</p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                {nationalId}
              </p>
            </div>

            {/* Row 3 */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">পরীক্ষা কেন্দ্র</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {marksheet.examCenter}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">তারিখ ও সময়</p>
              <p className="text-sm font-bold text-slate-900">
                {examDateFormatted}
              </p>
            </div>

            {/* Row 4 */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">ভাষা</p>
              <p className="text-sm font-bold text-slate-900">
                BN
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">রিজার্ভেশন নম্বর</p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                #{reservationNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="px-6 sm:px-8 mb-6 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#0e8a75] text-white font-bold">
                <th className="py-2.5 px-3 text-left">অংশ</th>
                <th className="py-2.5 px-3 text-center">পূর্ণমান</th>
                <th className="py-2.5 px-3 text-center">পেয়েছেন</th>
                <th className="py-2.5 px-3 text-center">শতকরা</th>
                <th className="py-2.5 px-3 text-center">মূল স্কোর</th>
                <th className="py-2.5 px-3 text-center">সঠিক</th>
                <th className="py-2.5 px-3 text-center">ভুল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* CBT (MCQ) Row */}
              <tr>
                <td className="py-3 px-3 font-medium text-slate-800">
                  CBT (MCQ)
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtMax}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-900">
                  {cbtObtained}
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtPercent}%
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtRawScore}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-600">
                  {cbtCorrect}/{cbtTotalQuestions}
                </td>
                <td className="py-3 px-3 text-center font-bold text-rose-600">
                  {cbtWrong}
                </td>
              </tr>

              {/* Practical (ব্যবহারিক) Row */}
              <tr>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Practical (ব্যবহারিক)
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracMax}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-900">
                  {pracObtained}
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracPercent}%
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracRawScore}
                </td>
                <td className="py-3 px-3 text-center text-slate-400 font-bold">
                  —
                </td>
                <td className="py-3 px-3 text-center text-slate-400 font-bold">
                  —
                </td>
              </tr>

              {/* Total (মোট) Row */}
              <tr className="bg-[#f0fdf9] font-bold text-slate-900">
                <td className="py-3 px-3">
                  মোট
                </td>
                <td className="py-3 px-3 text-center">
                  {totalMax}
                </td>
                <td className="py-3 px-3 text-center text-slate-900">
                  {totalObtained}
                </td>
                <td className="py-3 px-3 text-center text-slate-900">
                  {totalPercent}%
                </td>
                <td className="py-3 px-3 text-center"></td>
                <td className="py-3 px-3 text-center"></td>
                <td className="py-3 px-3 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Note and Generation Timestamp */}
        <div className="px-6 sm:px-8 pb-6 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-100">
          <p>
            এই ফলাফল SVP সিস্টেম থেকে স্বয়ংক্রিয়ভাবে তৈরি।
          </p>
          <p className="font-mono">
            তৈরি: {generatedTimestamp}
          </p>
        </div>
      </div>
    </div>
  );
};
