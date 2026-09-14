import 'server-only';
import { PrismaClient } from '@prisma/client';

/**
 * Server-only authoritative database client for Neon PostgreSQL.
 *
 * Enforces:
 * 1. 'server-only' package import to fail builds if ever imported in client components.
 * 2. Next.js development singleton to prevent connection pool exhaustion during HMR.
 * 3. Sanitized logging (warn & error only, no secret/credential leakage).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
