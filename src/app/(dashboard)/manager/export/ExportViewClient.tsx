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
  
  category: string | null;
  updatedAt: string;
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

  

  
  const handleExportHtml = () => {
    // We will build a standalone HTML file containing the selected data
    const exportData = data.map(user => {
      const selectedSubs = user.submissions.filter(sub => selectedSubmissions.has(sub.id));
      if (selectedSubs.length === 0) return null;
      return {
        ...user,
        submissions: selectedSubs
      };
    }).filter((user): user is NonNullable<typeof user> => Boolean(user));

        let displayMonth = month;
    if (month && month.includes('-')) {
      const [yearStr, monthStr] = month.split('-');
      const d = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      displayMonth = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImpactX Export - ${displayMonth}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #f9fafb; font-family: system-ui, -apple-system, sans-serif; }
        .collapse-content { display: none; }
        .collapse-content.active { display: block; }
    </style>
</head>
<body class="p-8">
    <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">ImpactX Export Report</h1>
                <p class="text-gray-500 mt-1">Data for: <span class="font-semibold text-gray-700">${displayMonth}</span></p>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-500">Generated on ${new Date().toLocaleDateString()}</p>
                
            </div>
        </div>

        <div class="space-y-4">
            ${exportData.map(user => `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="bg-gray-50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors" onclick="this.nextElementSibling.classList.toggle('active')">
                        <div>
                            <h3 class="font-semibold text-lg text-gray-900">${user.name}</h3>
                            <p class="text-sm text-gray-500">${user.email}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">${user.submissions.length} Tickets</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <div class="collapse-content divide-y divide-gray-100">
                        ${user.submissions.map(sub => {
                            const currentVersion = sub.versions[0];
                            return `<div class="p-6 hover:bg-gray-50 transition-colors">
                                <div class="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <div class="flex items-center gap-3 mb-1">
                                            <span class="font-bold text-gray-900">${sub.ticketNumber}</span>
                                            <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">${sub.status}</span>
                                            ${currentVersion ? `<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v${currentVersion.versionNumber}</span>` : ''}
                                        </div>
                                        <h4 class="text-base font-medium text-gray-800">${currentVersion?.title || 'No Title'}</h4>
                                    </div>
                                    <div class="text-right">
                                        
                                        <div class="text-xs text-gray-500 mt-1">${sub.category || 'Uncategorized'}</div>
                                    </div>
                                </div>
                                
                                <div class="mt-4 text-xs text-gray-400 flex items-center gap-4">
                                    <span>Last Updated: ${sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                    <span>Is Draft: ${currentVersion?.isDraft ? 'Yes' : 'No'}</span>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `impactx-interactive-export-${month}.html`);
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
                <div className="flex items-center gap-2">
          <button 
            onClick={handleExportHtml}
            disabled={selectedSubmissions.size === 0 || loading}
            className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export HTML Document
          </button>
          
          
        </div>
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
                              <span>Updated: {sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : 'N/A'}</span>
                              
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
