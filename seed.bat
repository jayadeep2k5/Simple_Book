@echo off
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
