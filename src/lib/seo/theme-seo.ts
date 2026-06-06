import type { Metadata } from "next";

export type ThemeSection = {
  id: string;
  title: string;
  copy: string;
  cta: string;
  visible: boolean;
  sortOrder: number;
  type?: string;
  layout?: string;
  imagePosition?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type ThemeSeoSettings = {
  pageTitle: string;
  metaDescription: string;
  canonicalPath: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
};

export type ThemeGeoSettings = {
  brandEntity: string;
  aiSummary: string;
  credibility: string;
  productFacts: string;
  faq: { question: string; answer: string }[];
};

export type MarketSeoSettings = {
  defaultMarket: string;
  alternates: {
    market: string;
    region: string;
    language: string;
    currency: string;
    path: string;
    title: string;
    description: string;
  }[];
};

export type StructuredDataSettings = {
  enableOrganization: boolean;
  enableWebsite: boolean;
  enableProduct: boolean;
  enableBreadcrumbs: boolean;
  enableFaq: boolean;
};

export type ThemeGrowthConfig = {
  sections: ThemeSection[];
  seo: ThemeSeoSettings;
  geo: ThemeGeoSettings;
  marketSeo: MarketSeoSettings;
  structuredData: StructuredDataSettings;
};

type StoreLike = {
  name: string;
  domain: string;
  currency: string;
  language: string;
};

const defaultSections: ThemeSection[] = [
  {
    id: "hero",
    title: "Calm goods for everyday rituals",
    copy: "Thoughtful storage, soft textures, and desk objects for a slower home.",
    cta: "Shop the collection",
    visible: true,
    sortOrder: 1,
    type: "Hero",
    layout: "Editorial split",
    imagePosition: "Right",
  },
  {
    id: "collection",
    title: "Designed for daily order",
    copy: "Utility totes, stackable pantry objects, and desk pieces in quiet materials.",
    cta: "Browse essentials",
    visible: true,
    sortOrder: 2,
    type: "Collection feature",
    layout: "Image band",
    imagePosition: "Left",
  },
  {
    id: "story",
    title: "A slower supply cabinet",
    copy: "Solace Supply creates practical pieces that make small routines feel considered.",
    cta: "Read our story",
    visible: true,
    sortOrder: 3,
    type: "Story",
    layout: "Text first",
    imagePosition: "Right",
  },
];

export const defaultThemeSeo: ThemeSeoSettings = {
  pageTitle: "Solace Supply | Calm home goods",
  metaDescription: "Shop thoughtful storage, soft textures, and desk objects for calmer everyday routines.",
  canonicalPath: "/",
  ogTitle: "Solace Supply",
  ogDescription: "Quiet essentials for daily rituals and a more considered home.",
  ogImage: "",
  twitterTitle: "Solace Supply",
  twitterDescription: "Quiet essentials for daily rituals and a more considered home.",
  robotsIndex: true,
  robotsFollow: true,
};

export const defaultThemeGeo: ThemeGeoSettings = {
  brandEntity: "Solace Supply is a home goods brand for calm everyday rituals.",
  aiSummary: "Solace Supply sells quiet storage, desk, pantry, and soft home objects for thoughtful routines.",
  credibility: "Products use clear descriptions, visible pricing, inventory status, and transparent checkout flow.",
  productFacts: "Core categories include storage, totes, desk objects, pantry organization, and soft home textures.",
  faq: [
    {
      question: "What does Solace Supply sell?",
      answer: "Solace Supply sells calm home goods, totes, storage pieces, and everyday organization objects.",
    },
    {
      question: "Who is Solace Supply for?",
      answer: "Solace Supply is for shoppers who want practical home objects with quiet materials and simple routines.",
    },
  ],
};

export const defaultMarketSeo: MarketSeoSettings = {
  defaultMarket: "United States",
  alternates: [{ market: "United States", region: "US", language: "en", currency: "USD", path: "/", title: "Solace Supply US", description: "Shop Solace Supply in USD." }],
};

export const defaultStructuredData: StructuredDataSettings = {
  enableOrganization: true,
  enableWebsite: true,
  enableProduct: true,
  enableBreadcrumbs: true,
  enableFaq: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeSection(section: unknown, index: number): ThemeSection {
  const record = isRecord(section) ? section : {};
  return {
    id: text(record.id, `section-${index + 1}`),
    title: text(record.title, "New section"),
    copy: text(record.copy, "Add section copy."),
    cta: text(record.cta, "Shop now"),
    visible: bool(record.visible, true),
    sortOrder: Number(record.sortOrder || index + 1),
    type: text(record.type, "Section"),
    layout: text(record.layout, "Editorial split"),
    imagePosition: text(record.imagePosition, "Right"),
    imagePrompt: text(record.imagePrompt),
    imageUrl: text(record.imageUrl),
    imageAlt: text(record.imageAlt),
  };
}

export function normalizeThemeGrowthConfig(value: unknown): ThemeGrowthConfig {
  const root = isRecord(value) ? value : {};
  const rawSections = Array.isArray(value) ? value : Array.isArray(root.sections) ? root.sections : defaultSections;
  const seo = isRecord(root.seo) ? root.seo : {};
  const geo = isRecord(root.geo) ? root.geo : {};
  const marketSeo = isRecord(root.marketSeo) ? root.marketSeo : {};
  const structuredData = isRecord(root.structuredData) ? root.structuredData : {};
  const faq = Array.isArray(geo.faq) ? geo.faq : defaultThemeGeo.faq;
  const alternates = Array.isArray(marketSeo.alternates) ? marketSeo.alternates : defaultMarketSeo.alternates;

  return {
    sections: rawSections.map(normalizeSection).sort((a, b) => a.sortOrder - b.sortOrder),
    seo: {
      pageTitle: text(seo.pageTitle, defaultThemeSeo.pageTitle),
      metaDescription: text(seo.metaDescription, defaultThemeSeo.metaDescription),
      canonicalPath: text(seo.canonicalPath, defaultThemeSeo.canonicalPath),
      ogTitle: text(seo.ogTitle, text(seo.pageTitle, defaultThemeSeo.ogTitle)),
      ogDescription: text(seo.ogDescription, text(seo.metaDescription, defaultThemeSeo.ogDescription)),
      ogImage: text(seo.ogImage),
      twitterTitle: text(seo.twitterTitle, text(seo.ogTitle, defaultThemeSeo.twitterTitle)),
      twitterDescription: text(seo.twitterDescription, text(seo.ogDescription, defaultThemeSeo.twitterDescription)),
      robotsIndex: bool(seo.robotsIndex, defaultThemeSeo.robotsIndex),
      robotsFollow: bool(seo.robotsFollow, defaultThemeSeo.robotsFollow),
    },
    geo: {
      brandEntity: text(geo.brandEntity, defaultThemeGeo.brandEntity),
      aiSummary: text(geo.aiSummary, defaultThemeGeo.aiSummary),
      credibility: text(geo.credibility, defaultThemeGeo.credibility),
      productFacts: text(geo.productFacts, defaultThemeGeo.productFacts),
      faq: faq
        .map((item) => {
          const record = isRecord(item) ? item : {};
          return { question: text(record.question), answer: text(record.answer) };
        })
        .filter((item) => item.question && item.answer),
    },
    marketSeo: {
      defaultMarket: text(marketSeo.defaultMarket, defaultMarketSeo.defaultMarket),
      alternates: alternates
        .map((item) => {
          const record = isRecord(item) ? item : {};
          return {
            market: text(record.market),
            region: text(record.region),
            language: text(record.language, "en"),
            currency: text(record.currency, "USD"),
            path: text(record.path, "/"),
            title: text(record.title),
            description: text(record.description),
          };
        })
        .filter((item) => item.market && item.language && item.path),
    },
    structuredData: {
      enableOrganization: bool(structuredData.enableOrganization, defaultStructuredData.enableOrganization),
      enableWebsite: bool(structuredData.enableWebsite, defaultStructuredData.enableWebsite),
      enableProduct: bool(structuredData.enableProduct, defaultStructuredData.enableProduct),
      enableBreadcrumbs: bool(structuredData.enableBreadcrumbs, defaultStructuredData.enableBreadcrumbs),
      enableFaq: bool(structuredData.enableFaq, defaultStructuredData.enableFaq),
    },
  };
}

export function siteUrlFromEnv(env: Record<string, string | undefined> = process.env) {
  return (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(siteUrl: string, path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function languageAlternates(themeConfig: ThemeGrowthConfig, siteUrl: string) {
  return Object.fromEntries(
    themeConfig.marketSeo.alternates.map((alternate) => [alternate.language, absoluteUrl(siteUrl, alternate.path)]),
  );
}

export function buildHomeMetadata({
  store,
  themeConfig,
  siteUrl = siteUrlFromEnv(),
}: {
  store: StoreLike;
  themeConfig: ThemeGrowthConfig;
  siteUrl?: string;
}): Metadata {
  const heroImage = themeConfig.sections.find((section) => section.imageUrl)?.imageUrl || themeConfig.seo.ogImage;
  const ogImage = themeConfig.seo.ogImage || heroImage;

  return {
    title: themeConfig.seo.pageTitle,
    description: themeConfig.seo.metaDescription,
    alternates: {
      canonical: absoluteUrl(siteUrl, themeConfig.seo.canonicalPath),
      languages: languageAlternates(themeConfig, siteUrl),
    },
    openGraph: {
      title: themeConfig.seo.ogTitle || themeConfig.seo.pageTitle,
      description: themeConfig.seo.ogDescription || themeConfig.seo.metaDescription,
      url: absoluteUrl(siteUrl, themeConfig.seo.canonicalPath),
      siteName: store.name,
      images: ogImage ? [absoluteUrl(siteUrl, ogImage)] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: themeConfig.seo.twitterTitle || themeConfig.seo.ogTitle,
      description: themeConfig.seo.twitterDescription || themeConfig.seo.ogDescription,
      images: ogImage ? [absoluteUrl(siteUrl, ogImage)] : undefined,
    },
    robots: {
      index: themeConfig.seo.robotsIndex,
      follow: themeConfig.seo.robotsFollow,
    },
  };
}

export function buildProductMetadata({
  store,
  product,
  siteUrl = siteUrlFromEnv(),
}: {
  store: StoreLike;
  product: { title: string; handle: string; description: string; featuredImageUrl?: string | null };
  siteUrl?: string;
}): Metadata {
  const canonical = absoluteUrl(siteUrl, `/products/${product.handle}`);
  return {
    title: `${product.title} | ${store.name}`,
    description: product.description,
    alternates: { canonical },
    openGraph: {
      title: product.title,
      description: product.description,
      url: canonical,
      siteName: store.name,
      images: product.featuredImageUrl ? [absoluteUrl(siteUrl, product.featuredImageUrl)] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: product.featuredImageUrl ? [absoluteUrl(siteUrl, product.featuredImageUrl)] : undefined,
    },
  };
}

export function buildCollectionMetadata({
  store,
  collection,
  siteUrl = siteUrlFromEnv(),
}: {
  store: StoreLike;
  collection: { title: string; handle: string; description: string };
  siteUrl?: string;
}): Metadata {
  const canonical = absoluteUrl(siteUrl, `/collections/${collection.handle}`);
  return {
    title: `${collection.title} | ${store.name}`,
    description: collection.description,
    alternates: { canonical },
    openGraph: { title: collection.title, description: collection.description, url: canonical, siteName: store.name, type: "website" },
  };
}

export function buildOrganizationJsonLd({ store, themeConfig, siteUrl = siteUrlFromEnv() }: { store: StoreLike; themeConfig: ThemeGrowthConfig; siteUrl?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: siteUrl,
    description: themeConfig.geo.brandEntity,
    sameAs: [],
  };
}

export function buildWebsiteJsonLd({ store, themeConfig, siteUrl = siteUrlFromEnv() }: { store: StoreLike; themeConfig: ThemeGrowthConfig; siteUrl?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: siteUrl,
    description: themeConfig.geo.aiSummary,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/collections/all-products?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqJsonLd(themeConfig: ThemeGrowthConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: themeConfig.geo.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function buildProductJsonLd({
  store,
  siteUrl = siteUrlFromEnv(),
  product,
}: {
  store: StoreLike;
  siteUrl?: string;
  product: {
    title: string;
    handle: string;
    description: string;
    featuredImageUrl?: string | null;
    featuredImageAlt?: string | null;
    category: string;
    variants: { sku: string; price: number | string; inventory: number }[];
  };
}) {
  const prices = product.variants.map((variant) => Number(variant.price));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    category: product.category,
    image: product.featuredImageUrl ? [absoluteUrl(siteUrl, product.featuredImageUrl)] : [],
    url: absoluteUrl(siteUrl, `/products/${product.handle}`),
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: store.currency,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      offers: product.variants.map((variant) => ({
        "@type": "Offer",
        sku: variant.sku,
        price: Number(variant.price).toFixed(2),
        priceCurrency: store.currency,
        availability: variant.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: absoluteUrl(siteUrl, `/products/${product.handle}`),
      })),
    },
  };
}

export function buildBreadcrumbJsonLd({
  siteUrl = siteUrlFromEnv(),
  items,
}: {
  siteUrl?: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(siteUrl, item.path),
    })),
  };
}

export function buildCollectionJsonLd({
  siteUrl = siteUrlFromEnv(),
  collection,
}: {
  siteUrl?: string;
  collection: {
    title: string;
    handle: string;
    description: string;
    products: { title: string; handle: string }[];
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: absoluteUrl(siteUrl, `/collections/${collection.handle}`),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: collection.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.title,
        url: absoluteUrl(siteUrl, `/products/${product.handle}`),
      })),
    },
  };
}

