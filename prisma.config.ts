import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    // Use pooled connection for app queries
    url: process.env["DATABASE_URL"],
    // Use direct connection for migrations (bypasses pgbouncer)
    // @ts-expect-error - directUrl is valid but missing from Prisma type definitions
    directUrl: process.env["DIRECT_URL"],
  },
});
