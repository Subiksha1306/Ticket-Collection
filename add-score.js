const fs = require('fs');

const targetStr = `<div class="text-right">
                                        <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">\${currentVersion ? 'v' + currentVersion.versionNumber : 'v1'}</span>
                                    </div>`;

const replaceStr = `<div class="text-right flex flex-col items-end gap-2">
                                        <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">\${currentVersion ? 'v' + currentVersion.versionNumber : 'v1'}</span>
                                        \${sub.score !== null ? \`<span class="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Score: \${sub.score}</span>\` : ''}
                                    </div>`;

let routePath = 'src/app/api/export/route.ts';
let route = fs.readFileSync(routePath, 'utf8');
route = route.replace(targetStr, replaceStr);
fs.writeFileSync(routePath, route);

let clientPath = 'src/app/(dashboard)/manager/export/ExportViewClient.tsx';
let client = fs.readFileSync(clientPath, 'utf8');
client = client.replace(targetStr, replaceStr);
fs.writeFileSync(clientPath, client);

console.log('Successfully added score to exports');
