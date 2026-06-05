export function canProcessCompletedCheckout<T extends { paymentStatus: string }>(
  order: T | null | undefined,
): order is T {
  return Boolean(order && order.paymentStatus !== "Paid");
}

export function inventoryDeltasForOrderItems(items: Array<{ variantId: string; quantity: number }>) {
  const deltas = new Map<string, number>();
  for (const item of items) {
    deltas.set(item.variantId, (deltas.get(item.variantId) ?? 0) + item.quantity);
  }

  return Array.from(deltas.entries()).map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function stripeTransactionReference(sessionId: string) {
  return `STRIPE-${sessionId}`;
}
