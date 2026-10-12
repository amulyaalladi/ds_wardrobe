# DS Wardrobe

Mobile-first fashion storefront (Next.js + Tailwind) on a headless **Medusa v2** commerce backend (PostgreSQL + Redis).

```
backend/      Medusa customisations (review module, order-tracking route, seed script)
storefront/   Next.js 15 + TypeScript + Tailwind storefront
docs/         design analysis, backend evaluation, architecture decisions, setup
scripts/      setup-backend.sh
docker-compose.yml   Postgres + Redis for local development
```

## Quick start
1. `cp .env.example .env` and set a Postgres password. `docker compose up -d`
2. `./scripts/setup-backend.sh` (generates the Medusa app and copies in `backend/src`)
3. Follow **docs/SETUP.md** to configure `.env`, migrate, create an admin user, seed data and get the publishable key.
4. `cd storefront && cp .env.example .env.local`, paste the key, `npm install && npm run dev`.

## Status (read this)
This code was written without being able to install dependencies or run it. Treat the first run as integration work:
expect to fix small type or API-name differences against the Medusa version you install. Verify Medusa's current docs and licence
(brief requirement). Not implemented: a real payment provider (Razorpay), banners/CMS content, analytics beyond Medusa Admin.
See docs/ARCHITECTURE.md.

## Environment variables
| File | Variable | Purpose |
|---|---|---|
| root `.env` | `POSTGRES_*` | docker-compose DB credentials |
| `backend/.env` | `DATABASE_URL`, `REDIS_URL` | data stores |
| | `JWT_SECRET`, `COOKIE_SECRET` | auth secrets (long random strings) |
| | `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` | allowed origins |
| | `RAZORPAY_KEY_ID/SECRET` | payment provider (server only) |
| `storefront/.env.local` | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa URL |
| | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Store API key |
| | `NEXT_PUBLIC_SITE_URL` | canonical URL |

Never commit `.env*` files except the `.example`/`.template` ones.
