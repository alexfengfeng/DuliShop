import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { createReturnFromOrder, updateResource } from "@/lib/actions";
import { adminSearch } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const { query, status } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const { orders: allOrders } = await adminSearch(query);
  const orders = status ? allOrders.filter((order) => order.fulfillmentStatus === status || order.paymentStatus === status || order.shippingStatus === status) : allOrders;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{t("orders.eyebrow")}</p>
        <h1 className="text-3xl font-black">{t("orders.title")}</h1>
      </div>
      <CrudDrawer summary={common("actions.details")} title={query ? common("misc.searchFor", { query }) : common("misc.allOrders")}>
        <p className="text-sm text-[#647067]">{common("misc.records", { count: orders.length })}</p>
      </CrudDrawer>
      <BulkToolbar resource="order" ids={orders.map((order) => order.id)} statuses={["Unfulfilled", "On hold", "Fulfilled", "Cancelled"]} label={common("misc.selected", { count: orders.length })} actionLabel={common("actions.bulkUpdate")} />
      <section className="rounded-lg border border-[#dfe7df] bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]">
              <tr><th className="py-2">{t("columns.order")}</th><th>{t("columns.customer")}</th><th>{t("columns.date")}</th><th>{t("columns.total")}</th><th>{t("columns.payment")}</th><th>{t("columns.shipping")}</th><th>{t("columns.risk")}</th><th>{t("columns.fulfillment")}</th><th>{t("columns.action")}</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#edf1ed] align-top">
                  <td className="py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customer.name}</td>
                  <td>{shortDate(order.createdAt)}</td>
                  <td>{money(order.total)}</td>
                  <td><StatusBadge value={order.paymentStatus} label={translateStatus(statusT, order.paymentStatus)} /></td>
                  <td><StatusBadge value={order.shippingStatus} label={translateStatus(statusT, order.shippingStatus)} /></td>
                  <td><StatusBadge value={order.riskLevel} label={translateStatus(statusT, order.riskLevel)} /></td>
                  <td><StatusBadge value={order.fulfillmentStatus} label={translateStatus(statusT, order.fulfillmentStatus)} /></td>
                  <td>
                    <details>
                      <summary className={secondaryButtonClass}>{common("actions.details")}</summary>
                      <div className="mt-3 grid min-w-[340px] gap-3">
                        <div className="rounded-lg bg-[#f8faf8] p-3">
                          <p className="font-black">{order.orderNumber}</p>
                          <p className="text-[#647067]">{order.items.length} items · {order.channel}</p>
                        </div>
                        <form action={updateResource} className="grid gap-2">
                          <input type="hidden" name="resource" value="order" />
                          <input type="hidden" name="id" value={order.id} />
                          <select name="paymentStatus" defaultValue={order.paymentStatus} className={fieldClass}>
                            {["Pending", "Paid", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                          </select>
                          <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className={fieldClass}>
                            {["Unfulfilled", "On hold", "Fulfilled", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                          </select>
                          <select name="shippingStatus" defaultValue={order.shippingStatus} className={fieldClass}>
                            {["Not shipped", "Ready to ship", "In transit", "Fulfilled", "Exception", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                          </select>
                          <select name="riskLevel" defaultValue={order.riskLevel} className={fieldClass}>
                            {["Low", "Review", "High"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                          </select>
                          <button className={buttonClass}>{common("actions.saveChanges")}</button>
                        </form>
                        <form action={createReturnFromOrder} className="grid gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input name="reason" className={fieldClass} placeholder={t("columns.reason")} defaultValue="Customer requested return" />
                          <button className={secondaryButtonClass}>{common("actions.createReturn")}</button>
                        </form>
                        <DeleteResourceForm resource="order" id={order.id} label={common("actions.cancel")} message={common("misc.confirmDelete")} />
                      </div>
                    </details>
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
