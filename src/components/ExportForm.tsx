'use client';
import { useState } from 'react';

export default function ExportForm() {
  const [month, setMonth] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;

    setIsExporting(true);
    
    try {
      // Create a link to trigger the download directly from the browser
      const url = `/api/export?month=${month}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `impactx-export-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Export Monthly Tickets</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Select a month to export all submissions. The export will contain all details including the full description of each ticket in CSV format.
      </p>
      
      <form onSubmit={handleExport} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <input
            type="month"
            id="month"
            name="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="input-field"
            max={new Date().toISOString().slice(0, 7)}
          />
        </div>
        
        <button
          type="submit"
          disabled={!month || isExporting}
          className="primary-btn flex items-center justify-center gap-2 px-6 disabled:opacity-50 h-10 w-full sm:w-auto"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </>
          )}
        </button>
      </form>
    </div>
  );
}
