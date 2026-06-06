import Link from "next/link";
import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { buildBreadcrumbJsonLd, buildCollectionJsonLd, buildCollectionMetadata } from "@/lib/seo/theme-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const store = await getStore();
  const collection = await prisma.collection.findUnique({
    where: { storeId_handle: { storeId: store.id, handle } },
  });
  return buildCollectionMetadata({
    store,
    collection: collection ?? {
      title: "All products",
      handle,
      description: "Browse Solace Supply products.",
    },
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const store = await getStore();
  const collection = await prisma.collection.findUnique({
    where: { storeId_handle: { storeId: store.id, handle } },
    include: {
      products: {
        where: { status: "Active" },
        include: { variants: true },
      },
    },
  });
  const pageCollection = collection ?? {
    title: "All products",
    handle,
    description: "Browse Solace Supply products.",
    products: [],
  };
  const products = collection?.products ?? [];
  const jsonLd = [
    buildCollectionJsonLd({
      collection: {
        title: pageCollection.title,
        handle: pageCollection.handle,
        description: pageCollection.description,
        products,
      },
    }),
    buildBreadcrumbJsonLd({
      items: [
        { name: "Home", path: "/" },
        { name: pageCollection.title, path: `/collections/${pageCollection.handle}` },
      ],
    }),
  ];

  return (
    <StorefrontShell>
      <main className="px-5 py-10 lg:px-[7vw]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="text-4xl font-black text-[#173326]">{pageCollection.title}</h1>
        <p className="mt-2 max-w-2xl text-[#5f665f]">{pageCollection.description}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.handle}`} className="overflow-hidden rounded-lg border border-[#e6dfd2] bg-white">
              {product.featuredImageUrl ? (
                <img src={product.featuredImageUrl} alt={product.featuredImageAlt || product.title} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] w-full" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf)` }} />
              )}
              <div className="p-4">
                <h2 className="font-black">{product.title}</h2>
                <p className="mt-1 text-sm text-[#697068]">{money(product.variants[0]?.price ?? 0)} · {product.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </StorefrontShell>
  );
}
