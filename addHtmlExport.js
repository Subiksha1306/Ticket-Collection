const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', 'utf-8');

const htmlExportLogic = `
  const handleExportHtml = () => {
    // We will build a standalone HTML file containing the selected data
    const exportData = data.map(user => {
      const selectedSubs = user.submissions.filter(sub => selectedSubmissions.has(sub.id));
      if (selectedSubs.length === 0) return null;
      return {
        ...user,
        submissions: selectedSubs
      };
    }).filter(Boolean);

    const htmlContent = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImpactX Export - \${month}</title>
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
                <p class="text-gray-500 mt-1">Data for: <span class="font-semibold text-gray-700">\${month}</span></p>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-500">Generated on \${new Date().toLocaleDateString()}</p>
                <button onclick="window.print()" class="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Print / Save PDF</button>
            </div>
        </div>

        <div class="space-y-4">
            \${exportData.map(user => \`
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="bg-gray-50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors" onclick="this.nextElementSibling.classList.toggle('active')">
                        <div>
                            <h3 class="font-semibold text-lg text-gray-900">\${user.name}</h3>
                            <p class="text-sm text-gray-500">\${user.email}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">\${user.submissions.length} Tickets</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <div class="collapse-content divide-y divide-gray-100">
                        \${user.submissions.map(sub => {
                            const currentVersion = sub.versions[0];
                            return \`<div class="p-6 hover:bg-gray-50 transition-colors">
                                <div class="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <div class="flex items-center gap-3 mb-1">
                                            <span class="font-bold text-gray-900">\${sub.ticketNumber}</span>
                                            <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">\${sub.status}</span>
                                            \${currentVersion ? \`<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v\${currentVersion.versionNumber}</span>\` : ''}
                                        </div>
                                        <h4 class="text-base font-medium text-gray-800">\${currentVersion?.title || 'No Title'}</h4>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm font-medium text-gray-900">Score: \${sub.score !== null ? sub.score : '-'}</div>
                                        <div class="text-xs text-gray-500 mt-1">\${sub.category || 'Uncategorized'}</div>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600 mt-3 whitespace-pre-wrap">\${currentVersion?.description || 'No description provided.'}</p>
                                <div class="mt-4 text-xs text-gray-400 flex items-center gap-4">
                                    <span>Last Updated: \${sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                    <span>Is Draft: \${currentVersion?.isDraft ? 'Yes' : 'No'}</span>
                                </div>
                            </div>\`;
                        }).join('')}
                    </div>
                </div>
            \`).join('')}
        </div>
    </div>
</body>
</html>\`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`impactx-interactive-export-\${month}.html\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

const exportButtonHtml = `        <div class="flex items-center gap-2">
          <button 
            onClick={handleExportHtml}
            disabled={selectedSubmissions.size === 0 || loading}
            className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export HTML Document
          </button>
          
          <button 
            onClick={handleExport}
            disabled={selectedSubmissions.size === 0 || loading}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>`;

content = content.replace('const handleExport = () => {', htmlExportLogic + '\n  const handleExport = () => {');
content = content.replace(/<button[^>]*onClick=\{handleExport\}[^>]*>[\s\S]*?<\/button>/, exportButtonHtml);

fs.writeFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', content);
console.log('Successfully added HTML export logic!');
