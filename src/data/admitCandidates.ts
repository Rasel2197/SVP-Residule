import { Candidate } from '../types';

/**
 * Bangladesh Takamul SVPI Verified Admit/Ticket Holder Candidates.
 * Candidates who booked their Takamul test at a Government/Private TTC in Bangladesh.
 * Only candidates with a confirmed ticket / admit card exist here.
 */
export const BANGLADESH_ADMIT_CANDIDATES: Candidate[] = [
  {
    id: 'cand-zakir-hossain',
    uid: 'uid-zakir-hossain',
    candidateId: '5841823', // Official Takamul / PACC Test Ticket Number
    fullName: 'MD ZAKIR HOSSAIN',
    passportNumber: 'A10061651',
    mobileNumber: '+880 1712 982314',
    email: 'md_zakir_hossain@yopmail.com',
    trade: 'Load and Unload Worker',
    dateOfBirth: '1996-05-12',
    examDateId: 'date-zakir-01',
    examDate: '2026-10-03',
    examCenterId: 'ttc-bogra-nishindara-real',
    examCenter: 'Bogura Technical Training Centre. Nishindara Bogura Rajshahi',
    examStatus: 'UPCOMING',
    password: 'Shamim@160',
    passwordHash: 'Shamim@160',
    createdAt: '2026-10-02T10:00:00Z',
  },
];
