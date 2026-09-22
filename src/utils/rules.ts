/**
 * Rules and Date Cutoff Utilities for Takamul Candidate Portal
 */

export interface CutoffCheckResult {
  allowed: boolean;
  daysRemaining: number;
  cutoffDateStr: string;
  message: string;
}

/**
 * Calculates full days remaining between a reference date (defaults to now)
 * and the target exam date (evaluated at 00:00:00).
 */
export function calculateDaysRemaining(examDateStr: string, refDate: Date = new Date()): number {
  if (!examDateStr) return -1;
  
  // Parse YYYY-MM-DD cleanly to avoid timezone offsets
  const [year, month, day] = examDateStr.split('-').map(Number);
  if (!year || !month || !day) return -1;

  // Exam date at start of day (midnight)
  const examDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Reference date at start of day
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
  
  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 3-Day Rule Enforcement:
 * A candidate may request a date or center change only when at least 3 full days
 * remain before the current exam date.
 *
 * Example from prompt:
 * If exam date is September 25, candidate may request changes until September 22.
 * If fewer than 3 days remain, request is forbidden.
 */
export function checkThreeDayCutoff(examDateStr: string, refDate: Date = new Date()): CutoffCheckResult {
  if (!examDateStr) {
    return {
      allowed: false,
      daysRemaining: 0,
      cutoffDateStr: '',
      message: 'No exam date currently assigned.'
    };
  }

  const daysRemaining = calculateDaysRemaining(examDateStr, refDate);

  // Compute the cutoff date (examDate minus 3 days)
  const [year, month, day] = examDateStr.split('-').map(Number);
  const examDate = new Date(year, month - 1, day);
  const cutoffDate = new Date(examDate);
  cutoffDate.setDate(cutoffDate.getDate() - 3);
  
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  if (daysRemaining < 3) {
    return {
      allowed: false,
      daysRemaining,
      cutoffDateStr,
      message: 'Exam date change is no longer available because the exam is less than 3 days away.'
    };
  }

  return {
    allowed: true,
    daysRemaining,
    cutoffDateStr,
    message: `You may submit a change request until ${cutoffDateStr} (${daysRemaining} days remaining).`
  };
}

export function generateCandidateId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TK-2026-${randomNum}`;
}

export function generateReferenceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TK-CERT-2026-${rand}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not Scheduled';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
