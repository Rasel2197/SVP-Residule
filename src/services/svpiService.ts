/**
 * SVPI Sync Service (src/services/svpiService.ts)
 * 
 * Handles authentication against the SVPI (Saudi Skill Verification Program International) portal API,
 * manages temporary encrypted session tokens, and provides automated fetching mechanisms to pull
 * real-time candidate examination status data.
 */

import { Candidate, ExamStatus } from '../types';
import {
  storeSvpiTemporarySession,
  retrieveSvpiTemporarySession,
  clearSvpiTemporarySession,
} from '../utils/secureSession';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface SvpiAuthCredentials {
  email?: string;
  identifier?: string;
  password?: string;
  otp?: string;
  passportNumber?: string;
}

export interface SvpiCandidateExamStatus {
  candidateId: string;
  fullName: string;
  email: string;
  passportNumber: string;
  trade: string;
  examCenter: string;
  examDate: string;
  examStatus: ExamStatus;
  ticketNumber?: string;
  admitSlipUrl?: string;
  theoryScore?: number;
  practicalScore?: number;
  resultStatus?: 'PASS' | 'FAIL';
  lastSyncedAt: string;
  source: 'SVPI_LIVE_PORTAL' | 'LOCAL_CACHE';
}

export interface SvpiAuthResult {
  success: boolean;
  sessionToken?: string;
  requireOtp?: boolean;
  data?: SvpiCandidateExamStatus;
  portalLiveSynced?: boolean;
  error?: string;
  message: string;
}

export interface SvpiSyncResult {
  success: boolean;
  synced: boolean;
  data?: SvpiCandidateExamStatus;
  error?: string;
  message: string;
}

/**
 * Standard parser to normalize raw SVPI exam status
 */
export function parseSvpiExamStatus(rawStatus?: string | null): ExamStatus {
  if (!rawStatus) return 'UPCOMING';
  const clean = String(rawStatus).toUpperCase().trim();
  if (
    clean.includes('PASS') ||
    clean.includes('FAIL') ||
    clean.includes('COMPLET') ||
    clean.includes('DONE') ||
    clean.includes('PRESENT')
  ) {
    return 'COMPLETED';
  }
  if (
    clean.includes('CANCEL') ||
    clean.includes('REJECT') ||
    clean.includes('ABSENT') ||
    clean.includes('EXPIRE')
  ) {
    return 'CANCELLED';
  }
  return 'UPCOMING';
}

/**
 * Parses raw SVPI platform API responses into a clean structured examination status object
 */
export function parseCandidateExamStatus(raw: any): SvpiCandidateExamStatus {
  if (!raw) {
    throw new Error('Empty response received from SVPI platform');
  }

  const payload = raw.data || raw.candidate || raw;
  const examStatus = parseSvpiExamStatus(payload.examStatus || payload.status);

  return {
    candidateId: payload.candidateId || payload.id || `TK-${Date.now().toString().slice(-6)}`,
    fullName: payload.fullName || payload.name || payload.candidateName || 'Verified Candidate',
    email: payload.email || '',
    passportNumber: payload.passportNumber || payload.passport || '',
    trade: payload.trade || payload.occupation || 'Building Electrician',
    examCenter: payload.examCenter || payload.center || payload.ttcName || "Dhaka Technical Teachers' Training College (TTC)",
    examDate: payload.examDate || payload.date || new Date().toISOString().split('T')[0],
    examStatus,
    ticketNumber: payload.ticketNumber || payload.ticketNo || payload.admitCardNumber || undefined,
    admitSlipUrl: payload.admitSlipUrl || payload.slipUrl || undefined,
    theoryScore: typeof payload.theoryScore === 'number' ? payload.theoryScore : undefined,
    practicalScore: typeof payload.practicalScore === 'number' ? payload.practicalScore : undefined,
    resultStatus: payload.resultStatus || (payload.score && payload.score >= 50 ? 'PASS' : undefined),
    lastSyncedAt: payload.lastSyncedAt || payload.syncedAt || new Date().toISOString(),
    source: payload.source || 'SVPI_LIVE_PORTAL',
  };
}

/**
 * Authenticates candidate or operator credentials against the SVPI platform API via the backend proxy.
 * Includes error handling for invalid credentials, OTP requirements, and network timeouts.
 * Ensures temporary session tokens are stored in the encrypted storage wrapper.
 */
