import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    const allParam = searchParams.get('all'); // true

    let whereClause = {};
    let filename = 'impactx-export-all.html';
    let displayMonth = 'All Time';

    if (!allParam) {
      if (!monthParam) {
        return new NextResponse('Month parameter is required (YYYY-MM)', { status: 400 });
      }
      const [yearStr, monthStr] = monthParam.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-indexed for Date

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      whereClause = {
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      };
      filename = `impactx-export-${monthParam}.html`;
      displayMonth = monthParam;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        author: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by author
    const authorsMap = new Map();
    for (const sub of submissions) {
      const authorId = sub.createdBy;
      if (!authorsMap.has(authorId)) {
        authorsMap.set(authorId, {
          name: sub.author?.name || sub.author?.email || 'Unknown',
          email: sub.author?.email || '',
          submissions: []
        });
      }
      authorsMap.get(authorId).submissions.push(sub);
    }

    const exportData = Array.from(authorsMap.values());

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
                <button onclick="window.print()" class="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Print / Save PDF</button>
            </div>
        </div>

        <div class="space-y-4">
            ${exportData.map((user: any) => `
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
                        ${user.submissions.map((sub: any) => {
                            const currentVersion = sub.versions[0];
                            return `<div class="p-6 hover:bg-gray-50 transition-colors">
                                <div class="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <div class="flex items-center gap-3 mb-1">
                                            <span class="font-bold text-gray-900">${sub.ticketNumber}</span>
                                            <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">${sub.category || 'Uncategorized'}</span>
                                        </div>
                                        <h4 class="text-base font-medium text-gray-800">${currentVersion?.title || 'No Title'}</h4>
                                    </div>
                                    <div class="text-right">
                                        <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">${currentVersion ? 'v' + currentVersion.versionNumber : 'v1'}</span>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600 mt-3 whitespace-pre-wrap">${currentVersion?.description || 'No description provided.'}</p>
                                <div class="mt-4 text-xs text-gray-400 flex items-center gap-4">
                                    <span>Created At: ${new Date(sub.createdAt).toLocaleDateString()}</span>
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

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
