import { prisma } from './src/lib/db';

async function check() {
  const subs = await prisma.submission.findMany({ select: { id: true, category: true, status: true, createdAt: true } });
  console.log(subs.length);
  console.log(subs.slice(0, 5));
}
check().finally(() => process.exit(0));
