import path from "node:path";
import { defineConfig } from "prisma/config";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: `file:${dbPath}`,
  },
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  migrate: {
    async adapter() {
      const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
      return new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    },
  },
});
