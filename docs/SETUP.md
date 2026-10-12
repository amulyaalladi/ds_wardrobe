# Setup

Prerequisites: Node 20+, Docker, Git.

## Backend
```bash
docker compose up -d
./scripts/setup-backend.sh        # creates ./backend with our src/ customisations
cd backend
cp .env.template .env             # set secrets, DB/Redis URLs
npx medusa db:generate review     # migration for the custom review module
npx medusa db:migrate
npx medusa user -e admin@dswardrobe.local -p '<strong-password>'
npx medusa exec ./src/scripts/seed-ds-wardrobe.ts
npm run dev                       # Admin: http://localhost:9000/app
```
If `setup-backend.sh` fails (CLI flags change between releases), run `npx create-medusa-app@latest backend --skip-db`,
copy `backend/src/*` from this repo over it, and add `modules: [{ resolve: "./src/modules/review" }]` to `medusa-config.ts`.

## In Admin
1. Settings > Publishable API Keys: create/open a key, attach your sales channel, copy the key.
2. Settings > Regions: confirm India (INR) with a payment provider.
3. Settings > Locations & Shipping: add a stock location, a shipping profile and shipping options for India
   (e.g. Standard, Express, Free over ₹1,999). Checkout shows "We don't deliver" until this exists.
4. Promotions: create `WELCOME10` (percentage).
5. Reviews are saved as `pending`; approve by setting `status` to `approved` in the DB (an admin UI widget is a follow-up).

## Storefront
```bash
cd storefront
cp .env.example .env.local        # paste the publishable key
npm install && npm run dev        # http://localhost:3000
```

## Test the journey
Home > Shop > filter/search > product > pick size/color > add to cart > checkout (guest) > confirmation >
check the order in Admin > Track order page (order number + email). Also test: out-of-stock variant, sign-up, wishlist, API down (stop backend).
