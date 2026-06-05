import { z } from "zod";

export function parseCsvList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCurrencyAmount(value: unknown) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function parseReportDataPoints(value: unknown) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const [label, rawValue] = line.split(",").map((part) => part?.trim());
      const pointValue = Number(rawValue);
      if (!label || !Number.isFinite(pointValue)) return null;
      return { label, value: pointValue };
    })
    .filter((point): point is { label: string; value: number } => Boolean(point));
}

export function safeReference(prefix: string, value: unknown) {
  const raw = String(value ?? "").trim();
  if (raw) return `${prefix}-${raw.replace(new RegExp(`^${prefix}-`, "i"), "").toUpperCase()}`;
  return `${prefix}-${Date.now().toString().slice(-5)}`;
}

const money = z.preprocess(parseCurrencyAmount, z.number().min(-999999));
const positiveMoney = z.preprocess(parseCurrencyAmount, z.number().positive());
const csvList = z.preprocess(parseCsvList, z.array(z.string()));
const reportPoints = z.preprocess(parseReportDataPoints, z.array(z.object({ label: z.string(), value: z.number() })));
const optionalDate = z.preprocess((value) => new Date(String(value || new Date().toISOString())), z.date());

export const resourceSchemas = {
  order: {
    update: z.object({
      paymentStatus: z.string().min(2),
      fulfillmentStatus: z.string().min(2),
      shippingStatus: z.string().min(2),
      riskLevel: z.string().min(2),
    }),
  },
  product: {
    create: z.object({
      title: z.string().min(2),
      description: z.string().min(4),
      category: z.string().min(2),
      status: z.string().default("Active"),
      price: positiveMoney,
      inventory: z.coerce.number().int().min(0),
      mediaColor: z.string().default("#e8f2dd"),
    }),
    update: z.object({
      title: z.string().min(2),
      description: z.string().min(4),
      category: z.string().min(2),
      status: z.string().min(2),
      mediaColor: z.string().default("#e8f2dd"),
    }),
  },
  productVariant: {
    create: z.object({
      productId: z.string().min(2),
      sku: z.string().min(2),
      color: z.string().min(1),
      size: z.string().min(1),
      price: positiveMoney,
      inventory: z.coerce.number().int().min(0),
      reservedInventory: z.coerce.number().int().min(0).default(0),
      incomingInventory: z.coerce.number().int().min(0).default(0),
      status: z.string().default("Active"),
    }),
    update: z.object({
      sku: z.string().min(2),
      color: z.string().min(1),
      size: z.string().min(1),
      price: positiveMoney,
      inventory: z.coerce.number().int().min(0),
      reservedInventory: z.coerce.number().int().min(0),
      incomingInventory: z.coerce.number().int().min(0),
      status: z.string().min(2),
    }),
  },
  customer: {
    create: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      tags: csvList.default([]),
      status: z.string().min(2).default("New"),
    }),
    update: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      tags: csvList.default([]),
      status: z.string().min(2),
    }),
  },
  payout: {
    create: z.object({
      reference: z.string().optional(),
      amount: positiveMoney,
      method: z.string().min(2),
      status: z.string().default("Scheduled"),
      scheduledAt: optionalDate,
    }),
    update: z.object({
      amount: positiveMoney,
      method: z.string().min(2),
      status: z.string().min(2),
      scheduledAt: optionalDate,
    }),
  },
  transaction: {
    create: z.object({
      reference: z.string().optional(),
      kind: z.string().min(2),
      amount: money,
      fee: money,
      status: z.string().default("Captured"),
    }),
    update: z.object({
      kind: z.string().min(2),
      amount: money,
      fee: money,
      status: z.string().min(2),
    }),
  },
  chargeback: {
    create: z.object({
      caseNumber: z.string().optional(),
      customer: z.string().min(2),
      amount: positiveMoney,
      reason: z.string().min(2),
      status: z.string().default("Open"),
      dueAt: optionalDate,
    }),
    update: z.object({
      customer: z.string().min(2),
      amount: positiveMoney,
      reason: z.string().min(2),
      status: z.string().min(2),
      dueAt: optionalDate,
    }),
  },
  supplier: {
    create: z.object({ name: z.string().min(2), contact: z.string().min(2), status: z.string().default("Active") }),
    update: z.object({ name: z.string().min(2), contact: z.string().min(2), status: z.string().min(2) }),
  },
  purchaseOrder: {
    create: z.object({
      reference: z.string().optional(),
      supplierId: z.string().optional(),
      expectedAt: optionalDate,
      amount: positiveMoney,
      status: z.string().default("Ordered"),
    }),
    update: z.object({
      supplierId: z.string().optional(),
      expectedAt: optionalDate,
      amount: positiveMoney,
      status: z.string().min(2),
    }),
  },
  transfer: {
    create: z.object({
      reference: z.string().optional(),
      fromLocation: z.string().min(2),
      toLocation: z.string().min(2),
      units: z.coerce.number().int().min(1),
      status: z.string().default("In transit"),
    }),
    update: z.object({
      fromLocation: z.string().min(2),
      toLocation: z.string().min(2),
      units: z.coerce.number().int().min(1),
      status: z.string().min(2),
    }),
  },
  inventoryMovement: {
    create: z.object({
      reference: z.string().optional(),
      variantId: z.string().optional(),
      kind: z.string().min(2),
      location: z.string().min(2),
      quantity: z.coerce.number().int(),
      status: z.string().default("Posted"),
    }),
    update: z.object({
      variantId: z.string().optional(),
      kind: z.string().min(2),
      location: z.string().min(2),
      quantity: z.coerce.number().int(),
      status: z.string().min(2),
    }),
  },
  fulfillment: {
    create: z.object({ reference: z.string().optional(), orderId: z.string().optional(), carrier: z.string().min(2), status: z.string().default("Queued") }),
    update: z.object({ orderId: z.string().optional(), carrier: z.string().min(2), status: z.string().min(2) }),
  },
  returnCase: {
    create: z.object({ caseNumber: z.string().optional(), orderId: z.string().optional(), customer: z.string().min(2), reason: z.string().min(2), status: z.string().default("Requested") }),
    update: z.object({ orderId: z.string().optional(), customer: z.string().min(2), reason: z.string().min(2), status: z.string().min(2) }),
  },
  shippingLabel: {
    create: z.object({ labelNumber: z.string().optional(), orderId: z.string().optional(), carrier: z.string().min(2), cost: positiveMoney, status: z.string().default("Purchased") }),
    update: z.object({ orderId: z.string().optional(), carrier: z.string().min(2), cost: positiveMoney, status: z.string().min(2) }),
  },
  market: {
    create: z.object({ name: z.string().min(2), region: z.string().min(2), currency: z.string().min(3), language: z.string().min(2), status: z.string().default("Draft") }),
    update: z.object({ name: z.string().min(2), region: z.string().min(2), currency: z.string().min(3), language: z.string().min(2), status: z.string().min(2) }),
  },
  reportSnapshot: {
    create: z.object({ name: z.string().min(2), kind: z.string().min(2), status: z.string().default("Ready"), data: reportPoints.default([]) }),
    update: z.object({ name: z.string().min(2), kind: z.string().min(2), status: z.string().min(2), data: reportPoints.default([]) }),
  },
  appInstallation: {
    create: z.object({ appKey: z.string().min(2), name: z.string().min(2), category: z.string().min(2), billing: z.string().min(2), scopes: csvList.default([]), status: z.string().default("Available") }),
    update: z.object({ name: z.string().min(2), category: z.string().min(2), billing: z.string().min(2), scopes: csvList.default([]), status: z.string().min(2) }),
  },
};

export type ResourceName = keyof typeof resourceSchemas;
