import { describe, expect, test } from "vitest";
import {
  buildCollectionJsonLd,
  buildHomeMetadata,
  buildLlmsText,
  buildProductJsonLd,
  mergeMarketAlternates,
  normalizeThemeGrowthConfig,
} from "./theme-seo";

const store = {
  name: "Solace Supply",
  domain: "solace-supply.test",
  currency: "USD",
  language: "en",
};

const themeConfig = normalizeThemeGrowthConfig({
  sections: [
    {
      id: "hero",
      title: "Calm goods for everyday rituals",
      copy: "Thoughtful storage and soft textures for a slower home.",
      cta: "Shop the collection",
      visible: true,
      sortOrder: 1,
      imageUrl: "/generated/theme/hero.svg",
      imageAlt: "Quiet home goods on a linen surface",
    },
  ],
  seo: {
    pageTitle: "Solace Supply | Calm home goods",
    metaDescription: "Shop calm storage, soft textures, and everyday home objects from Solace Supply.",
    canonicalPath: "/",
    ogTitle: "Solace Supply",
    ogDescription: "Quiet essentials for daily routines.",
    ogImage: "/generated/theme/hero.svg",
    robotsIndex: true,
    robotsFollow: true,
  },
  geo: {
    brandEntity: "Solace Supply is a home goods brand for calm everyday rituals.",
    aiSummary: "Solace Supply sells quiet storage, desk, and home objects for thoughtful routines.",
    credibility: "Designed with durable materials, clear product pages, and transparent fulfillment policies.",
    productFacts: "Core categories include storage, totes, desk objects, and pantry organization.",
    faq: [
      {
        question: "What does Solace Supply sell?",
        answer: "Solace Supply sells calm home goods, totes, and organizational objects.",
      },
    ],
  },
  marketSeo: {
    defaultMarket: "United States",
    alternates: [
      {
        market: "United States",
        region: "US",
        language: "en",
        currency: "USD",
        path: "/",
        title: "Solace Supply US",
        description: "Shop Solace Supply in USD.",
      },
      {
        market: "Canada",
        region: "CA",
        language: "en-CA",
        currency: "CAD",
        path: "/?market=ca",
        title: "Solace Supply Canada",
        description: "Shop Solace Supply in CAD.",
      },
    ],
  },
});

describe("theme SEO and GEO helpers", () => {
  test("normalizes legacy section arrays into growth config defaults", () => {
    const legacy = normalizeThemeGrowthConfig([
      { id: "hero", title: "Legacy hero", copy: "Copy", cta: "Shop", visible: true, sortOrder: 1 },
    ]);

    expect(legacy.sections[0]?.title).toBe("Legacy hero");
    expect(legacy.seo.pageTitle).toContain("Solace Supply");
    expect(legacy.structuredData.enableProduct).toBe(true);
  });

  test("builds homepage metadata with canonical, social, robots, and market alternates", () => {
    const metadata = buildHomeMetadata({ store, themeConfig, siteUrl: "https://solace.example" });

    expect(metadata.title).toBe("Solace Supply | Calm home goods");
    expect(metadata.description).toContain("Shop calm storage");
    expect(metadata.alternates?.canonical).toBe("https://solace.example/");
    expect(metadata.alternates?.languages).toMatchObject({
      en: "https://solace.example/",
      "en-CA": "https://solace.example/?market=ca",
    });
    expect(metadata.openGraph?.images).toContain("https://solace.example/generated/theme/hero.svg");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  test("builds product JSON-LD with offer, image, sku, and stock status", () => {
    const jsonLd = buildProductJsonLd({
      store,
      siteUrl: "https://solace.example",
      product: {
        title: "Linen Utility Tote",
        handle: "linen-utility-tote",
        description: "A soft utility tote for daily errands.",
        featuredImageUrl: "/generated/products/linen-utility-tote.svg",
        featuredImageAlt: "Linen Utility Tote product image",
        category: "Home",
        variants: [
          { sku: "LIN-001", price: 48, inventory: 5 },
          { sku: "LIN-002", price: 52, inventory: 0 },
        ],
      },
    });

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.image).toEqual(["https://solace.example/generated/products/linen-utility-tote.svg"]);
    expect(jsonLd.offers.offers[0]).toMatchObject({
      sku: "LIN-001",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    });
    expect(jsonLd.offers.lowPrice).toBe("48.00");
  });

  test("builds collection JSON-LD and llms text for generative search", () => {
    const collectionJsonLd = buildCollectionJsonLd({
      siteUrl: "https://solace.example",
      collection: {
        title: "All products",
        handle: "all-products",
        description: "Browse Solace Supply products.",
        products: [
          { title: "Linen Utility Tote", handle: "linen-utility-tote" },
          { title: "Pantry Glass Set", handle: "pantry-glass-set" },
        ],
      },
    });
    const llms = buildLlmsText({
      store,
      themeConfig,
      siteUrl: "https://solace.example",
      products: [
        { title: "Linen Utility Tote", handle: "linen-utility-tote", category: "Home" },
      ],
      collections: [{ title: "All products", handle: "all-products" }],
    });

    expect(collectionJsonLd["@type"]).toBe("CollectionPage");
    expect(collectionJsonLd.mainEntity.itemListElement).toHaveLength(2);
    expect(llms).toContain("# Solace Supply");
    expect(llms).toContain("AI search summary");
    expect(llms).toContain("What does Solace Supply sell?");
    expect(llms).toContain("https://solace.example/products/linen-utility-tote");
  });

  test("merges enabled markets into hreflang alternates without duplicating configured entries", () => {
    const merged = mergeMarketAlternates(themeConfig, [
      { name: "Canada", region: "CA", currency: "CAD", language: "en-CA", status: "Active" },
      { name: "Japan", region: "JP", currency: "JPY", language: "ja", status: "Review" },
      { name: "France", region: "FR", currency: "EUR", language: "fr", status: "Paused" },
    ]);

    expect(merged.marketSeo.alternates.map((alternate) => alternate.language)).toEqual(["en", "en-CA", "ja"]);
    expect(merged.marketSeo.alternates.find((alternate) => alternate.language === "ja")).toMatchObject({
      path: "/?market=jp",
      currency: "JPY",
    });
  });
});
