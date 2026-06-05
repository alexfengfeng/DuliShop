import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getTranslations("admin");
  const statusT = await getTranslations("status");
  const common = await getTranslations("common");
  const store = await getStore();
  const [orders, products, customers, activities] = await Promise.all([
    prisma.order.findMany({ where: { storeId: store.id }, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { storeId: store.id }, include: { variants: true } }),
    prisma.customer.findMany({ where: { storeId: store.id } }),
    prisma.activityLog.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const lowStock = products.flatMap((product) => product.variants).filter((variant) => variant.inventory < 10).length;
  const pendingFulfillment = orders.filter((order) => order.fulfillmentStatus !== "Fulfilled").length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === "Pending").length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">{t("dashboard.eyebrow")}</p>
          <h1 className="text-3xl font-black">{t("dashboard.title")}</h1>
        </div>
        <Link href="/" className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">{common("actions.viewStorefront")}</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={t("dashboard.metrics.revenue")} value={money(revenue)} detail={t("dashboard.metrics.revenueDetail")} />
        <MetricCard label={t("dashboard.metrics.pendingPayments")} value={String(pendingPayments)} detail={t("dashboard.metrics.pendingPaymentsDetail")} />
        <MetricCard label={t("dashboard.metrics.customers")} value={String(customers.length)} detail={t("dashboard.metrics.customersDetail")} />
        <MetricCard label={t("dashboard.metrics.opsAttention")} value={String(lowStock + pendingFulfillment)} detail={t("dashboard.metrics.opsAttentionDetail")} />
      </div>
      <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
          <h2 className="text-lg font-black">{t("dashboard.recentOrders")}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase text-[#647067]"><tr><th className="py-2">{t("columns.order")}</th><th>{t("columns.customer")}</th><th>{t("columns.total")}</th><th>{t("columns.payment")}</th><th>{t("columns.shipping")}</th><th>{t("columns.risk")}</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-[#edf1ed]">
                    <td className="py-3 font-black">{order.orderNumber}</td>
                    <td>{order.customer.name}</td>
                    <td>{money(order.total)}</td>
                    <td><StatusBadge value={order.paymentStatus} label={translateStatus(statusT, order.paymentStatus)} /></td>
                    <td><StatusBadge value={order.shippingStatus} label={translateStatus(statusT, order.shippingStatus)} /></td>
                    <td><StatusBadge value={order.riskLevel} label={translateStatus(statusT, order.riskLevel)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
          <h2 className="text-lg font-black">{t("dashboard.activity")}</h2>
          <div className="mt-3 grid gap-3">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-lg bg-[#f8faf8] p-3 text-sm">
                <strong>{activity.action}</strong>
                <p className="text-[#647067]">{activity.subject} · {shortDate(activity.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
