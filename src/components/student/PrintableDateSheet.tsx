import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  CalendarDays,
  CheckCircle2,
  Lock,
  HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api } from '../../api/client.ts';

interface PrintableDateSheetProps {
  onOpenNeedHelp: () => void;
}

export const PrintableDateSheet: React.FC<PrintableDateSheetProps> = ({ onOpenNeedHelp }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDateSheet() {
      try {
        setLoading(true);
        const res = await api.getDateSheet();
        setData(res);
      } catch (err) {
        console.error('Failed to load finalized date sheet', err);
      } finally {
        setLoading(false);
      }
    }
    loadDateSheet();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!data) return;
    setPdfGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // University Header
      doc.setFillColor(8, 9, 11); // Ink Black
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('VIRTUAL UNIVERSITY OF ADVANCED STUDIES', 105, 12, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL EXAMINATION ROLL NO SLIP & DATE SHEET · FALL 2026', 105, 19, { align: 'center' });
      doc.text('CONTROLLER OF EXAMINATIONS', 105, 24, { align: 'center' });

      // Student and Center info box
      doc.setTextColor(8, 9, 11);
      doc.setDrawColor(221, 227, 232);
      doc.setFillColor(247, 247, 243);
      doc.roundedRect(14, 34, 182, 38, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('CANDIDATE DETAILS', 18, 41);
      doc.text('EXAM VENUE DETAILS', 110, 41);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Student Name: ${data.student.fullName}`, 18, 48);
      doc.text(`Registration No: ${data.student.regNumber}`, 18, 54);
      doc.text(`Program / Degree: ${data.student.program}`, 18, 60);
      doc.text(`CNIC / B-Form: ${data.student.cnic}`, 18, 66);

      doc.text(`Campus Branch: ${data.branch?.name || 'N/A'}`, 110, 48);
      doc.text(`Branch Code: ${data.branch?.code || 'N/A'}`, 110, 54);
      doc.text(`City: ${data.branch?.city || 'N/A'}`, 110, 60);
      doc.text(`Helpline: ${data.branch?.contactNumber || 'N/A'}`, 110, 66);

      // Timetable Table Header
      let y = 80;
      doc.setFillColor(8, 9, 11);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(200, 248, 90); // Electric Lime text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Code', 18, y + 5.5);
      doc.text('Course Title', 40, y + 5.5);
      doc.text('Date', 110, y + 5.5);
      doc.text('Day', 140, y + 5.5);
      doc.text('Shift Time', 170, y + 5.5);

      // Table rows
      y += 8;
      doc.setTextColor(8, 9, 11);
      doc.setFont('helvetica', 'normal');

      data.entries.forEach((row: any, i: number) => {
        if (i % 2 === 1) {
          doc.setFillColor(247, 247, 243);
          doc.rect(14, y, 182, 7.5, 'F');
        }
        doc.rect(14, y, 182, 7.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.text(row.courseCode, 18, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(row.courseTitle.substring(0, 38), 40, y + 5);
        doc.text(row.examDate, 110, y + 5);
        doc.text(row.day, 140, y + 5);
        doc.text(`${row.startTime} - ${row.endTime}`, 170, y + 5);
        y += 7.5;
      });

      // Instructions
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('INSTRUCTIONS FOR THE CANDIDATE:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('1. Candidates must arrive at the examination hall at least 30 minutes prior to scheduled start time.', 14, y);
      y += 4;
      doc.text('2. Original CNIC / B-Form and this printed Roll Number Slip are strictly mandatory for entry.', 14, y);
      y += 4;
      doc.text('3. Mobile phones, smartwatches, and programmable devices are strictly prohibited inside the hall.', 14, y);
      y += 4;
      doc.text('4. This timetable was customized and finalized by the student under self-service date sheet regulations.', 14, y);

      // Sign-off
      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.text('Controller of Examinations', 150, y);
      doc.setFont('helvetica', 'normal');
      doc.text('Virtual University System', 150, y + 4);

      doc.save(`ExamSlot_DateSheet_${data.student.regNumber}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { student, branch, entries } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      {/* Top Banner (Hidden in print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#16865B] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
                Exam Date Sheet Finalized
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9ECF8] text-[#08090B] flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3" />
                LOCKED
              </span>
            </div>
            <p className="text-xs text-[#68717D] dark:text-slate-400 mt-0.5">
              Your self-designed exam timetable is saved and ready for printing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#8ECCFF] hover:bg-[#7bc0fa] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Date Sheet</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{pdfGenerating ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={onOpenNeedHelp}
            className="px-3 py-2.5 bg-[#F7F7F3] dark:bg-slate-800 hover:bg-slate-200 text-[#08090B] dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need Help?</span>
          </button>
        </div>
      </div>

      {/* Official Academic Document Sheet */}
      <div
        ref={printableRef}
        id="printable-date-sheet"
        className="bg-white text-[#08090B] border border-[#DDE3E8] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6 print:shadow-none print:border-none print:p-0"
      >
        {/* Letterhead */}
        <div className="text-center pb-6 border-b-2 border-[#08090B] space-y-1">
          <div className="flex items-center justify-center gap-2 font-display font-bold text-xl sm:text-2xl text-[#08090B] tracking-tight">
            <CalendarDays className="w-6 h-6 text-[#16865B]" />
            VIRTUAL UNIVERSITY OF ADVANCED STUDIES
          </div>
          <div className="text-xs uppercase tracking-widest font-bold text-[#68717D]">
            OFFICE OF THE CONTROLLER OF EXAMINATIONS
          </div>
          <div className="text-xs font-bold text-[#08090B] bg-[#D9ECF8] inline-block px-4 py-1 rounded-full mt-2">
            OFFICIAL ROLL NUMBER SLIP & SELF-DESIGNED EXAM DATE SHEET · FALL 2026
          </div>
        </div>

        {/* Candidate & Venue Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F7F7F3] border border-[#DDE3E8] text-xs">
          <div className="space-y-1.5">
            <div className="font-bold text-[#08090B] text-xs border-b border-[#DDE3E8] pb-1 uppercase tracking-wider">
              Candidate Information
            </div>
            <div><span className="text-[#68717D]">Name:</span> <strong className="text-[#08090B]">{student.fullName}</strong></div>
            <div><span className="text-[#68717D]">Roll No:</span> <strong className="font-mono text-[#08090B]">{student.regNumber}</strong></div>
            <div><span className="text-[#68717D]">Program:</span> <strong className="text-[#08090B]">{student.program}</strong></div>
            <div><span className="text-[#68717D]">Semester:</span> <span>Sem {student.semester} ({student.sessionBatch})</span></div>
            <div><span className="text-[#68717D]">CNIC:</span> <span className="font-mono text-[#08090B]">{student.cnic}</span></div>
          </div>

          <div className="space-y-1.5">
            <div className="font-bold text-[#08090B] text-xs border-b border-[#DDE3E8] pb-1 uppercase tracking-wider">
              Assigned Examination Venue
            </div>
            <div><span className="text-[#68717D]">Campus:</span> <strong className="text-[#08090B]">{branch?.name}</strong></div>
            <div><span className="text-[#68717D]">Code:</span> <strong className="font-mono text-[#08090B]">{branch?.code}</strong></div>
            <div><span className="text-[#68717D]">City:</span> <span>{branch?.city}</span></div>
            <div><span className="text-[#68717D]">Address:</span> <span>{branch?.address}</span></div>
            <div><span className="text-[#68717D]">Helpline:</span> <span className="font-mono text-[#08090B]">{branch?.contactNumber}</span></div>
          </div>
        </div>

        {/* Chronologically Sorted Timetable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#DDE3E8] text-xs">
            <thead>
              <tr className="bg-[#08090B] text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 border border-slate-700">Course Code</th>
                <th className="py-3 px-3.5 border border-slate-700">Course Title</th>
                <th className="py-3 px-3.5 border border-slate-700">Credits</th>
                <th className="py-3 px-3.5 border border-slate-700">Exam Date</th>
                <th className="py-3 px-3.5 border border-slate-700">Day</th>
                <th className="py-3 px-3.5 border border-slate-700">Shift / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8]">
              {entries.map((entry: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F7F3]'}>
                  <td className="py-3 px-3.5 font-mono font-bold text-[#08090B] border border-[#DDE3E8]">
                    {entry.courseCode}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#08090B] border border-[#DDE3E8]">
                    {entry.courseTitle}
                  </td>
                  <td className="py-3 px-3.5 text-[#68717D] border border-[#DDE3E8]">
                    {entry.creditHours} CH
                  </td>
                  <td className="py-3 px-3.5 font-mono font-bold text-[#08090B] border border-[#DDE3E8]">
                    {entry.examDate}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-[#08090B] border border-[#DDE3E8]">
                    {entry.day}
                  </td>
                  <td className="py-3 px-3.5 font-mono font-bold text-[#16865B] border border-[#DDE3E8]">
                    {entry.startTime} - {entry.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rules */}
        <div className="pt-4 border-t border-[#DDE3E8] space-y-4">
          <div className="p-3.5 bg-[#F7F7F3] border border-[#DDE3E8] rounded-2xl text-[11px] text-[#68717D] space-y-1">
            <div className="font-bold text-[#08090B] uppercase tracking-wider text-[10px]">
              Candidate Instructions:
            </div>
            <div>1. Students must bring their original CNIC / B-Form and this printed Admit Card to every examination paper.</div>
            <div>2. Entry closes strictly 15 minutes before exam start time.</div>
            <div>3. Electronic gadgets, mobile phones, and bags are prohibited inside the hall.</div>
          </div>

          <div className="flex items-end justify-between pt-6 text-xs text-[#68717D]">
            <div>
              <div>System Hash: <span className="font-mono font-bold text-[#08090B]">ES-VERIFIED-2026-OK</span></div>
              <div className="text-[10px]">Generated via ExamSlot Self-Service Engine</div>
            </div>

            <div className="text-center space-y-1">
              <div className="w-40 border-b border-slate-400 pb-6 font-serif italic text-[#08090B]">
                Dr. Tariq M. Qureshi
              </div>
              <div className="font-bold text-[#08090B] text-[11px]">Controller of Examinations</div>
              <div className="text-[10px]">Virtual University of Pakistan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
