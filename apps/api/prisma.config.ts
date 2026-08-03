import { defineConfig, env } from 'prisma/config';

// `env()` reads .env files; `process.env` catches Docker/CI injected variables.
// `prisma generate` works without any URL; `prisma migrate` requires one.
let datasourceUrl: string | undefined
try {
  datasourceUrl = env('DATABASE_URL')       // reads .env file
} catch {
  datasourceUrl = process.env.DATABASE_URL  // falls back to shell/Docker env
}

export default defineConfig({
  ...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
});
