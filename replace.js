const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/manager/page.tsx', 'utf-8');
const oldBtn = `<a href={\`/api/export?month=\${monthParam || \`\${new Date().getFullYear()}-\${String(new Date().getMonth() + 1).padStart(2, '0')}\`}\`} className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </a>`;
const newBtn = `<a href={\`/api/export?month=\${monthParam || \`\${new Date().getFullYear()}-\${String(new Date().getMonth() + 1).padStart(2, '0')}\`}\`} className="px-4 py-2 bg-[#5B45FF] hover:bg-[#4a36d9] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </a>

          <Link href="/manager/export" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export All Data
          </Link>`;
content = content.replace(oldBtn, newBtn);
fs.writeFileSync('src/app/(dashboard)/manager/page.tsx', content);
console.log('Done!');
