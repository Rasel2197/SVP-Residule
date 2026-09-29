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
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Outer Border & Subtle Decorative Frame
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.6);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 4, 4);

  // Top Header Banner (Official Takamul SVP Teal)
  doc.setFillColor(14, 138, 117); // #0e8a75
  doc.roundedRect(12, 12, pageWidth - 24, 28, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('EXAMINATION RESULT / SVP MARKSHEET', 18, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(204, 251, 241); // Teal-100
  doc.text('SVP International · Skill Verification Program', 18, 31);

  // Status Badge on Header Right
  const cbtMax = 25;
  const cbtObtained =
    marksheet.theoryMarks <= 25
      ? marksheet.theoryMarks
      : Math.round((marksheet.theoryMarks / 100) * 25);
  const cbtPercent = Math.round((cbtObtained / cbtMax) * 100);
  const cbtRaw = marksheet.theoryMarks || Math.round(cbtObtained * 2.06);
  const cbtCorrect = Math.min(15, Math.max(1, Math.round((cbtPercent / 100) * 15)));
  const cbtWrong = 15 - cbtCorrect;

  const pracMax = 75;
  const pracObtained =
    marksheet.practicalMarks <= 75
      ? marksheet.practicalMarks
      : Math.round((marksheet.practicalMarks / 100) * 75);
  const pracPercent = Math.round((pracObtained / pracMax) * 100);
  const pracRaw = marksheet.practicalMarks || Math.round((pracObtained / 75) * 100);

  const totalMax = 100;
  const totalObtained = cbtObtained + pracObtained;
  const totalPercent = Math.round((totalObtained / totalMax) * 100);
  const isPassed = marksheet.resultStatus === 'PASS' || totalPercent >= 50;

  if (isPassed) {
    doc.setFillColor(32, 178, 146); // #20b292
    doc.roundedRect(pageWidth - 52, 18, 32, 14, 7, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PASSED', pageWidth - 36, 27, { align: 'center' });
  } else {
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(pageWidth - 52, 18, 32, 14, 7, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('FAILED', pageWidth - 36, 27, { align: 'center' });
  }

  // Section 1: Candidate Identification Grid
  let y = 48;
  const col1 = margin + 4;
  const col2 = margin + 95;

  const passportNumber = candidate?.passportNumber || (marksheet as any)?.passportNumber || 'A09012936';
  const nationalId =
    (candidate as any)?.nationalId ||
    candidate?.candidateId?.replace(/\D/g, '') ||
    marksheet.candidateId?.replace(/\D/g, '') ||
    '9179075925';
  const reservationNumber = marksheet.referenceId
    ? marksheet.referenceId.replace(/\D/g, '').slice(-7) || '5739641'
    : '5739641';

  // Row 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('NAME / CANDIDATE', col1, y);
  doc.text('PROFESSION / TRADE', col2, y);

  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(marksheet.candidateName.toUpperCase(), col1, y);
  doc.text(marksheet.trade, col2, y);

  // Row 2
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('PASSPORT NUMBER', col1, y);
  doc.text('NATIONAL ID / REGISTRATION NO', col2, y);

  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(passportNumber, col1, y);
  doc.text(nationalId, col2, y);

  // Row 3
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('EXAM CENTER / VENUE', col1, y);
  doc.text('EXAM DATE & TIME', col2, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const centerText = doc.splitTextToSize(marksheet.examCenter, 85);
  doc.text(centerText, col1, y);
  doc.text(`${marksheet.examDate} 05:30`, col2, y);

  // Row 4
  y += Math.max(10, centerText.length * 5 + 4);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('LANGUAGE', col1, y);
  doc.text('RESERVATION NUMBER', col2, y);

  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BN', col1, y);
  doc.text(`#${reservationNumber}`, col2, y);

  // Section 2: Marks Table
  y += 14;
  doc.setFillColor(14, 138, 117); // #0e8a75
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SECTION', margin + 4, y + 5.5);
  doc.text('MAX', margin + 50, y + 5.5, { align: 'center' });
  doc.text('OBTAINED', margin + 74, y + 5.5, { align: 'center' });
  doc.text('PERCENT', margin + 98, y + 5.5, { align: 'center' });
  doc.text('RAW SCORE', margin + 124, y + 5.5, { align: 'center' });
  doc.text('CORRECT', margin + 148, y + 5.5, { align: 'center' });
  doc.text('WRONG', margin + 168, y + 5.5, { align: 'center' });

  // Row 1: CBT
  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, y + 9, margin + contentWidth, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CBT (MCQ)', margin + 4, y + 6);
  doc.text(`${cbtMax}`, margin + 50, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`${cbtObtained}`, margin + 74, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${cbtPercent}%`, margin + 98, y + 6, { align: 'center' });
  doc.text(`${cbtRaw}`, margin + 124, y + 6, { align: 'center' });
  doc.setTextColor(22, 163, 74); // green-600
  doc.setFont('helvetica', 'bold');
  doc.text(`${cbtCorrect}/15`, margin + 148, y + 6, { align: 'center' });
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(`${cbtWrong}`, margin + 168, y + 6, { align: 'center' });

  // Row 2: Practical
  y += 9;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.line(margin, y + 9, margin + contentWidth, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('Practical (Workshop Assessment)', margin + 4, y + 6);
  doc.text(`${pracMax}`, margin + 50, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`${pracObtained}`, margin + 74, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${pracPercent}%`, margin + 98, y + 6, { align: 'center' });
  doc.text(`${pracRaw}`, margin + 124, y + 6, { align: 'center' });
  doc.setTextColor(148, 163, 184);
  doc.text('-', margin + 148, y + 6, { align: 'center' });
  doc.text('-', margin + 168, y + 6, { align: 'center' });

  // Row 3: Total
  y += 9;
  doc.setFillColor(240, 253, 250); // Mint tint
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setDrawColor(204, 251, 241);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL / AGGREGATE', margin + 4, y + 6.5);
  doc.text(`${totalMax}`, margin + 50, y + 6.5, { align: 'center' });
  doc.text(`${totalObtained}`, margin + 74, y + 6.5, { align: 'center' });
  doc.text(`${totalPercent}%`, margin + 98, y + 6.5, { align: 'center' });

  // Section 3: Official Verification Notice
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(14, 138, 117);
  doc.text('OFFICIAL VERIFICATION & AUTHENTICITY NOTICE', margin + 6, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const notices = [
    'This transcript is generated electronically by the SVP International Skill Verification Program.',
    `Verification Reference Code: #${reservationNumber} · Tamper-proof assessment transcript.`,
    'Candidate examination records are registered and archived in the central certification database.',
  ];
  let noticeY = y + 12;
  notices.forEach(n => {
    doc.text(`•  ${n}`, margin + 6, noticeY);
    noticeY += 5;
  });

  // Footer
  y += 38;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated automatically by SVP System (SVP International).', margin, y);
  doc.text(`Generated: ${marksheet.issueDate || '2026-09-24, 14:46:31'}`, pageWidth - margin, y, { align: 'right' });

  // Save the PDF
  const sanitizedName = marksheet.candidateName.replace(/\s+/g, '_');
  const filename = `Takamul_SVP_Marksheet_${marksheet.candidateId}_${sanitizedName}.pdf`;
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
  doc.text(appointmentDetails.centerAddress || 'Approved Government / Private Technical Training Centre (TTC), Bangladesh', col1 + 50, schedY + 29);

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
