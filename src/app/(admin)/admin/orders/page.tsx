import { updateOrderStatus } from "@/lib/actions";
import { adminSearch } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const { orders } = await adminSearch(query);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">Paid orders created by checkout flow</p>
        <h1 className="text-3xl font-black">Orders</h1>
      </div>
      <section className="rounded-lg border border-[#dfe7df] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-black">{query ? `Search: ${query}` : "All orders"}</h2>
          <span className="text-sm font-bold text-[#647067]">{orders.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]">
              <tr><th className="py-2">Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Shipping</th><th>Risk</th><th>Fulfillment</th><th>Update</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#edf1ed]">
                  <td className="py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customer.name}</td>
                  <td>{shortDate(order.createdAt)}</td>
                  <td>{money(order.total)}</td>
                  <td><StatusBadge value={order.paymentStatus} /></td>
                  <td><StatusBadge value={order.shippingStatus} /></td>
                  <td><StatusBadge value={order.riskLevel} /></td>
                  <td><StatusBadge value={order.fulfillmentStatus} /></td>
                  <td>
                    <form action={updateOrderStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={order.id} />
                      <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="h-9 rounded-lg border border-[#d8e0d8] px-2">
                        <option>Unfulfilled</option>
                        <option>On hold</option>
                        <option>Fulfilled</option>
                      </select>
                      <button className="rounded-lg bg-[#173326] px-3 text-xs font-black text-white">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr><td className="py-8 text-center text-[#647067]" colSpan={9}>No matching orders yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
