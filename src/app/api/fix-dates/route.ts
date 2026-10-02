import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Get all table names to see exactly how they are stored in the database
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    
    const tableNames = tables.map(t => t.table_name);
    
    // Find the submission table regardless of case
    const submissionTable = tableNames.find(t => t.toLowerCase() === 'submission');
    
    if (!submissionTable) {
      return NextResponse.json({ success: false, tables: tableNames, error: 'Could not find any table named submission' });
    }

    // 2. Execute raw SQL using the EXACT table name we found
    await prisma.$executeRawUnsafe(`
      UPDATE "${submissionTable}"
      SET updated_at = created_at
    `);
    
    return NextResponse.json({ 
      success: true, 
      tableUsed: submissionTable,
      message: 'Successfully restored updatedAt to match createdAt for all submissions.' 
    });
  } catch (error: any) {
    console.error('Error fixing dates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
