import type { MetadataRoute } from "next";
import { siteUrlFromEnv } from "@/lib/seo/theme-seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = siteUrlFromEnv();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/login", "/cart", "/checkout"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
