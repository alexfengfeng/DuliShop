export type LoginErrorKey = "missingSupabase" | "invalidCredentials" | "generic";

export function loginErrorKey(error?: string | null): LoginErrorKey | null {
  if (!error) return null;
  if (error === "supabase-env") return "missingSupabase";

  const normalized = error.toLowerCase();
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "invalidCredentials";
  }

  return "generic";
}
