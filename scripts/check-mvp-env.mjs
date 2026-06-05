import { config } from "dotenv";

config({ path: ".env.local" });
config();

const requiredKeys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const placeholders = new Set(["", "demo", "YOUR_SUPABASE_ANON_KEY", "sk_test_...", "pk_test_...", "whsec_..."]);
const missing = requiredKeys.filter((key) => {
  const value = process.env[key]?.trim();
  return !value || placeholders.has(value);
});

if (missing.length) {
  console.error(`Missing MVP environment keys: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("MVP environment keys are present.");
