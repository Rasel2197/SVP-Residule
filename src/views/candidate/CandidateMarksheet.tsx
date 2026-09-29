import React, { useEffect, useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMarksheetByCandidateUid } from '../../services/apiService';
import { Marksheet } from '../../types';
import { OfficialMarksheetView } from '../../components/OfficialMarksheetView';

interface CandidateMarksheetProps {
  onNavigate: (view: string) => void;
}

export const CandidateMarksheet: React.FC<CandidateMarksheetProps> = ({ onNavigate }) => {
  const { candidate } = useAuth();
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

  return (
    <div id="candidate-marksheet-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between no-print">
        <div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            ড্যাশবোর্ডে ফিরুন (Back to Dashboard)
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            অফিসিয়াল পরীক্ষার ফলাফল ও মার্কশিট (Official Marksheet)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            SVP International · Skill Verification Program - তাত্ত্বিক ও ব্যবহারিক পরীক্ষার সার্টিফাইড প্রতিলিপি।
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          অনুমোদিত পরীক্ষার ফলাফল লোড হচ্ছে...
        </div>
      ) : !marksheet ? (
        <div
          id="no-marksheet-card"
          className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4"
        >
          <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ফলাফল এখনও প্রকাশিত হয়নি</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              আপনার পরীক্ষার মূল্যায়ন প্রক্রিয়া সম্পন্ন হলে ফলাফল বোর্ড কর্তৃক প্রকাশিত হবে এবং এখানে প্রদর্শিত হবে।
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('candidate-dashboard')}
              className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
            >
              ড্যাশবোর্ডে ফিরুন
            </button>
          </div>
        </div>
      ) : (
        <OfficialMarksheetView
          marksheet={marksheet}
          candidate={candidate}
          showActions={true}
        />
      )}
    </div>
  );
};
