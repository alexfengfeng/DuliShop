import type { MetadataRoute } from "next";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteUrlFromEnv } from "@/lib/seo/theme-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteUrlFromEnv();
  const store = await getStore();
  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, status: "Active" },
      select: { handle: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.collection.findMany({
      where: { storeId: store.id },
      select: { handle: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return [
    { url: absoluteUrl(siteUrl, "/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...collections.map((collection) => ({
      url: absoluteUrl(siteUrl, `/collections/${collection.handle}`),
      lastModified: collection.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(siteUrl, `/products/${product.handle}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
