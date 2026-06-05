export const requiredMvpEnvKeys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

const placeholderValues = new Set(["", "demo", "YOUR_SUPABASE_ANON_KEY", "sk_test_...", "pk_test_...", "whsec_..."]);

export function getMissingMvpEnvKeys(env: Record<string, string | undefined>) {
  return requiredMvpEnvKeys.filter((key) => {
    const value = env[key]?.trim();
    return !value || placeholderValues.has(value);
  });
}
