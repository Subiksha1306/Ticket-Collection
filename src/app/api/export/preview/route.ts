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
    const monthParam = searchParams.get('month');

    if (!monthParam) {
      return new NextResponse('Month required', { status: 400 });
    }

    const [yearStr, monthStr] = monthParam.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const submissions = await prisma.submission.findMany({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        author: true,
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by author
    const authorsMap = new Map();

    submissions.forEach(sub => {
      const authorId = sub.createdBy;
      if (!authorsMap.has(authorId)) {
        authorsMap.set(authorId, {
          id: authorId,
          name: sub.author.name || 'Unknown',
          email: sub.author.email || 'Unknown',
          submissions: []
        });
      }
      
      authorsMap.get(authorId).submissions.push({
        id: sub.id,
        ticketNumber: sub.ticketNumber,
        status: sub.status,
        score: sub.score,
        category: sub.category,
        versions: sub.versions.map(v => ({
          id: v.id,
          versionNumber: v.versionNumber,
          title: v.title,
          description: v.description,
          createdAt: v.createdAt,
          isDraft: v.isDraft
        }))
      });
    });

    const data = Array.from(authorsMap.values());
    return NextResponse.json(data);

  } catch (error) {
    console.error('Preview error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