export function buildLlmsText({
  store,
  themeConfig,
  siteUrl = siteUrlFromEnv(),
  products,
  collections,
}: {
  store: StoreLike;
  themeConfig: ThemeGrowthConfig;
  siteUrl?: string;
  products: { title: string; handle: string; category: string }[];
  collections: { title: string; handle: string }[];
}) {
  const faq = themeConfig.geo.faq.map((item) => `- ${item.question}\n  ${item.answer}`).join("\n");
  const productLinks = products.map((product) => `- ${product.title} (${product.category}): ${absoluteUrl(siteUrl, `/products/${product.handle}`)}`).join("\n");
  const collectionLinks = collections.map((collection) => `- ${collection.title}: ${absoluteUrl(siteUrl, `/collections/${collection.handle}`)}`).join("\n");

  return [
    `# ${store.name}`,
    "",
    `Official site: ${siteUrl}`,
    `Default language: ${store.language}`,
    `Default currency: ${store.currency}`,
    "",
    "## Brand entity",
    themeConfig.geo.brandEntity,
    "",
    "## AI search summary",
    themeConfig.geo.aiSummary,
    "",
    "## Credibility",
    themeConfig.geo.credibility,
    "",
    "## Product facts",
    themeConfig.geo.productFacts,
    "",
    "## FAQ",
    faq,
    "",
    "## Collections",
    collectionLinks,
    "",
    "## Products",
    productLinks,
  ].join("\n");
}

