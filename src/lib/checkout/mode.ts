export type CheckoutMode = "stripe" | "mock";

export function checkoutMode({ stripeConfigured }: { stripeConfigured: boolean }): CheckoutMode {
  return stripeConfigured ? "stripe" : "mock";
}

export function orderPaymentStatusForMode(mode: CheckoutMode) {
  return mode === "mock" ? "Paid" : "Pending";
}
