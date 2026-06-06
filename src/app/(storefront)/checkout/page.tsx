import { checkout } from "@/lib/actions";
import { cartTotal, getCart } from "@/lib/data";
import { money } from "@/lib/format";
import { StorefrontShell } from "@/components/storefront-shell";
import { hasStripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cart = await getCart();
  const stripeReady = hasStripeConfig();

  return (
    <StorefrontShell>
      <main className="grid gap-5 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-[7vw]">
        <form action={checkout} className="rounded-lg border border-[#e6dfd2] bg-white p-5">
          <h1 className="text-3xl font-black text-[#173326]">Checkout</h1>
          {!stripeReady || error ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              {!stripeReady
                ? "Stripe test keys are missing, so this checkout will use mock payment and still create a paid order in Admin."
                : error === "payment-cancelled"
                  ? "Payment was cancelled. Your cart is still saved."
                  : "Stripe could not start the checkout session."}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm font-bold">Name<input name="name" defaultValue="Avery Stone" className="h-11 rounded-lg border border-[#d8d0c2] px-3" required /></label>
            <label className="grid gap-1 text-sm font-bold">Email<input name="email" defaultValue="avery@example.test" className="h-11 rounded-lg border border-[#d8d0c2] px-3" required /></label>
            <label className="grid gap-1 text-sm font-bold">Address<input name="address" defaultValue="120 Market Street" className="h-11 rounded-lg border border-[#d8d0c2] px-3" required /></label>
            <label className="grid gap-1 text-sm font-bold">Payment method<select name="payment" className="h-11 rounded-lg border border-[#d8d0c2] px-3"><option>{stripeReady ? "Stripe test checkout" : "Mock demo payment"}</option></select></label>
            <button className="mt-2 h-11 rounded-full bg-[#173326] text-sm font-black text-white">{stripeReady ? "Pay with Stripe" : "Place demo order"}</button>
          </div>
        </form>
        <aside className="rounded-lg border border-[#e6dfd2] bg-white p-5">
          <h2 className="text-xl font-black">Order summary</h2>
          <div className="mt-4 grid gap-3">
            {cart?.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>{item.product.title} x {item.quantity}</span>
                <strong>{money(Number(item.variant.price) * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-[#eee7da] pt-4 font-black"><span>Total</span><span>{money(cartTotal(cart))}</span></div>
        </aside>
      </main>
    </StorefrontShell>
  );
}
