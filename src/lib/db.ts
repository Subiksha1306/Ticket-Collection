import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/postgres?schema=public';
const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? defaultDatabaseUrl;

declare const globalThis: {
  prismaGlobal?: PrismaClient;
  pgPoolGlobal?: Pool;
} & typeof global;

const pool = globalThis.pgPoolGlobal ?? new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.pgPoolGlobal = pool;
}

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
