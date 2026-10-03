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
    ? marksheet.referenceId.replace(/\D/g, '').slice(-7) || marksheet.candidateId?.replace(/\D/g, '') || '5739641'
    : marksheet.candidateId?.replace(/\D/g, '') || '5739641';

  // Real Candidate Data (prioritize candidate real profile if present)
  const candidateName = candidate?.fullName || marksheet.candidateName || 'Candidate';
  const candidateTrade = candidate?.trade || marksheet.trade || 'Assessed Trade';
  const candidateCenter = candidate?.examCenter || marksheet.examCenter || 'Bangladesh Assessment Centre';
  const nationalId =
    (candidate as any)?.nationalId ||
    (marksheet as any)?.nationalId ||
    candidate?.candidateId ||
    'N/A';
  const passportNumber =
    candidate?.passportNumber || (marksheet as any)?.passportNumber || 'N/A';

  /**
   * Generates and downloads a clean, standalone PDF of ONLY this marksheet using html2pdf.js
   */
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    // Yield to the browser render pipeline so the UI updates immediately and INP is <16ms
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 40);
      });
    });

    try {
      const candidateSlug = (marksheet.candidateName || 'Candidate')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      const fileName = `Takamul_SVP_Marksheet_${candidateSlug}_${passportNumber}.pdf`;

      await downloadMarksheetElementAsPDF('official-takamul-marksheet-card', fileName);
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
              id="btn-download-as-pdf"
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
              <span>{isDownloading ? 'Generating PDF...' : 'Download as PDF'}</span>
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
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderColor: '#e2e8f0',
        }}
        className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-3xl mx-auto overflow-hidden text-slate-900 font-sans print:border-none print:shadow-none print:m-0 print:p-0"
      >
        {/* Top Header Banner */}
        <div
          style={{ backgroundColor: '#0e8a75', color: '#ffffff' }}
          className="bg-[#0e8a75] text-white p-6 flex items-center justify-between relative"
        >
          <div>
            <h1
              style={{ color: '#ffffff' }}
              className="text-xl sm:text-2xl font-black tracking-tight text-white mb-0.5"
            >
              পরীক্ষার ফলাফল
            </h1>
            <p
              style={{ color: '#ccfbf1' }}
              className="text-xs sm:text-sm text-teal-100 font-normal tracking-wide"
            >
              SVP International · Skill Verification Program
            </p>
          </div>

          <div>
            <span
              style={{
                backgroundColor: isPass ? '#20b292' : '#dc2626',
                color: '#ffffff',
              }}
              className={`inline-block px-4 py-1 rounded-full text-xs font-black shadow-xs tracking-wider ${
                isPass ? 'bg-[#20b292] text-white' : 'bg-rose-600 text-white'
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
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">নাম</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900 uppercase">
                {candidateName}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">পেশা</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900">
                {candidateTrade}
              </p>
            </div>

            {/* Row 2 */}
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">পাসপোর্ট নম্বর</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900 font-mono">
                {passportNumber}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">জাতীয় পরিচয়পত্র</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900 font-mono">
                {nationalId}
              </p>
            </div>

            {/* Row 3 */}
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">পরীক্ষা কেন্দ্র</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900 leading-snug">
                {candidateCenter}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">তারিখ ও সময়</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900">
                {examDateFormatted}
              </p>
            </div>

            {/* Row 4 */}
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">ভাষা</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900">
                BN
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium text-slate-400 mb-0.5">রিজার্ভেশন নম্বর</p>
              <p style={{ color: '#0f172a' }} className="text-sm font-bold text-slate-900 font-mono">
                #{reservationNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="px-6 sm:px-8 mb-6 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse" style={{ color: '#334155' }}>
            <thead>
              <tr style={{ backgroundColor: '#0e8a75', color: '#ffffff' }} className="bg-[#0e8a75] text-white font-bold">
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
              <tr style={{ borderBottomColor: '#f1f5f9' }}>
                <td style={{ color: '#1e293b' }} className="py-3 px-3 font-medium text-slate-800">
                  CBT (MCQ)
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtMax}
                </td>
                <td style={{ color: '#0f172a' }} className="py-3 px-3 text-center font-bold text-slate-900">
                  {cbtObtained}
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtPercent}%
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {cbtRawScore}
                </td>
                <td style={{ color: '#059669' }} className="py-3 px-3 text-center font-bold text-emerald-600">
                  {cbtCorrect}/{cbtTotalQuestions}
                </td>
                <td style={{ color: '#e11d48' }} className="py-3 px-3 text-center font-bold text-rose-600">
                  {cbtWrong}
                </td>
              </tr>

              {/* Practical (ব্যবহারিক) Row */}
              <tr style={{ borderBottomColor: '#f1f5f9' }}>
                <td style={{ color: '#1e293b' }} className="py-3 px-3 font-medium text-slate-800">
                  Practical (ব্যবহারিক)
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracMax}
                </td>
                <td style={{ color: '#0f172a' }} className="py-3 px-3 text-center font-bold text-slate-900">
                  {pracObtained}
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracPercent}%
                </td>
                <td style={{ color: '#475569' }} className="py-3 px-3 text-center text-slate-600 font-medium">
                  {pracRawScore}
                </td>
                <td style={{ color: '#94a3b8' }} className="py-3 px-3 text-center text-slate-400 font-bold">
                  —
                </td>
                <td style={{ color: '#94a3b8' }} className="py-3 px-3 text-center text-slate-400 font-bold">
                  —
                </td>
              </tr>

              {/* Total (মোট) Row */}
              <tr style={{ backgroundColor: '#f0fdf9', color: '#0f172a' }} className="bg-[#f0fdf9] font-bold text-slate-900">
                <td className="py-3 px-3">
                  মোট
                </td>
                <td className="py-3 px-3 text-center">
                  {totalMax}
                </td>
                <td style={{ color: '#0f172a' }} className="py-3 px-3 text-center text-slate-900">
                  {totalObtained}
                </td>
                <td style={{ color: '#0f172a' }} className="py-3 px-3 text-center text-slate-900">
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
        <div style={{ borderColor: '#f1f5f9', color: '#94a3b8' }} className="px-6 sm:px-8 pb-6 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-100">
          <p>
            এই ফলাফল SVP সিস্টেম থেকে স্বয়ংক্রিয়ভাবে তৈরি।
          </p>
          <p className="font-mono">
            তৈরি: {generatedTimestamp}
          </p>
        </div>

        {/* Dedicated In-Card Download Button Bar (ignored by html2pdf/html2canvas and hidden in print) */}
        <div
          data-html2canvas-ignore="true"
          className="no-print px-6 sm:px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs"
        >
          <span className="text-slate-500 font-medium">
            অফিসিয়াল সার্টিফিকেট ডাউনলোড করতে পাশের বোতামে চাপুন:
          </span>
          <button
            id="btn-incard-download-as-pdf"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-4 py-1.5 bg-[#0e8a75] hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-teal-100" />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Strips and normalizes any oklch color values in a cloned document/element to standard rgb/hex
 * before html2canvas executes color parsing.
 */
function sanitizeOklchInClonedDoc(clonedDoc: Document, clonedElement: HTMLElement) {
  try {
    const canvas = clonedDoc.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    const toSafeColor = (val: string): string => {
      if (!val || typeof val !== 'string' || !val.includes('oklch')) return val;
      if (!ctx) return '#1e293b';
      try {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = val;
        return ctx.fillStyle; // Native browser 2D canvas always converts to rgb(...) or #hex
      } catch {
        return '#1e293b';
      }
    };

    // 1. Sanitize all <style> blocks in the cloned document
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
        styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, (match) => toSafeColor(match));
      }
    });

    // 2. Walk all elements in the cloned subtree and convert all computed color styles into standard inline rgb()
    const elements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
    const colorProps = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'outlineColor',
      'fill',
      'stroke',
    ];

    elements.forEach((el) => {
      if (!el || !el.style) return;
      try {
        const computed = window.getComputedStyle(el);
        colorProps.forEach((prop) => {
          const val = (computed as any)[prop];
          if (val && typeof val === 'string' && val.includes('oklch')) {
            (el.style as any)[prop] = toSafeColor(val);
          }
        });

        if (computed.boxShadow && computed.boxShadow.includes('oklch')) {
          el.style.boxShadow = computed.boxShadow.replace(/oklch\([^)]+\)/g, (match) => toSafeColor(match));
        }
      } catch {
        // ignore individual element access errors
      }
    });
  } catch (err) {
    console.warn('oklch sanitization error:', err);
  }
}

/**
 * Resolves the html2pdf engine reliably from window or dynamic imports
 */
async function getHtml2PdfEngine(): Promise<any> {
  if (typeof (window as any).html2pdf === 'function') {
    return (window as any).html2pdf;
  }
  try {
    // @ts-ignore
    const mod: any = await import('html2pdf.js');
    if (typeof mod === 'function') return mod;
    if (typeof mod.default === 'function') return mod.default;
    if (typeof mod.default?.default === 'function') return mod.default.default;
    if (typeof mod.html2pdf === 'function') return mod.html2pdf;
  } catch (err) {
    console.warn('html2pdf module import error, using canvas fallback if needed', err);
  }
  return typeof (window as any).html2pdf === 'function' ? (window as any).html2pdf : null;
}

/**
 * Standalone helper to download any marksheet card element as a clean PDF using html2pdf.js
 * with automated high-fidelity fallback.
 */
export async function downloadMarksheetElementAsPDF(
  elementId: string = 'official-takamul-marksheet-card',
  fileName: string = 'Takamul_SVP_Marksheet.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found in DOM`);
  }

  // 1. Try html2pdf engine first
  const html2pdf = await getHtml2PdfEngine();
  if (html2pdf) {
    try {
      const opt: any = {
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          logging: false,
          ignoreElements: (el: Element) =>
            el.getAttribute('data-html2canvas-ignore') === 'true' ||
            el.classList.contains('no-print'),
          onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
            sanitizeOklchInClonedDoc(clonedDoc, clonedEl);
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      };

      await html2pdf().set(opt).from(element).save();
      return;
    } catch (engineErr) {
      console.warn('html2pdf engine error, executing direct canvas fallback:', engineErr);
    }
  }

  // 2. High-fidelity direct html2canvas + jsPDF fallback (guaranteed to render and save)
  const html2canvasMod = await import('html2canvas');
  const html2canvas = html2canvasMod.default || html2canvasMod;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollY: 0,
    scrollX: 0,
    logging: false,
    ignoreElements: (el: Element) =>
      el.getAttribute('data-html2canvas-ignore') === 'true' ||
      el.classList.contains('no-print'),
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      sanitizeOklchInClonedDoc(clonedDoc, clonedEl);
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const printWidth = pageWidth - margin * 2;
  const printHeight = (canvas.height * printWidth) / canvas.width;

  pdf.addImage(
    imgData,
    'JPEG',
    margin,
    margin,
    printWidth,
    Math.min(printHeight, pageHeight - margin * 2)
  );
  pdf.save(fileName);
}
