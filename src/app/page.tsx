import Link from "next/link";
import { StorefrontShell } from "@/components/storefront-shell";
import { getHomeTheme, getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ThemeSection = {
  id: string;
  title: string;
  copy: string;
  cta: string;
  visible: boolean;
  sortOrder: number;
};

export default async function StorefrontHome() {
  const store = await getStore();
  const [theme, products] = await Promise.all([
    getHomeTheme(store.id),
    prisma.product.findMany({
      where: { storeId: store.id, status: "Active" },
      include: { variants: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);
  const sections = ((theme?.sections ?? []) as ThemeSection[])
    .filter((section) => section.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hero = sections[0];

  return (
    <StorefrontShell>
      <main className="grid gap-10 pb-12">
        <section className="grid min-h-[520px] items-center gap-8 px-5 py-12 lg:grid-cols-[1.05fr_.95fr] lg:px-[7vw]">
          <div>
            <h1 className="max-w-3xl text-5xl font-black leading-none text-[#173326] lg:text-7xl">
              {hero?.title ?? "Calm goods for everyday rituals"}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5f665f]">
              {hero?.copy ?? "Thoughtful storage, soft textures, and desk objects for a slower home."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="rounded-full bg-[#173326] px-5 py-3 text-sm font-black text-white" href="/collections/all-products">
                {hero?.cta ?? "Shop the collection"}
              </Link>
              <Link className="rounded-full border border-[#d8d0c2] bg-white px-5 py-3 text-sm font-black text-[#173326]" href="/admin/dashboard">
                Open admin
              </Link>
            </div>
          </div>
          <div className="min-h-[360px] rounded-lg bg-[linear-gradient(135deg,#e8f2dd,#f7d7c3_48%,#c8d9ed)] shadow-2xl" />
        </section>

        {sections.slice(1).map((section) => (
          <section key={section.id} className="px-5 lg:px-[7vw]">
            <div className="rounded-lg border border-[#e6dfd2] bg-white p-6">
              <h2 className="text-2xl font-black text-[#173326]">{section.title}</h2>
              <p className="mt-2 max-w-3xl text-[#5f665f]">{section.copy}</p>
            </div>
          </section>
        ))}

        <section className="px-5 lg:px-[7vw]">
          <h2 className="text-3xl font-black text-[#173326]">Featured products</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.handle}`} className="overflow-hidden rounded-lg border border-[#e6dfd2] bg-white">
                <div className="h-56" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf)` }} />
                <div className="p-4">
                  <h3 className="font-black">{product.title}</h3>
                  <p className="mt-1 text-sm text-[#697068]">
                    {money(product.variants[0]?.price ?? 0)} · {product.category}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </StorefrontShell>
  );
}
