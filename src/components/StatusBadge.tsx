import React from 'react';
import { RequestStatus, ExamStatus, ResultStatus } from '../types';

interface StatusBadgeProps {
  status: RequestStatus | ExamStatus | ResultStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['APPROVED', 'PASS', 'ACTIVE'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['PENDING'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (['REJECTED', 'FAIL', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['UPCOMING', 'SCHEDULED'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (['COMPLETED'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      id={`status-badge-${normalized.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${padding} uppercase tracking-wider font-medium`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {normalized}
    </span>
  );
};
