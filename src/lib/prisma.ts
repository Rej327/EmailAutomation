import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const isPlaceholderDb =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("placeholder") ||
  process.env.DATABASE_URL.includes("your-db-password");

export const isPrismaConfigured = !isPlaceholderDb;

// Initialize Prisma client or provide safe fallback
let prismaClient: PrismaClient;

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    prismaClient = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
      });
    }
    prismaClient = global.prisma;
  }
} else {
  // Client side dummy
  prismaClient = {} as PrismaClient;
}

export const prisma = prismaClient;
export default prisma;
