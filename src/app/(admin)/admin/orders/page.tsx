import { updateOrderStatus } from "@/lib/actions";
import { getTranslations } from "next-intl/server";
import { adminSearch } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const { orders } = await adminSearch(query);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{t("orders.eyebrow")}</p>
        <h1 className="text-3xl font-black">{t("orders.title")}</h1>
      </div>
      <section className="rounded-lg border border-[#dfe7df] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-black">{query ? common("misc.searchFor", { query }) : common("misc.allOrders")}</h2>
          <span className="text-sm font-bold text-[#647067]">{common("misc.records", { count: orders.length })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]">
              <tr><th className="py-2">{t("columns.order")}</th><th>{t("columns.customer")}</th><th>{t("columns.date")}</th><th>{t("columns.total")}</th><th>{t("columns.payment")}</th><th>{t("columns.shipping")}</th><th>{t("columns.risk")}</th><th>{t("columns.fulfillment")}</th><th>{t("columns.update")}</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#edf1ed]">
                  <td className="py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customer.name}</td>
                  <td>{shortDate(order.createdAt)}</td>
                  <td>{money(order.total)}</td>
                  <td><StatusBadge value={order.paymentStatus} label={translateStatus(statusT, order.paymentStatus)} /></td>
                  <td><StatusBadge value={order.shippingStatus} label={translateStatus(statusT, order.shippingStatus)} /></td>
                  <td><StatusBadge value={order.riskLevel} label={translateStatus(statusT, order.riskLevel)} /></td>
                  <td><StatusBadge value={order.fulfillmentStatus} label={translateStatus(statusT, order.fulfillmentStatus)} /></td>
                  <td>
                    <form action={updateOrderStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={order.id} />
                      <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="h-9 rounded-lg border border-[#d8e0d8] px-2">
                        <option value="Unfulfilled">{translateStatus(statusT, "Unfulfilled")}</option>
                        <option value="On hold">{translateStatus(statusT, "On hold")}</option>
                        <option value="Fulfilled">{translateStatus(statusT, "Fulfilled")}</option>
                      </select>
                      <button className="rounded-lg bg-[#173326] px-3 text-xs font-black text-white">{common("actions.save")}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr><td className="py-8 text-center text-[#647067]" colSpan={9}>{common("empty.noMatchingOrders")}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
