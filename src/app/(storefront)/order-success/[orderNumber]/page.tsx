import Link from "next/link";
import { StorefrontShell } from "@/components/storefront-shell";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { orderNumber } = await params;
  const { mode } = await searchParams;
  const store = await getStore();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  return (
    <StorefrontShell>
      <main className="grid min-h-[calc(100vh-64px)] place-items-center px-5 py-10">
        <section className="w-full max-w-2xl rounded-lg border border-[#e6dfd2] bg-white p-8 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
            {order?.paymentStatus === "Paid" ? "Payment successful" : "Payment submitted"}
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#173326]">Order confirmed</h1>
          <p className="mt-3 text-[#5f665f]">
            Your order number is <strong>{orderNumber}</strong>. Current payment status:{" "}
            <strong>{order?.paymentStatus ?? "Pending"}</strong>.
          </p>
          <p className="mt-2 text-sm text-[#697068]">
            Store: {store.name}. {mode === "mock" ? "This demo order was paid by the local mock checkout flow." : "Stripe webhook updates this order to Paid when the test payment completes."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="rounded-full bg-[#173326] px-5 py-3 text-sm font-black text-white" href={`/admin/orders?query=${encodeURIComponent(orderNumber)}`}>View in admin</Link>
            <Link className="rounded-full border border-[#d8d0c2] px-5 py-3 text-sm font-black" href="/">Back to storefront</Link>
          </div>
        </section>
      </main>
    </StorefrontShell>
  );
}
