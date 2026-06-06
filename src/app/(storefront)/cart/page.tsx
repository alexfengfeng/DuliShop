import Link from "next/link";
import type { Metadata } from "next";
import { updateCartItem } from "@/lib/actions";
import { cartTotal, getCart } from "@/lib/data";
import { money } from "@/lib/format";
import { StorefrontShell } from "@/components/storefront-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart | Solace Supply",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();

  return (
    <StorefrontShell>
      <main className="grid gap-5 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-[7vw]">
        <section>
          <h1 className="text-4xl font-black text-[#173326]">Cart</h1>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#e6dfd2] bg-white">
            {cart?.items.length ? cart.items.map((item) => (
              <div key={item.id} className="grid gap-3 border-b border-[#eee7da] p-4 md:grid-cols-[72px_minmax(0,1fr)_220px] md:items-center">
                {item.product.featuredImageUrl ? (
                  <img src={item.product.featuredImageUrl} alt={item.product.featuredImageAlt || item.product.title} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg" style={{ background: `linear-gradient(135deg, ${item.product.mediaColor}, #f8e1cf)` }} />
                )}
                <div>
                  <h2 className="font-black">{item.product.title}</h2>
                  <p className="text-sm text-[#697068]">{item.variant.color} / {item.variant.size} · {money(item.variant.price)}</p>
                </div>
                <form action={updateCartItem} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="quantity" type="number" min="0" defaultValue={item.quantity} className="h-10 w-20 rounded-lg border border-[#d8d0c2] px-3" />
                  <button className="h-10 rounded-lg border border-[#d8d0c2] px-3 text-sm font-black">Update</button>
                </form>
              </div>
            )) : (
              <div className="p-8 text-center text-[#697068]">Your cart is empty.</div>
            )}
          </div>
        </section>
        <aside className="rounded-lg border border-[#e6dfd2] bg-white p-5">
          <h2 className="text-xl font-black">Order summary</h2>
          <div className="mt-4 flex justify-between border-t border-[#eee7da] pt-4 font-black">
            <span>Total</span>
            <span>{money(cartTotal(cart))}</span>
          </div>
          <Link href="/checkout" className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#173326] text-sm font-black text-white">Checkout</Link>
          <Link href="/collections/all-products" className="mt-3 flex h-11 items-center justify-center rounded-full border border-[#d8d0c2] text-sm font-black">Continue shopping</Link>
        </aside>
      </main>
    </StorefrontShell>
  );
}
