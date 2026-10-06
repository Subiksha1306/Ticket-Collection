import { PrismaClient } from '@prisma/client';
const prismaDirect = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL
});
async function run() {
  try {
    const augStart = new Date(2026, 7, 1);
    const augEnd = new Date(2026, 8, 0, 23, 59, 59, 999);
    
    // Check createdAt vs updatedAt
    const createdInAug = await prismaDirect.submission.count({
      where: { createdAt: { gte: augStart, lte: augEnd } }
    });
    
    const updatedInAug = await prismaDirect.submission.count({
      where: { updatedAt: { gte: augStart, lte: augEnd } }
    });
    
    console.log('Created in August:', createdInAug);
    console.log('Updated in August:', updatedInAug);
  } catch (e) {
    console.error(e);
  }
}
run().finally(()=>process.exit(0));
