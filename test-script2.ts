import { prisma } from './src/lib/db';

async function check() {
  const subs = await prisma.submission.findMany({ 
    where: { 
      createdAt: { gte: new Date('2026-09-01') } 
    },
    select: { id: true, category: true, status: true, createdAt: true, score: true } 
  });
  console.log(subs.length);
  console.log(subs);
}
check().finally(() => process.exit(0));
