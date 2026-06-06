import { describe, expect, test } from "vitest";
import { demoResetDeleteSteps } from "./reset";

describe("demo reset plan", () => {
  test("deletes dependent commerce rows before parent rows", () => {
    expect(demoResetDeleteSteps.indexOf("orderItem")).toBeLessThan(demoResetDeleteSteps.indexOf("order"));
    expect(demoResetDeleteSteps.indexOf("cartItem")).toBeLessThan(demoResetDeleteSteps.indexOf("cart"));
    expect(demoResetDeleteSteps.indexOf("productVariant")).toBeLessThan(demoResetDeleteSteps.indexOf("product"));
    expect(demoResetDeleteSteps.indexOf("product")).toBeLessThan(demoResetDeleteSteps.indexOf("collection"));
  });

  test("preserves store and users for Supabase Auth alignment", () => {
    expect(demoResetDeleteSteps).not.toContain("store");
    expect(demoResetDeleteSteps).not.toContain("user");
  });
});
