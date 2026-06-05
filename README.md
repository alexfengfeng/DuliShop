# Solace Shopify Fullstack MVP

Next.js + TypeScript + Prisma + Supabase Postgres implementation of the Solace Supply Shopify-style MVP.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma 7 with `@prisma/adapter-pg`
- Supabase Postgres and Supabase SSR client

## Setup

1. Reset the Supabase database password because the previous value was exposed in chat.
2. Copy `.env.example` to `.env.local`.
3. Fill in:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

Use `DATABASE_URL` for runtime traffic and `DIRECT_URL` for Prisma migrations.

## Commands

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/dashboard`
- Login: `http://localhost:3000/login`

The current admin session is a local demo cookie. Supabase Auth helper wiring is present for production login integration after the Supabase keys are added.

## Implemented Flow

- Storefront home reads saved theme sections from Postgres.
- Collection and product pages read real products and variants.
- Add to cart writes `Cart` and `CartItem` rows.
- Checkout creates `Customer`, `Order`, and `OrderItem` rows.
- Checkout decrements variant inventory and redirects to success.
- Success links back to `/admin/orders?query=<orderNumber>`.
- Admin products, orders, customers, theme, and apps are backed by Prisma.

## Contact

For inquiries about this project, please contact me at [smartforus@foxmail.com](mailto:smartforus@foxmail.com).
