import { NextResponse } from "next/server";
import { getHomeTheme, getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { buildLlmsText, normalizeThemeGrowthConfig, siteUrlFromEnv } from "@/lib/seo/theme-seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  const [theme, products, collections] = await Promise.all([
    getHomeTheme(store.id),
    prisma.product.findMany({
      where: { storeId: store.id, status: "Active" },
      select: { title: true, handle: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.collection.findMany({
      where: { storeId: store.id },
      select: { title: true, handle: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return new NextResponse(
    buildLlmsText({
      store,
      themeConfig: normalizeThemeGrowthConfig(theme?.sections),
      siteUrl: siteUrlFromEnv(),
      products,
      collections,
    }),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
