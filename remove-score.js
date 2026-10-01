const fs = require('fs');

// 1. Update src/app/(dashboard)/manager/page.tsx
let managerPage = fs.readFileSync('src/app/(dashboard)/manager/page.tsx', 'utf-8');
managerPage = managerPage.replace('<th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score</th>', '');
managerPage = managerPage.replace('<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.score ? `${submission.score}/100` : \'Unscored\'}</td>', '');
fs.writeFileSync('src/app/(dashboard)/manager/page.tsx', managerPage);

// 2. Update src/app/api/export/route.ts
let exportRoute = fs.readFileSync('src/app/api/export/route.ts', 'utf-8');
exportRoute = exportRoute.replace('\'Score\': sub.score !== null ? sub.score : \'Unscored\',', '');
exportRoute = exportRoute.replace('columns: [\'Ticket Number\', \'Status\', \'Category\', \'Score\', \'Title\', \'Description\', \'Created By\', \'Version\', \'Is Draft\', \'Created At\', \'Last Updated\']', 'columns: [\'Ticket Number\', \'Status\', \'Category\', \'Title\', \'Description\', \'Created By\', \'Version\', \'Is Draft\', \'Created At\', \'Last Updated\']');
fs.writeFileSync('src/app/api/export/route.ts', exportRoute);

// 3. Update src/app/api/export/preview/route.ts
let previewRoute = fs.readFileSync('src/app/api/export/preview/route.ts', 'utf-8');
previewRoute = previewRoute.replace('score: sub.score,', '');
fs.writeFileSync('src/app/api/export/preview/route.ts', previewRoute);

// 4. Update src/app/(dashboard)/manager/export/ExportViewClient.tsx
let exportView = fs.readFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', 'utf-8');
exportView = exportView.replace('score: number | null;', '');
exportView = exportView.replace('<div class="text-sm font-medium text-gray-900">Score: ${sub.score !== null ? sub.score : \'-\'}</div>', '');
exportView = exportView.replace('const headers = [\'Ticket Number\', \'Status\', \'Category\', \'Score\', \'Title\', \'Description\', \'Created By\', \'Version\', \'Is Draft\', \'Created At\'];', 'const headers = [\'Ticket Number\', \'Status\', \'Category\', \'Title\', \'Description\', \'Created By\', \'Version\', \'Is Draft\', \'Created At\'];');
exportView = exportView.replace('sub.score !== null ? sub.score : \'Unscored\',', '');
exportView = exportView.replace('<span>Score: {sub.score !== null ? sub.score : \'-\'}</span>', '');
fs.writeFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', exportView);

console.log('Successfully removed Score column from UI and Exports');
