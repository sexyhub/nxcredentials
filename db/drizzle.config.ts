import { defineConfig } from "drizzle-kit";

if (!process.env.NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL must be set");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
});
