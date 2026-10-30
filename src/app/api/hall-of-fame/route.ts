import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [entries, users] = await Promise.all([
      prisma.hallOfFame.findMany({
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ entries, users });
  } catch (error) {
    console.error('Error fetching Hall of Fame data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { month, year, winnerName, runnerUpName, winnerImage, runnerUpImage } = body;

    if (month === undefined || year === undefined || !winnerName || !runnerUpName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Auto-match user profile picture if none provided
    let finalWinnerImage = winnerImage || null;
    let finalRunnerUpImage = runnerUpImage || null;

    if (!finalWinnerImage || !finalRunnerUpImage) {
      const allUsers = await prisma.user.findMany({
        where: { image: { not: null } },
        select: { name: true, image: true },
      });

      if (!finalWinnerImage && winnerName) {
        const norm = winnerName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = allUsers.find((u) => {
          if (!u.name) return false;
          const uNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return uNorm === norm || uNorm.includes(norm) || norm.includes(uNorm);
        });
        finalWinnerImage = match?.image || null;
      }

      if (!finalRunnerUpImage && runnerUpName) {
        const norm = runnerUpName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = allUsers.find((u) => {
          if (!u.name) return false;
          const uNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return uNorm === norm || uNorm.includes(norm) || norm.includes(uNorm);
        });
        finalRunnerUpImage = match?.image || null;
      }
    }

    const entry = await prisma.hallOfFame.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        winnerName,
        runnerUpName,
        winnerImage: finalWinnerImage,
        runnerUpImage: finalRunnerUpImage,
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        winnerName,
        runnerUpName,
        winnerImage: finalWinnerImage,
        runnerUpImage: finalRunnerUpImage,
      },
    });

    // Also persist images into the users table so their photos auto-populate across the platform
    try {
      if (finalWinnerImage && winnerName) {
        const winnerUser = await prisma.user.findFirst({
          where: { name: { contains: winnerName.trim(), mode: 'insensitive' } },
        });
        if (winnerUser) {
          await prisma.user.update({
            where: { id: winnerUser.id },
            data: { image: finalWinnerImage },
          });
        }
      }

      if (finalRunnerUpImage && runnerUpName) {
        const runnerUpUser = await prisma.user.findFirst({
          where: { name: { contains: runnerUpName.trim(), mode: 'insensitive' } },
        });
        if (runnerUpUser) {
          await prisma.user.update({
            where: { id: runnerUpUser.id },
            data: { image: finalRunnerUpImage },
          });
        }
      }
    } catch (persistErr) {
      console.warn('Failed to persist photo to user record:', persistErr);
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error saving Hall of Fame:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const all = searchParams.get('all') === 'true';

    if (id) {
      await prisma.hallOfFame.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Record deleted' });
    }

    if (month && year) {
      await prisma.hallOfFame.deleteMany({
        where: {
          month: parseInt(month, 10),
          year: parseInt(year, 10),
        },
      });
      return NextResponse.json({ success: true, message: 'Month record deleted' });
    }

    if (all || (!id && !month && !year)) {
      await prisma.hallOfFame.deleteMany();
      return NextResponse.json({ success: true, message: 'All history erased' });
    }

    return new NextResponse('Invalid delete parameters', { status: 400 });
  } catch (error) {
    console.error('Error deleting Hall of Fame:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
