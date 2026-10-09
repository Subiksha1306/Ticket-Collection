const fs = require('fs');

let clientPath = 'src/app/(dashboard)/manager/export/ExportViewClient.tsx';
let client = fs.readFileSync(clientPath, 'utf8');

client = client.replace(
  `\${currentVersion ? \`<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v\${currentVersion.versionNumber}</span>\` : ''}`,
  `\${currentVersion ? \`<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v\${currentVersion.versionNumber}</span>\` : ''}\n                                              \${sub.score !== null ? \`<span class="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Score: \${sub.score}</span>\` : ''}`
);

client = client.replace(
  `{currentVersion && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v{currentVersion.versionNumber}</span>}`,
  `{currentVersion && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">v{currentVersion.versionNumber}</span>}\n                              {sub.score !== null && <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Score: {sub.score}</span>}`
);

fs.writeFileSync(clientPath, client);
console.log('Successfully updated ExportViewClient');
