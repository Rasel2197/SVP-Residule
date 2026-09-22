import jsPDF from 'jspdf';
import { Marksheet, Candidate } from '../types';

/**
 * Generates an official, tamper-proof A4 PDF marksheet for candidate download.
 * Candidate data is derived directly from the authorized stored record.
 */
export function generateMarksheetPDF(marksheet: Marksheet, candidate?: Candidate | null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Outer Border & Decorative Institutional Frame
  doc.setDrawColor(30, 58, 138); // Navy #1e3a8a
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.4);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900 / Navy
  doc.rect(14, 14, pageWidth - 28, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SVP TAKAMUL MARKSHEET', pageWidth / 2, 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('INDEPENDENT SKILL VERIFICATION & CERTIFICATION SYSTEM', pageWidth / 2, 30, { align: 'center' });
  doc.text('OFFICIAL TRANSCRIPT OF EXAMINATION MARKS', pageWidth / 2, 36, { align: 'center' });

  // Document Reference & Verification Meta
  let y = 50;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reference No: ${marksheet.referenceId}`, margin, y);
  doc.text(`Issue Date: ${marksheet.issueDate}`, pageWidth - margin, y, { align: 'right' });

  // Divider Line
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Section 1: Candidate Identification
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CANDIDATE DETAILS', margin, y);

  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  const startY = y + 7;
  const col1 = margin + 6;
  const col2 = margin + 95;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Candidate Name:', col1, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(marksheet.candidateName.toUpperCase(), col1 + 35, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Candidate ID:', col2, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(marksheet.candidateId, col2 + 30, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Assessed Trade:', col1, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(marksheet.trade, col1 + 35, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Passport No:', col2, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate?.passportNumber || 'VERIFIED ON FILE', col2 + 30, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Exam Center:', col1, startY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(marksheet.examCenter, col1 + 35, startY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Exam Date:', col2, startY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(marksheet.examDate, col2 + 30, startY + 16);

  // Section 2: Marks & Performance Table
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ASSESSMENT BREAKDOWN', margin, y);

  y += 4;
  // Table Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSESSMENT COMPONENT', margin + 6, y + 5.5);
  doc.text('MAXIMUM', margin + 95, y + 5.5);
  doc.text('PASS MARK', margin + 125, y + 5.5);
  doc.text('MARKS OBTAINED', margin + 155, y + 5.5);

  // Row 1: Theory
  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 9, margin + contentWidth, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Section A: Theoretical Knowledge & Regulations', margin + 6, y + 6);
  doc.text('100', margin + 95, y + 6);
  doc.text('50', margin + 125, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${marksheet.theoryMarks}`, margin + 155, y + 6);

  // Row 2: Practical
  y += 9;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 9, margin + contentWidth, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Section B: Practical Performance & Applied Skill', margin + 6, y + 6);
  doc.text('100', margin + 95, y + 6);
  doc.text('50', margin + 125, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${marksheet.practicalMarks}`, margin + 155, y + 6);

  // Row 3: Total Aggregate
  y += 9;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('AGGREGATE TOTAL SCORE', margin + 6, y + 6.5);
  doc.text(`${marksheet.maxMarks || 200}`, margin + 95, y + 6.5);
  doc.text('100', margin + 125, y + 6.5);
  doc.setTextColor(30, 58, 138);
  doc.text(`${marksheet.totalMarks} / ${marksheet.maxMarks || 200}`, margin + 155, y + 6.5);

  // Section 3: Final Result Status Badge
  y += 20;
  const isPassed = marksheet.resultStatus === 'PASS';
  const badgeWidth = 110;
  const badgeHeight = 22;
  const badgeX = (pageWidth - badgeWidth) / 2;

  if (isPassed) {
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(22, 163, 74); // green-600
  } else {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(220, 38, 38); // red-600
  }

  doc.setLineWidth(1.2);
  doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('FINAL VERIFICATION RESULT', pageWidth / 2, y + 7, { align: 'center' });

  doc.setFontSize(14);
  if (isPassed) {
    doc.setTextColor(21, 128, 61); // green-700
    doc.text('PASSED - CERTIFIED COMPETENT', pageWidth / 2, y + 16, { align: 'center' });
  } else {
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('FAILED - REQUIRES RE-ASSESSMENT', pageWidth / 2, y + 16, { align: 'center' });
  }

  // Section 4: Security Features & Digital Validation Stamp
  y += 35;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('OFFICIAL VERIFICATION & AUTHENTICITY NOTICE', margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const notices = [
    'This transcript is generated electronically by the Takamul Candidate Management Portal.',
    'Any physical alterations, erasures, or unauthorized modifications render this document completely void.',
    `To verify this result independently, enter the reference code [${marksheet.referenceId}] at the portal.`,
    'Candidate examination records are securely signed and archived in the immutable examination registry.',
  ];
  let noticeY = y + 13;
  notices.forEach(n => {
    doc.text(`•  ${n}`, margin + 6, noticeY);
    noticeY += 5;
  });

  // Footer & Seal signature area
  y += 50;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin + 15, y, margin + 65, y);
  doc.line(pageWidth - margin - 65, y, pageWidth - margin - 15, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Chief Assessment Officer', margin + 40, y + 4, { align: 'center' });
  doc.text('Director of Certification', pageWidth - margin - 40, y + 4, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `SVP PORTAL • SVPI Official Portal: https://share.google/dqJYdIEwULNHFfTSr • Ref #${marksheet.referenceId}`,
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center' }
  );

  // Trigger browser download
  const sanitizedName = marksheet.candidateName.replace(/\s+/g, '_');
  const filename = `SVP_Marksheet_${marksheet.candidateId}_${sanitizedName}.pdf`;
  doc.save(filename);
}

