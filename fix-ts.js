const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', 'utf-8');

// Fix class -> className
content = content.replace('<div class="flex items-center gap-2">', '<div className="flex items-center gap-2">');

// Fix type inference for exportData
content = content.replace('}).filter(Boolean);', '}).filter((user): user is NonNullable<typeof user> => Boolean(user));');

fs.writeFileSync('src/app/(dashboard)/manager/export/ExportViewClient.tsx', content);
console.log('Fixed TS errors');
