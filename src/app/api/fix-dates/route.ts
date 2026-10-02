import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Execute raw SQL to bypass @updatedAt automatic timestamping
    await prisma.$executeRawUnsafe(`
      UPDATE "Submission"
      SET "updated_at" = "created_at"
    `);
    
    return NextResponse.json({ success: true, message: 'Successfully restored updatedAt to match createdAt for all submissions.' });
  } catch (error: any) {
    console.error('Error fixing dates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
