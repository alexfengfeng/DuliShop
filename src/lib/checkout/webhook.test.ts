import { describe, expect, test } from "vitest";
import {
  canProcessCompletedCheckout,
  inventoryDeltasForOrderItems,
  stripeTransactionReference,
} from "./webhook";

describe("checkout webhook helpers", () => {
  test("skips already paid orders to keep webhook handling idempotent", () => {
    expect(canProcessCompletedCheckout({ paymentStatus: "Paid" })).toBe(false);
    expect(canProcessCompletedCheckout({ paymentStatus: "Pending" })).toBe(true);
  });

  test("aggregates inventory decrements by variant", () => {
    expect(inventoryDeltasForOrderItems([
      { variantId: "v1", quantity: 2 },
      { variantId: "v2", quantity: 1 },
      { variantId: "v1", quantity: 3 },
    ])).toEqual([
      { variantId: "v1", quantity: 5 },
      { variantId: "v2", quantity: 1 },
    ]);
  });

  test("builds a Stripe transaction reference from the checkout session id", () => {
    expect(stripeTransactionReference("cs_test_123")).toBe("STRIPE-cs_test_123");
  });
});
