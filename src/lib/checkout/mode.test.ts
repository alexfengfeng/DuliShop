import { describe, expect, test } from "vitest";
import { checkoutMode, orderPaymentStatusForMode } from "./mode";

describe("checkout mode", () => {
  test("uses mock checkout when Stripe env is missing", () => {
    expect(checkoutMode({ stripeConfigured: false })).toBe("mock");
    expect(orderPaymentStatusForMode("mock")).toBe("Paid");
  });

  test("uses Stripe checkout when Stripe env is configured", () => {
    expect(checkoutMode({ stripeConfigured: true })).toBe("stripe");
    expect(orderPaymentStatusForMode("stripe")).toBe("Pending");
  });
});
