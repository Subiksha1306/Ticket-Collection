import { PrismaClient } from '@prisma/client';
const prismaDirect = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});
async function run() {
  try {
    const startDate = new Date(2026, 8, 1);
    const endDate = new Date(2026, 9, 0, 23, 59, 59, 999);
    const submissions = await prismaDirect.submission.findMany({
      where: { 
        updatedAt: { gte: startDate, lte: endDate },
        author: {
          email: { contains: 'subiksha', mode: 'insensitive' }
        }
      },
      include: { 
        author: true, 
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 } 
      }
    });
    console.log(`Found ${submissions.length} submissions`);
    submissions.forEach(sub => {
      console.log(`- ${sub.versions[0]?.title || 'No Title'}`);
    });
  } catch (e) {
    console.error(e);
  }
}
run().finally(()=>process.exit(0));
