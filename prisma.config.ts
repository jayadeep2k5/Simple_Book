import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  engine: "js",
  async adapter() {
    return new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  },
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
});
