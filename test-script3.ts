import { prisma } from './src/lib/db';

async function check() {
  const startOfMonth = new Date(2026, 8, 1); // Sept 1 2026
  const endOfMonth = new Date(2026, 8, 30, 23, 59, 59, 999);
  
  const categoryData = await prisma.submission.groupBy({
    by: ['category'],
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      category: { not: null }
    },
    _count: {
      id: true
    }
  });
  console.log(categoryData);
}
check().finally(() => process.exit(0));
