import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      select: { id: true, createdAt: true }
    });

    let updatedCount = 0;
    for (const sub of submissions) {
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          updatedAt: sub.createdAt // Manually overriding Prisma's @updatedAt
        }
      });
      updatedCount++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully restored updatedAt to match createdAt for ${updatedCount} submissions using safe Prisma methods.` 
    });
  } catch (error: any) {
    console.error('Error fixing dates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