export function seoChecklist(themeConfig: ThemeGrowthConfig) {
  const hero = themeConfig.sections.find((section) => section.visible);
  return [
    { label: "Title length", passed: themeConfig.seo.pageTitle.length >= 20 && themeConfig.seo.pageTitle.length <= 70 },
    { label: "Meta description length", passed: themeConfig.seo.metaDescription.length >= 70 && themeConfig.seo.metaDescription.length <= 170 },
    { label: "Canonical URL", passed: themeConfig.seo.canonicalPath.startsWith("/") || /^https?:\/\//.test(themeConfig.seo.canonicalPath) },
    { label: "Open Graph image", passed: Boolean(themeConfig.seo.ogImage || hero?.imageUrl) },
    { label: "FAQ answers", passed: themeConfig.geo.faq.length > 0 },
    { label: "Market alternates", passed: themeConfig.marketSeo.alternates.length > 0 },
    { label: "Image alt text", passed: themeConfig.sections.filter((section) => section.imageUrl).every((section) => section.imageAlt) },
  ];
}

export function mergeMarketAlternates(
  themeConfig: ThemeGrowthConfig,
  markets: { name: string; region: string; currency: string; language: string; status: string }[],
): ThemeGrowthConfig {
  const configured = themeConfig.marketSeo.alternates;
  const configuredKeys = new Set(configured.map((alternate) => `${alternate.language}:${alternate.region}`));
  const marketAlternates = markets
    .filter((market) => market.status !== "Paused")
    .map((market) => ({
      market: market.name,
      region: market.region,
      language: market.language,
      currency: market.currency,
      path: market.language === "en" ? "/" : `/?market=${market.region.toLowerCase()}`,
      title: `${market.name} | ${market.currency}`,
      description: `Shop ${market.name} in ${market.currency}.`,
    }))
    .filter((alternate) => !configuredKeys.has(`${alternate.language}:${alternate.region}`));

  return {
    ...themeConfig,
    marketSeo: {
      ...themeConfig.marketSeo,
      alternates: [...configured, ...marketAlternates],
    },
  };
}
