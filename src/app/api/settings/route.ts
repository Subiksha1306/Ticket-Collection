import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' }
    });

    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Error fetching settings:', error);
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
    const { azurePatToken, azureBoardUrl } = body;

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: {
        azurePatToken,
        azureBoardUrl
      },
      create: {
        id: 'global',
        azurePatToken,
        azureBoardUrl
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
