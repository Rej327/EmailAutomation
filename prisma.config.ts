import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load from .env.local (Next.js convention) for Prisma CLI commands
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
