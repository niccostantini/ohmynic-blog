import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ override: false });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
