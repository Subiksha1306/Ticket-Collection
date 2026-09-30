import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tickets = await prisma.submission.findMany({
    where: { ticketNumber: { in: ['4219', '123456'] } },
    include: { versions: true }
  });
  return NextResponse.json(tickets);
}
