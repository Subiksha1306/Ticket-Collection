import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { month, year, winnerName, runnerUpName } = body;

    if (month === undefined || year === undefined || !winnerName || !runnerUpName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const entry = await prisma.hallOfFame.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      update: {
        winnerName,
        runnerUpName
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        winnerName,
        runnerUpName
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error saving Hall of Fame:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
