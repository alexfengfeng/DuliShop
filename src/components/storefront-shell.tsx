import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartTotal, getCart } from "@/lib/data";
import { money } from "@/lib/format";

export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const cart = await getCart();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#1f241f]">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[#e6dfd2] bg-[#fbfaf6]/90 px-4 backdrop-blur lg:px-8">
        <Link href="/" className="text-lg font-black text-[#173326]">
          Solace Supply
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto text-sm font-bold text-[#4c554e]">
          <Link href="/collections/all-products">Shop</Link>
          <Link href="/products/linen-utility-tote">Featured</Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c2] bg-white px-3 py-2 text-[#173326]"
          >
            <ShoppingBag size={16} />
            {count} · {money(cartTotal(cart))}
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
