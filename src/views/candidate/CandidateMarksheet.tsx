import React, { useEffect, useState } from 'react';
import { FileText, Download, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Printer, Calendar, Building2, User, Award, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMarksheetByCandidateUid } from '../../services/apiService';
import { Marksheet } from '../../types';
import { generateMarksheetPDF } from '../../utils/pdfGenerator';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../utils/rules';

interface CandidateMarksheetProps {
  onNavigate: (view: string) => void;
}

export const CandidateMarksheet: React.FC<CandidateMarksheetProps> = ({ onNavigate }) => {
  const { candidate } = useAuth();
  const { showToast } = useToast();

  const [marksheet, setMarksheet] = useState<Marksheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMarksheet() {
      if (!candidate) return;
      const candUid = candidate.uid || candidate.candidateId;
      setIsLoading(true);
      try {
        const ms = await getMarksheetByCandidateUid(candUid);
        setMarksheet(ms);
      } catch (err) {
        console.error('Failed to load marksheet:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMarksheet();
  }, [candidate]);

  const handleDownload = () => {
    if (!marksheet) return;
    generateMarksheetPDF(marksheet, candidate);
    showToast('Marksheet PDF downloaded successfully.', 'success');
  };

  const isPass = marksheet?.resultStatus === 'PASS';

  return (
    <div id="candidate-marksheet-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Official Examination Marksheet
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Certified transcript of professional skill assessment and knowledge evaluation.
          </p>
        </div>

        {marksheet && (
          <div className="flex items-center gap-3">
            <button
              id="btn-download-marksheet-pdf"
              onClick={handleDownload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          Loading authorized examination record...
        </div>
      ) : !marksheet ? (
        <div id="no-marksheet-card" className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Marksheet Not Yet Published</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your official examination assessment has either not taken place yet or is currently undergoing review by the board of examiners. Once approved by the administrator, your transcript will be available here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('candidate-dashboard')}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Professional A4-Styled Marksheet Container */
        <div
          id="official-marksheet-document"
          className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6 sm:p-10 relative overflow-hidden"
        >
          {/* Watermark Security Notice */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">TAKAMUL CANDIDATE PORTAL</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                  Official Skill Verification & Assessment Registry
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                <Hash className="w-3.5 h-3.5" />
                <span>Ref: <strong className="font-mono text-slate-800">{marksheet.referenceId}</strong></span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Issue Date: {formatDate(marksheet.issueDate)}
              </p>
            </div>
          </div>

          {/* Candidate Profile Details Block */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Candidate & Assessment Identification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Candidate Name:</span>
                <strong className="text-slate-900 text-sm">{marksheet.candidateName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Candidate ID:</span>
                <strong className="text-slate-900 font-mono text-sm">{marksheet.candidateId}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Trade Assessed:</span>
                <strong className="text-slate-900 text-sm">{marksheet.trade}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Passport Number:</span>
                <strong className="text-slate-900 font-mono text-sm">{candidate?.passportNumber || 'On Record'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Exam Date:</span>
                <strong className="text-slate-900">{formatDate(marksheet.examDate)}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Exam Center:</span>
                <strong className="text-slate-900">{marksheet.examCenter}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Accreditation:</span>
                <strong className="text-slate-900">National Standard</strong>
              </div>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Examination Score Breakdown
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="p-3">Examination Component</th>
                    <th className="p-3 text-center">Max Marks</th>
                    <th className="p-3 text-center">Pass Mark</th>
                    <th className="p-3 text-right">Marks Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">
                      Section 1: Theoretical Assessment & Technical Regulations
                    </td>
                    <td className="p-3 text-center text-slate-600">100</td>
                    <td className="p-3 text-center text-slate-600">50</td>
                    <td className="p-3 text-right font-bold text-slate-900 text-sm">
                      {marksheet.theoryMarks}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-800">
                      Section 2: Practical Competency & Applied Workshop Execution
                    </td>
                    <td className="p-3 text-center text-slate-600">100</td>
                    <td className="p-3 text-center text-slate-600">50</td>
                    <td className="p-3 text-right font-bold text-slate-900 text-sm">
                      {marksheet.practicalMarks}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td className="p-3.5 text-sm">AGGREGATE TOTAL SCORE</td>
                    <td className="p-3.5 text-center">{marksheet.maxMarks || 200}</td>
                    <td className="p-3.5 text-center">100</td>
                    <td className="p-3.5 text-right text-base text-blue-700 font-extrabold">
                      {marksheet.totalMarks} / {marksheet.maxMarks || 200}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Result Status Banner */}
          <div
            id="result-status-box"
            className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isPass
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isPass ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-bold opacity-75">
                  Final Official Outcome
                </span>
                <h4 className="text-xl font-extrabold tracking-tight">
                  {isPass ? 'PASSED — CERTIFIED COMPETENT' : 'FAILED — RE-EXAMINATION REQUIRED'}
                </h4>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6">
              <span className="text-xs block text-slate-600 font-medium">Result Status:</span>
              <span
                className={`inline-block font-extrabold text-sm px-3 py-1 rounded-full uppercase mt-1 ${
                  isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {marksheet.resultStatus}
              </span>
            </div>
          </div>

          {/* Security & Authentication Notice */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>
              Security Certificate Verification: <strong>{marksheet.referenceId}</strong>.
              Certified electronically by Examination Board.
            </p>
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-mono">
              Immutable Candidate Record
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
