'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportData = {
  ticketNumber: string;
  title: string;
  author: string;
  version: string;
  lastUpdated: string;
};

export default function ExportPdfButton({ data }: { data: ExportData[] }) {
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('All Submissions Report', 14, 22);
    
    // Add subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map(sub => [
      sub.ticketNumber,
      sub.title,
      sub.author,
      sub.version,
      sub.lastUpdated
    ]);

    // Create table
    autoTable(doc, {
      startY: 35,
      head: [['Ticket Number', 'Title', 'Submitted By', 'Version', 'Last Updated']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600 color to match the theme
      styles: { fontSize: 9 },
    });
    
    // Download PDF
    doc.save('submissions_report.pdf');
  };

  return (
    <button 
      onClick={exportPDF}
      className="primary-btn flex items-center justify-center gap-2 text-sm px-4 py-2 hover:bg-indigo-700 transition-colors"
      title="Download as PDF"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  );
}
