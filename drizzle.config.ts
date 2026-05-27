import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit'

// 讓 drizzle-kit 也能讀到 .env.local
loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
