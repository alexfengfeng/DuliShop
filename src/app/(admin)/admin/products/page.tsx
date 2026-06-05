import Link from "next/link";
import { archiveProduct, createProduct } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const store = await getStore();
  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: { variants: true, collection: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">Products sync to storefront</p>
          <h1 className="text-3xl font-black">Products</h1>
        </div>
        <Link className="rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black" href="/products/linen-utility-tote">Preview product page</Link>
      </div>
      <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form action={createProduct} className="rounded-lg border border-[#dfe7df] bg-white p-4">
          <h2 className="font-black">Create product</h2>
          <div className="mt-4 grid gap-3">
            <input name="title" placeholder="Product title" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
            <input name="category" placeholder="Category" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
            <textarea name="description" placeholder="Description" className="min-h-24 rounded-lg border border-[#d8e0d8] p-3" required />
            <input name="price" type="number" min="1" step="0.01" placeholder="Price" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
            <input name="inventory" type="number" min="0" placeholder="Inventory" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
            <button className="h-10 rounded-lg bg-[#173326] text-sm font-black text-white">Create</button>
          </div>
        </form>
        <div className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase text-[#647067]"><tr><th className="py-2">Product</th><th>Category</th><th>Variants</th><th>On hand</th><th>Reserved</th><th>Incoming</th><th>Price</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {products.map((product) => {
                  const inventory = product.variants.reduce((sum, variant) => sum + variant.inventory, 0);
                  const reserved = product.variants.reduce((sum, variant) => sum + variant.reservedInventory, 0);
                  const incoming = product.variants.reduce((sum, variant) => sum + variant.incomingInventory, 0);
                  return (
                    <tr key={product.id} className="border-t border-[#edf1ed]">
                      <td className="py-3 font-black">{product.title}</td>
                      <td>{product.category}</td>
                      <td>{product.variants.length}</td>
                      <td>{inventory}</td>
                      <td>{reserved}</td>
                      <td>{incoming}</td>
                      <td>{money(product.variants[0]?.price ?? 0)}</td>
                      <td><StatusBadge value={product.status} /></td>
                      <td>
                        <form action={archiveProduct}>
                          <input type="hidden" name="id" value={product.id} />
                          <button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">Archive/Delete</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
