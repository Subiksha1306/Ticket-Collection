'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ExportVersion = {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  createdAt: string;
  isDraft: boolean;
};

type ExportSubmission = {
  id: string;
  ticketNumber: string;
  status: string;
  score: number | null;
  category: string | null;
  versions: ExportVersion[];
};

type ExportUser = {
  id: string;
  name: string;
  email: string;
  submissions: ExportSubmission[];
};

export default function ExportViewClient() {
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<ExportUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  
  // Track which submission IDs are selected for export
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData(month);
  }, [month]);

  const fetchData = async (selectedMonth: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/preview?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json: ExportUser[] = await res.json();
      setData(json);
      
      // Auto-select all submissions by default
      const allIds = new Set<string>();
      json.forEach(user => {
        user.submissions.forEach(sub => allIds.add(sub.id));
      });
      setSelectedSubmissions(allIds);
      
      // Auto-expand all users by default
      const expanded: Record<string, boolean> = {};
      json.forEach(user => expanded[user.id] = true);
      setExpandedUsers(expanded);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleSubmission = (subId: string) => {
    const newSet = new Set(selectedSubmissions);
    if (newSet.has(subId)) {
      newSet.delete(subId);
    } else {
      newSet.add(subId);
    }
    setSelectedSubmissions(newSet);
  };

  const toggleAllUserSubmissions = (user: ExportUser) => {
    const userSubIds = user.submissions.map(s => s.id);
    const allSelected = userSubIds.every(id => selectedSubmissions.has(id));
    
    const newSet = new Set(selectedSubmissions);
    if (allSelected) {
      userSubIds.forEach(id => newSet.delete(id));
    } else {
      userSubIds.forEach(id => newSet.add(id));
    }
    setSelectedSubmissions(newSet);
  };

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExport = () => {
    const headers = ['Ticket Number', 'Status', 'Category', 'Score', 'Title', 'Description', 'Created By', 'Version', 'Is Draft', 'Created At'];
    let csv = headers.map(escapeCsv).join(',') + '\n';

    data.forEach(user => {
      user.submissions.forEach(sub => {
        if (!selectedSubmissions.has(sub.id)) return;
        
        const currentVersion = sub.versions[0];
        const row = [
          sub.ticketNumber,
          sub.status,
          sub.category || 'N/A',
          sub.score !== null ? sub.score : 'Unscored',
          currentVersion?.title || 'Unknown',
          currentVersion?.description || 'N/A',
          user.name || user.email || 'Unknown',
          currentVersion ? `v${currentVersion.versionNumber}` : 'v1',
          currentVersion?.isDraft ? 'Yes' : 'No',
          currentVersion?.createdAt ? new Date(currentVersion.createdAt).toISOString() : ''
        ];
        csv += row.map(escapeCsv).join(',') + '\n';
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `impactx-export-${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/manager" className="text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Export Data</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field max-w-[200px]"
          />
        </div>
        <button 
          onClick={handleExport}
          disabled={selectedSubmissions.size === 0 || loading}
          className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Export ({selectedSubmissions.size} selected)
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
            No submissions found for this month.
          </div>
        ) : (
          data.map(user => {
            const userSubIds = user.submissions.map(s => s.id);
            const selectedCount = userSubIds.filter(id => selectedSubmissions.has(id)).length;
            const isExpanded = expandedUsers[user.id];

            return (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleUserExpanded(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedCount === userSubIds.length && userSubIds.length > 0}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedCount > 0 && selectedCount < userSubIds.length;
                        }
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleAllUserSubmissions(user);
                      }}
                      className="w-4 h-4 text-[#5B45FF] rounded border-gray-300"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{selectedCount} / {userSubIds.length} selected</span>
                    <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {user.submissions.map(sub => {
                      const currentVersion = sub.versions[0];
                      return (
                        <div key={sub.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedSubmissions.has(sub.id)}
                            onChange={() => toggleSubmission(sub.id)}
                            className="mt-1 w-4 h-4 text-[#5B45FF] rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{sub.ticketNumber}</span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{sub.status}</span>
                              {currentVersion && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v{currentVersion.versionNumber}</span>}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                              {currentVersion?.title || 'No Title'}
                            </h4>
                            <div className="text-xs text-gray-500 flex items-center gap-4">
                              <span>Updated: {currentVersion?.createdAt ? new Date(currentVersion.createdAt).toLocaleDateString() : 'N/A'}</span>
                              <span>Score: {sub.score !== null ? sub.score : '-'}</span>
                              <span>Category: {sub.category || '-'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
