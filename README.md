# Solace Shopify Fullstack MVP

Next.js + TypeScript + Prisma + Supabase Postgres implementation of the Solace Supply Shopify-style MVP.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma 7 with `@prisma/adapter-pg`
- Supabase Postgres and Supabase SSR client
- Supabase Auth for the protected admin
- Stripe test checkout and webhook fulfillment

## Setup

1. Reset the Supabase database password because the previous value was exposed in chat.
2. Copy `.env.example` to `.env.local`.
3. Fill in:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Use `DATABASE_URL` for runtime traffic and `DIRECT_URL` for Prisma migrations.

Create a Supabase Auth user with the same email as the seeded admin:

- Email: `admin@solacesupply.test`
- Password: choose a local test password and keep it out of Git
- If email confirmation is enabled, confirm the user in the Supabase dashboard before testing login

## Commands

```bash
pnpm install
pnpm mvp:env
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/dashboard`
- Login: `http://localhost:3000/login`

Admin routes are protected by Supabase Auth. Unauthenticated requests to `/admin/*` redirect to `/login`.

To verify the seeded admin Auth user without storing its password:

```bash
MVP_ADMIN_PASSWORD="your-local-test-password" pnpm mvp:auth
```

## Stripe Test Webhook

For local checkout testing, run the app and Stripe CLI side by side:

```bash
pnpm dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the generated `whsec_...` value into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `pnpm dev`.

Use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC.

## MVP Verification

```bash
pnpm test
pnpm lint
pnpm build
pnpm mvp:smoke
```

`pnpm mvp:smoke` expects the local app to be running on `http://localhost:3000`. Set `MVP_BASE_URL` to test a deployed preview.
`pnpm mvp:env` requires Stripe test keys and will intentionally fail until `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are set.

## Implemented Flow

- Storefront home reads saved theme sections from Postgres.
- Collection and product pages read real products and variants.
- Add to cart writes `Cart` and `CartItem` rows.
- Checkout creates a pending `Customer`, `Order`, and `OrderItem` set, then redirects to Stripe Checkout.
- Stripe webhook marks the order as paid, decrements variant inventory, clears the cart, and writes transaction/activity rows.
- Success links back to `/admin/orders?query=<orderNumber>`.
- Admin products, orders, customers, finance, inventory, shipping, markets, reports, theme, and apps are backed by Prisma CRUD.

## Deployment Checklist

- Rotate any Supabase database and admin passwords that were shared outside `.env.local`.
- Set all `.env.example` keys in Vercel project settings.
- Configure a Stripe webhook endpoint for the deployed URL: `/api/stripe/webhook`.
- Run `pnpm db:push && pnpm db:seed` against the target Supabase project.
- Verify `/admin/dashboard` redirects when logged out and loads after Supabase Auth login.

## Contact

For inquiries about this project, please contact me at [smartforus@foxmail.com](mailto:smartforus@foxmail.com).
