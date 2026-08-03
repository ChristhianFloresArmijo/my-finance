# Setup — Backend

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- pnpm 8+

---

## Environment

```bash
cp .env.example .env
```

Required values to change:

| Variable | How to generate |
|---|---|
| `JWT_SECRET_KEY` | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET_KEY` | `openssl rand -base64 32` |
| `ROOT_ADMIN_PASSWORD` | Choose a strong password |
| `DATABASE_URL` | Update host/user/pass to match `docker-compose.yml` |

Key optional values:

```env
ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC=900       # 15 min (default)
REFRESH_TOKEN_VALIDITY_DURATION_IN_SEC=604800   # 7 days (default)
ROOT_ADMIN_EMAIL=admin@example.com
DEFAULT_SIGNUP_ROLE=client
APP_URL=http://localhost:5173                   # used in email links
```

---

## Start with Docker (recommended)

```bash
docker compose up -d          # starts: app (3000), postgres (5432), adminer (8080), mailhog (1025/8025)
docker compose logs -f app    # tail logs
```

Or run only infrastructure and NestJS locally:

```bash
docker compose up db mailhog -d
pnpm dev
```

---

## Initialise the Database

Run once after first boot (or after `pnpm prisma:reset`):

```bash
pnpm prisma:migrate    # create + apply all migrations
pnpm prisma:generate   # generate Prisma TypeScript client
pnpm prisma:seed       # create superadmin user + default roles/permissions
```

---

## Services

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| API reference (Scalar UI) | http://localhost:3000/reference |
| Adminer (DB UI) | http://localhost:8080 |
| MailHog | http://localhost:8025 |

---

## Dev Commands

```bash
pnpm dev              # NestJS with --watch (hot reload)
pnpm build            # nest build → dist/
pnpm start:prod       # node dist/main
pnpm lint             # ESLint --fix

pnpm test             # Jest (all *.spec.ts)
pnpm test:watch       # Jest watch mode
pnpm test:e2e         # e2e suite (requires live DB — see docs/07-testing.md)

pnpm prisma:migrate   # create migration + apply
pnpm prisma:generate  # regenerate TypeScript client after schema changes
pnpm prisma:reset     # drop DB + replay all migrations + seed
pnpm prisma:studio    # open Prisma Studio GUI (localhost:5555)
pnpm prisma:seed      # run seed only
```

---

## Path Aliases

```
@account/*        → src/modules/account/*
@auth/*           → src/modules/authentication/*
@authorization/*  → src/modules/authorization/*
@shared/*         → src/modules/shared/*
@database/*       → src/database/*
@config/*         → src/config/*
```

---

## Troubleshooting

**Prisma client missing after schema change:**
```bash
pnpm prisma:generate
```

**Port conflict:**
Change the host port in `docker-compose.yml` (e.g. `"3001:3000"`).

**MailHog not receiving email:**
Confirm `MAIL_HOST=mailhog` and `MAIL_PORT=1025` in `.env`.
