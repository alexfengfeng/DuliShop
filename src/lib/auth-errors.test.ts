import { describe, expect, test } from "vitest";
import { loginErrorKey } from "./auth-errors";

describe("loginErrorKey", () => {
  test("maps Supabase credential failures to a stable translation key", () => {
    expect(loginErrorKey("Invalid login credentials")).toBe("invalidCredentials");
  });

  test("maps missing environment failures to configuration copy", () => {
    expect(loginErrorKey("supabase-env")).toBe("missingSupabase");
  });

  test("falls back to a generic key for unknown auth errors", () => {
    expect(loginErrorKey("Email not confirmed")).toBe("generic");
  });
});
