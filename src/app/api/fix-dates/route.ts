import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Try uppercase first, if it fails try lowercase
    try {
      await prisma.$executeRawUnsafe(`UPDATE submission SET updated_at = created_at`);
    } catch (e: any) {
      console.log('Lowercase failed, trying quoted public schema...');
      await prisma.$executeRawUnsafe(`UPDATE public."Submission" SET updated_at = created_at`);
    }
    
    return NextResponse.json({ success: true, message: 'Successfully restored updatedAt to match createdAt for all submissions.' });
  } catch (error: any) {
    console.error('Error fixing dates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
