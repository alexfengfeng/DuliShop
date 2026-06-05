import { describe, expect, test } from "vitest";
import {
  parseCurrencyAmount,
  parseCsvList,
  parseReportDataPoints,
  resourceSchemas,
  safeReference,
} from "./schemas";

describe("admin CRUD schemas", () => {
  test("parses comma separated tags and scopes without empty values", () => {
    expect(parseCsvList("VIP, At risk,, Wholesale ")).toEqual(["VIP", "At risk", "Wholesale"]);
  });

  test("normalizes money values for Prisma decimal fields", () => {
    expect(parseCurrencyAmount("42.105")).toBe(42.11);
    expect(parseCurrencyAmount("")).toBe(0);
  });

  test("parses report data points from textarea lines", () => {
    expect(parseReportDataPoints("Mon,420\nTue,680\nBad line")).toEqual([
      { label: "Mon", value: 420 },
      { label: "Tue", value: 680 },
    ]);
  });

  test("builds predictable unique references", () => {
    expect(safeReference("PO", "123")).toMatch(/^PO-123$/);
    expect(safeReference("RMA", "")).toMatch(/^RMA-\d{5}$/);
  });

  test("validates customer updates with tag arrays", () => {
    const parsed = resourceSchemas.customer.update.parse({
      name: "Mina Chen",
      email: "mina@example.test",
      tags: "VIP, Wholesale",
      status: "VIP",
    });

    expect(parsed.tags).toEqual(["VIP", "Wholesale"]);
  });
});
