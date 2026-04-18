import { PrismaClient } from "@prisma/client";

export { Prisma, PrismaClient } from "@prisma/client";

type RuntimeProcess = {
  env?: Record<string, string | undefined>;
};

type GlobalForPrisma = typeof globalThis & {
  process?: RuntimeProcess;
  __autosolPrisma?: PrismaClient;
};

export function createPrismaClient() {
  return new PrismaClient();
}

export function getPrismaClient() {
  const globalForPrisma = globalThis as GlobalForPrisma;

  if (globalForPrisma.process?.env?.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!globalForPrisma.__autosolPrisma) {
    globalForPrisma.__autosolPrisma = createPrismaClient();
  }

  return globalForPrisma.__autosolPrisma;
}

export const prisma = getPrismaClient();
