import { describe, expect, test } from "vitest";
import { localProductImageUrl, safeAssetFileName, themeForProduct } from "./product-art";
import { localThemeImageUrl, themeSectionSvg } from "./theme-art";

describe("local product artwork helpers", () => {
  test("creates stable public SVG URLs for product handles", () => {
    expect(safeAssetFileName("Linen Utility Tote!")).toBe("linen-utility-tote");
    expect(localProductImageUrl({ handle: "linen-utility-tote", title: "Linen Utility Tote" })).toBe(
      "/generated/products/linen-utility-tote.svg",
    );
  });

  test("selects an artwork theme from product title and category", () => {
    expect(themeForProduct({ title: "Linen Utility Tote", category: "Bags" })).toBe("tote");
    expect(themeForProduct({ title: "Stackable Pantry Set", category: "Home" })).toBe("pantry");
    expect(themeForProduct({ title: "Ceramic Desk Tray", category: "Desk" })).toBe("tray");
  });

  test("creates stable theme image URLs and SVG output", () => {
    expect(localThemeImageUrl({ id: "hero", title: "Calm goods" })).toBe("/generated/theme/hero.svg");
    expect(themeSectionSvg({ id: "hero", title: "Calm goods", type: "Hero" })).toContain("Calm goods");
  });
});
