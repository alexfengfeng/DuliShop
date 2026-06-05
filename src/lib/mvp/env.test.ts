import { describe, expect, test } from "vitest";
import { getMissingMvpEnvKeys } from "./env";

describe("getMissingMvpEnvKeys", () => {
  test("requires Supabase and Stripe keys for full MVP checkout", () => {
    expect(getMissingMvpEnvKeys({})).toEqual([
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ]);
  });

  test("does not treat placeholder values as configured", () => {
    expect(getMissingMvpEnvKeys({
      DATABASE_URL: "postgresql://demo",
      DIRECT_URL: "postgresql://demo",
      NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
      STRIPE_SECRET_KEY: "sk_test_...",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_real",
      STRIPE_WEBHOOK_SECRET: "whsec_real",
    })).toEqual(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "STRIPE_SECRET_KEY"]);
  });
});
