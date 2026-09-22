export type UserRole = 'candidate' | 'admin' | 'operator';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type ExamStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export type ResultStatus = 'PASS' | 'FAIL';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName?: string;
  candidateId?: string;
  createdAt: string;
}

export interface Candidate {
  id: string; // Firestore document ID
  uid?: string;
  candidateId: string; // e.g. TK-2026-001
  fullName: string;
  passportNumber: string;
  mobileNumber: string;
  email: string;
  trade: string;
  dateOfBirth: string; // YYYY-MM-DD
  examDateId?: string;
  examDate?: string; // YYYY-MM-DD
  examCenterId?: string;
  examCenter?: string;
  examStatus: ExamStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamDate {
  id: string;
  date: string; // YYYY-MM-DD
  sessionTime: string; // e.g. "09:00 AM - 12:00 PM"
  trade: string; // Specific trade or "All Trades"
  capacity: number;
  bookedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExamCenter {
  id: string;
  name: string;
  code: string; // e.g. "TC-DXB-01"
  city: string;
  address: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface DateChangeRequest {
  id: string;
  candidateDocId: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  currentExamDate: string;
  requestedExamDateId: string;
  requestedExamDate: string;
  requestDate: string; // YYYY-MM-DD
  status: RequestStatus;
  reason?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CenterChangeRequest {
  id: string;
  candidateDocId: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  currentExamCenter: string;
  requestedExamCenterId: string;
  requestedExamCenter: string;
  requestDate: string; // YYYY-MM-DD
  status: RequestStatus;
  reason?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Marksheet {
  id: string;
  candidateDocId: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  trade: string;
  examDate: string;
  examCenter: string;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  maxMarks: number;
  percentage?: number;
  resultStatus: ResultStatus;
  issueDate: string;
  referenceId: string; // Unique verification certificate ID (e.g. TK-CERT-2026-94812)
  remarks?: string;
  issuedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  candidateId?: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalCandidates: number;
  upcomingExams: number;
  pendingDateRequests: number;
  pendingCenterRequests: number;
  passedCandidates: number;
  failedCandidates: number;
}

export interface OperatorUser {
  id: string; // Document ID
  uid: string;
  email: string;
  fullName: string;
  agencyName?: string;
  phoneNumber?: string;
  role: 'operator';
  credits: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CreditActionType = 'RESCHEDULE' | 'MARKSHEET' | 'RECHARGE' | 'DEDUCT';

export interface CreditTransaction {
  id: string;
  operatorUid: string;
  operatorEmail: string;
  operatorName: string;
  type: CreditActionType;
  amount: number; // e.g. -1 for task, +N for recharge
  balanceAfter: number;
  candidateId?: string;
  candidateName?: string;
  description: string;
  performedBy: string; // 'operator' or admin email
  referenceTrx?: string;
  createdAt: string;
}

export interface RechargeRequest {
  id: string;
  operatorUid: string;
  operatorEmail: string;
  operatorName: string;
  agencyName?: string;
  requestedCredits: number;
  paymentMethod?: string;
  trxId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
