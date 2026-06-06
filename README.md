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
OPENAI_API_KEY="sk-..."
IMAGE_GENERATION_MODEL="gpt-image-1.5"
IMAGE_GENERATION_SIZE="1536x1024"
IMAGE_GENERATION_QUALITY="medium"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
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
pnpm images:local:all
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

The storefront can be demonstrated without Stripe keys. When Stripe env is missing, checkout uses a local mock payment flow that creates a `Paid / Unfulfilled` order, decrements inventory, clears the cart, and links back to Admin Orders.

For local checkout testing, run the app and Stripe CLI side by side:

```bash
pnpm dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the generated `whsec_...` value into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `pnpm dev`.

Use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC.

## AI Images

Theme and product images can be generated from the admin when these optional keys are configured:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

Create a public Supabase Storage bucket named `generated-assets`. Generated images are uploaded under `stores/<storeId>/theme/...` or `stores/<storeId>/products/...`, then the public URL is saved to Postgres. If the image env is missing, the admin shows a clear setup warning and the storefront keeps using the existing gradient fallback.

`IMAGE_GENERATION_MODEL` defaults to `gpt-image-1.5`. If your account or provider uses another image model name, set it explicitly, for example `gpt-image-1` or `image2`.

For no-API local artwork, run:

```bash
pnpm images:local:all
```

This writes SVG assets into `public/generated/products` and `public/generated/theme`, then updates Postgres so the storefront immediately uses the local images.

To restore a clean demo store before a walkthrough, run:

```bash
pnpm demo:reset
```

This preserves the store and admin user, clears demo commerce rows, reseeds the catalog/admin data, and regenerates local artwork.

## MVP Verification

```bash
pnpm test
pnpm lint
pnpm build
pnpm mvp:smoke
pnpm e2e
```

`pnpm mvp:smoke` expects the local app to be running on `http://localhost:3000`. Set `MVP_BASE_URL` to test a deployed preview.
`pnpm mvp:env` requires Stripe test keys and will intentionally fail until `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are set.
`pnpm e2e` runs the Playwright storefront purchase flow. It starts/reuses the local Next dev server and resets demo data before the test.

## Implemented Flow

- Storefront home reads saved theme sections from Postgres.
- Theme sections can store generated images, layout, image position, alt text, and prompts.
- Collection and product pages read real products and variants.
- Product cards and product detail pages prefer `featuredImageUrl`, with `mediaColor` as the fallback.
- Add to cart writes `Cart` and `CartItem` rows.
- Checkout creates `Customer`, `Order`, and `OrderItem` rows. Without Stripe env it completes through local mock payment; with Stripe env it redirects to Stripe Checkout.
- Stripe webhook marks the order as paid, decrements variant inventory, clears the cart, and writes transaction/activity rows.
- Success links back to `/admin/orders?query=<orderNumber>`.
- Admin products, orders, customers, finance, inventory, shipping, markets, reports, theme, and apps are backed by Prisma CRUD.

## Demo Purchase Flow

1. Open `http://localhost:3000`.
2. Open the Linen Utility Tote product.
3. Add one variant to cart.
4. Go to checkout.
5. If Stripe is not configured, choose the default mock payment and place the demo order.
6. On success, click `View in admin` to inspect the order in `/admin/orders?query=<orderNumber>`.

## Deployment Checklist

- Rotate any Supabase database and admin passwords that were shared outside `.env.local`.
- Set all `.env.example` keys in Vercel project settings.
- Configure a Stripe webhook endpoint for the deployed URL: `/api/stripe/webhook`.
- Run `pnpm db:push && pnpm db:seed` against the target Supabase project.
- Verify `/admin/dashboard` redirects when logged out and loads after Supabase Auth login.

## Contact

For inquiries about this project, please contact me at [smartforus@foxmail.com](mailto:smartforus@foxmail.com).