export async function authenticateSvpi(credentials: SvpiAuthCredentials): Promise<SvpiAuthResult> {
  const targetUser = (credentials.identifier || credentials.email || '').trim();

  if (!targetUser) {
    return {
      success: false,
      error: 'MISSING_IDENTIFIER',
      message: 'SVPI লগইনের জন্য ইমেইল বা ক্যান্ডিডেট আইডি প্রদান করুন।',
    };
  }

  if (!credentials.password && !credentials.otp) {
    return {
      success: false,
      error: 'MISSING_CREDENTIALS',
      message: 'পাসওয়ার্ড অথবা ওটিপি প্রদান করা আবশ্যক।',
    };
  }

  try {
    const response = await fetch('/api/svpi/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email || targetUser,
        identifier: targetUser,
        password: credentials.password,
        otp: credentials.otp,
        passportNumber: credentials.passportNumber,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || 'SVPI পোর্টাল ক্রেডেনশিয়াল প্রত্যাখ্যান করেছে। সঠিক ইমেইল ও পাসওয়ার্ড দিন।';
      return {
        success: false,
        error: data?.error || 'INVALID_CREDENTIALS',
        message: errorMsg,
      };
    }

    if (data.requireOtp) {
      return {
        success: false,
        requireOtp: true,
        message: data.message || 'SVPI পোর্টালে ২-ধাপ যাচাইকরণের জন্য ইমেইলে ওটিপি পাঠানো হয়েছে।',
      };
    }

    if (data.success && data.sessionToken) {
      const parsedStatus = parseCandidateExamStatus(data.data || data);

      // Store in encrypted temporary session wrapper (never plaintext passwords or localStorage)
      await storeSvpiTemporarySession(data.sessionToken, parsedStatus);

      return {
        success: true,
        sessionToken: data.sessionToken,
        data: parsedStatus,
        portalLiveSynced: Boolean(data.portalLiveSynced),
        message: data.message || 'SVPI পোর্টালে সফলভাবে লগইন ও সেশন তৈরি সম্পন্ন হয়েছে।',
      };
    }

    return {
      success: false,
      error: 'AUTH_FAILED',
      message: data?.message || 'SVPI অথেন্টিকেশন সম্পন্ন করা যায়নি।',
    };
  } catch (err: any) {
    console.error('[svpiService] Authentication network failure:', err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'SVPI প্রক্সি সার্ভারে সংযোগ স্থাপন করা যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।',
    };
  }
}

/**
 * Fetches real-time examination status data from SVPI portal API.
 * Uses the temporary session token passed directly or retrieved from encrypted storage.
 */
export async function fetchRealtimeExamStatus(
  sessionToken?: string,
  passportNumber?: string
): Promise<SvpiCandidateExamStatus> {
  let activeToken = sessionToken;

  if (!activeToken) {
    const session = await retrieveSvpiTemporarySession();
    activeToken = session?.token;
  }

  if (!activeToken) {
    throw new Error('SVPI সেশন টোকেন বিদ্যমান নেই। অনুগ্রহ করে প্রথমে লগইন করুন।');
  }

  const response = await fetch('/api/svpi/fetch-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeToken}`,
    },
    body: JSON.stringify({
      sessionToken: activeToken,
      passportNumber,
    }),
  });

  const resJson = await response.json().catch(() => null);

  if (!response.ok || !resJson?.success) {
    if (resJson?.error === 'SESSION_EXPIRED') {
      clearSvpiTemporarySession();
      throw new Error('SVPI সেশন টোকেনের মেয়াদ উত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।');
    }
    throw new Error(resJson?.message || 'SVPI পরীক্ষার রিয়েল-টাইম তথ্য আনতে ব্যর্থ হয়েছে।');
  }

  const parsedStatus = parseCandidateExamStatus(resJson.data);
  // Update encrypted session data
  await storeSvpiTemporarySession(activeToken, parsedStatus);

  return parsedStatus;
}

/**
 * Automated Fetching and Synchronization Mechanism:
 * Connects to SVPI, pulls real-time candidate examination data, and updates Firestore candidate records.
 */
export async function syncCandidateWithSvpi(
  candidateId: string,
  email: string,
  passportNumber?: string
): Promise<SvpiSyncResult> {
  try {
    const session = await retrieveSvpiTemporarySession();
    const token = session?.token;

    const response = await fetch('/api/svpi/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        sessionToken: token,
        candidateId,
        email,
        passportNumber,
      }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok || !resJson?.success) {
      return {
        success: false,
        synced: false,
        error: resJson?.error || 'SYNC_FAILED',
        message: resJson?.message || 'SVPI সিঙ্ক সম্পন্ন করা সম্ভব হয়নি।',
      };
    }

    const liveData = parseCandidateExamStatus(resJson.data);

    // Optionally update candidate document in Firestore if docId matches
    try {
      if (candidateId) {
        const candRef = doc(db, 'candidates', candidateId);
        const candSnap = await getDoc(candRef);
        if (candSnap.exists()) {
          await updateDoc(candRef, {
            trade: liveData.trade,
            examCenter: liveData.examCenter,
            examDate: liveData.examDate,
            examStatus: liveData.examStatus,
            passportNumber: liveData.passportNumber || candSnap.data().passportNumber,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (fsErr) {
      console.warn('[svpiService] Firestore sync non-fatal warning:', fsErr);
    }

    return {
      success: true,
      synced: true,
      data: liveData,
      message: 'SVPI পোর্টাল থেকে পরীক্ষার সর্বশেষ তথ্য সফলভাবে সিঙ্ক করা হয়েছে।',
    };
  } catch (err: any) {
    console.error('[svpiService] syncCandidateWithSvpi failure:', err);
    return {
      success: false,
      synced: false,
      error: 'SYNC_EXCEPTION',
      message: err.message || 'SVPI স্বয়ংক্রিয় সিঙ্ক করার সময় ত্রুটি হয়েছে।',
    };
  }
}

/**
 * Access currently stored temporary SVPI session
 */
export async function getStoredSvpiSession(): Promise<{ token: string; candidateData?: any } | null> {
  return await retrieveSvpiTemporarySession();
}

/**
 * Clear stored temporary SVPI session
 */
export function clearStoredSvpiSession(): void {
  clearSvpiTemporarySession();
}