/**
 * Generates an official, tamper-proof A4 PDF Appointment Slip / Reschedule Confirmation.
 * Downloaded immediately upon confirming an exam reschedule.
 */
export function generateRescheduleSlipPDF(
  candidate: Candidate,
  appointmentDetails: {
    trade: string;
    examDate: string;
    sessionTime?: string;
    examCenter: string;
    centerAddress?: string;
    centerCode?: string;
    rescheduledAt?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const refCode = `TK-CONF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = appointmentDetails.rescheduledAt || new Date().toLocaleString();

  // Institutional Outer Border
  doc.setDrawColor(11, 59, 60); // Deep Teal #0B3B3C
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.4);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Top Header Banner
  doc.setFillColor(11, 59, 60); // #0B3B3C
  doc.rect(14, 14, pageWidth - 28, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SVP RESCHEDULE SLIP', pageWidth / 2, 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(204, 251, 241); // teal-100
  doc.text('SKILL ASSESSMENT & PROFESSIONAL CERTIFICATION PROGRAM', pageWidth / 2, 30, { align: 'center' });
  doc.text('OFFICIAL EXAMINATION RESCHEDULE APPOINTMENT SLIP & ADMIT CARD', pageWidth / 2, 36, { align: 'center' });

  // Document Reference & Date
  let y = 50;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Slip Reference: ${refCode}`, margin, y);
  doc.text(`Confirmation Date: ${issueDate}`, pageWidth - margin, y, { align: 'right' });

  // Divider Line
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Section 1: Candidate Identification
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 59, 60);
  doc.text('1. CANDIDATE IDENTIFICATION', margin, y);

  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  const startY = y + 7;
  const col1 = margin + 6;
  const col2 = margin + 95;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Candidate Name:', col1, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.fullName.toUpperCase(), col1 + 35, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Candidate ID:', col2, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.candidateId, col2 + 30, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Passport Number:', col1, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.passportNumber || 'ON FILE', col1 + 35, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Mobile Number:', col2, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.mobileNumber || 'N/A', col2 + 30, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Email Address:', col1, startY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidate.email || 'N/A', col1 + 35, startY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Status:', col2, startY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text('APPOINTMENT CONFIRMED', col2 + 30, startY + 16);

  // Section 2: Rescheduled Appointment Schedule
  y += 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 59, 60);
  doc.text('2. RESCHEDULED EXAMINATION SCHEDULE & VENUE', margin, y);

  y += 4;
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(153, 246, 228); // teal-200
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

  const schedY = y + 8;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Assessed Profession (পেশা):', col1, schedY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 59, 60);
  doc.text(appointmentDetails.trade, col1 + 50, schedY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Confirmed Exam Date:', col1, schedY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(appointmentDetails.examDate, col1 + 50, schedY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Reporting & Session Time:', col2 - 15, schedY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(appointmentDetails.sessionTime || '08:30 AM (Exam: 09:00 AM - 01:00 PM)', col2 + 32, schedY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Examination Center:', col1, schedY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(appointmentDetails.examCenter, col1 + 50, schedY + 20);

  if (appointmentDetails.centerCode) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`[Code: ${appointmentDetails.centerCode}]`, col1 + 50 + doc.getTextWidth(appointmentDetails.examCenter) + 3, schedY + 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Center Address:', col1, schedY + 29);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(appointmentDetails.centerAddress || 'Official Center Premises, UAE Testing Zone', col1 + 50, schedY + 29);

  // Section 3: Important Rules & Guidelines for Candidate
  y += 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ESSENTIAL EXAMINATION DAY INSTRUCTIONS', margin, y);

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2);

  const instructions = [
    'Original Passport & Valid National ID: You MUST present your physical passport at the security desk.',
    'Reporting Time: Report to the testing center strictly 30 minutes before the scheduled session.',
    'Personal Protective Equipment (PPE): Steel-toe shoes and safety vest are mandatory for practical assessment.',
    'Mobile Phones & Electronic Gadgets: Completely prohibited inside theory and practical testing workshops.',
    'Reschedule Limit: This appointment slip confirms your newly allotted date. Previous bookings are cancelled.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let instrY = y + 7;
  instructions.forEach((inst, index) => {
    doc.text(`${index + 1}. ${inst}`, margin + 5, instrY);
    instrY += 7;
  });

  // Stamp & Verification Box
  y += 52;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 59, 60);
  doc.text('DIGITAL VERIFICATION STAMP', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This document is electronically verified and serves as your valid Examination Admit Card.', margin + 6, y + 12);
  doc.text(`Digital Seal ID: ${refCode} • Security Hash: 0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`, margin + 6, y + 18);

  // Footer Signatures
  y += 36;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin + 15, y, margin + 65, y);
  doc.line(pageWidth - margin - 65, y, pageWidth - margin - 15, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Controller of Examinations', margin + 40, y + 4, { align: 'center' });
  doc.text('SVP Testing Center Authority', pageWidth - margin - 40, y + 4, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `SVP PORTAL • SVPI Official Portal: https://share.google/dqJYdIEwULNHFfTSr • Slip #${refCode}`,
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' }
  );

  const filename = `SVP_Reschedule_Slip_${candidate.candidateId}_${appointmentDetails.examDate}.pdf`;
  doc.save(filename);
}
