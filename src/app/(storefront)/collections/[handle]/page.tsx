import Link from "next/link";
import { StorefrontShell } from "@/components/storefront-shell";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  return (
    <StorefrontShell>
      <main className="px-5 py-10 lg:px-[7vw]">
        <h1 className="text-4xl font-black text-[#173326]">{collection?.title ?? "All products"}</h1>
        <p className="mt-2 max-w-2xl text-[#5f665f]">{collection?.description ?? "Browse Solace Supply products."}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(collection?.products ?? []).map((product) => (
            <Link key={product.id} href={`/products/${product.handle}`} className="overflow-hidden rounded-lg border border-[#e6dfd2] bg-white">
              {product.featuredImageUrl ? (
                <img src={product.featuredImageUrl} alt={product.featuredImageAlt || product.title} className="h-56 w-full object-cover" />
              ) : (
                <div className="h-56" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf)` }} />
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
