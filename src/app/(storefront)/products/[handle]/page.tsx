import { addToCart } from "@/lib/actions";
import { StorefrontShell } from "@/components/storefront-shell";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const store = await getStore();
  const product = await prisma.product.findUniqueOrThrow({
    where: { storeId_handle: { storeId: store.id, handle } },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
  });
  const colors = Array.from(new Set(product.variants.map((variant) => variant.color)));
  const sizes = Array.from(new Set(product.variants.map((variant) => variant.size)));
  const firstVariant = product.variants[0];

  return (
    <StorefrontShell>
      <main className="grid gap-8 px-5 py-10 lg:grid-cols-[.95fr_.75fr] lg:px-[7vw]">
        {product.featuredImageUrl ? (
          <img src={product.featuredImageUrl} alt={product.featuredImageAlt || product.title} className="aspect-[4/3] min-h-[320px] w-full rounded-lg object-cover shadow-2xl lg:min-h-[520px]" />
        ) : (
          <div className="aspect-[4/3] min-h-[320px] w-full rounded-lg shadow-2xl lg:min-h-[520px]" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf 48%, #c8d9ed)` }} />
        )}
        <section>
          <p className="text-xs font-black uppercase tracking-wide text-[#697068]">Featured product</p>
          <h1 className="mt-2 text-4xl font-black text-[#173326]">{product.title}</h1>
          <p className="mt-4 max-w-xl leading-7 text-[#5f665f]">{product.description}</p>
          <strong className="mt-4 block text-2xl">{money(firstVariant.price)}</strong>
          <form action={addToCart} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-black">
              Variant
              <select name="variantId" className="h-11 rounded-lg border border-[#d8d0c2] bg-white px-3">
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.color} / {variant.size} · {variant.sku} · {variant.inventory} in stock
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-black">Colors</p>
              <div className="flex flex-wrap gap-2">{colors.map((color) => <span className="rounded-full border border-[#d8d0c2] bg-white px-3 py-2 text-sm font-bold" key={color}>{color}</span>)}</div>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-black">Sizes</p>
              <div className="flex flex-wrap gap-2">{sizes.map((size) => <span className="rounded-full border border-[#d8d0c2] bg-white px-3 py-2 text-sm font-bold" key={size}>{size}</span>)}</div>
            </div>
            <input name="quantity" type="number" min="1" defaultValue="1" className="h-11 w-28 rounded-lg border border-[#d8d0c2] px-3" />
            <button className="h-11 rounded-full bg-[#173326] px-5 text-sm font-black text-white">Add to cart</button>
          </form>
        </section>
      </main>
    </StorefrontShell>
  );
}
