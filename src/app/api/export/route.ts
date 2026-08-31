import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM

    if (!monthParam) {
      return new NextResponse('Month parameter is required (YYYY-MM)', { status: 400 });
    }

    const [yearStr, monthStr] = monthParam.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed for Date

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const submissions = await prisma.submission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        author: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvData = submissions.map(sub => {
      const currentVersion = sub.versions[0];
      return {
        'Ticket Number': sub.ticketNumber,
        'Title': currentVersion?.title || 'Unknown',
        'Description': currentVersion?.description || 'N/A',
        'Created By': sub.author?.name || sub.author?.email || 'Unknown',
        'Version': currentVersion ? `v${currentVersion.versionNumber}` : 'v1',
        'Is Draft': currentVersion?.isDraft ? 'Yes' : 'No',
        'Created At': sub.createdAt.toISOString(),
        'Last Updated': sub.updatedAt.toISOString(),
      };
    });

    if (csvData.length === 0) {
      // Return empty CSV with just headers
      const emptyCsv = stringify([], {
        header: true,
        columns: ['Ticket Number', 'Title', 'Description', 'Created By', 'Version', 'Is Draft', 'Created At', 'Last Updated']
      });
      return new NextResponse(emptyCsv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="impactx-export-${monthParam}.csv"`,
        }
      });
    }

    const csvString = stringify(csvData, { header: true });

    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="impactx-export-${monthParam}.csv"`,
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
