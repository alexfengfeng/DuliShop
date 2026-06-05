import { getTranslations } from "next-intl/server";
import { ReportsChart } from "@/components/reports-chart";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ChartPoint = { label: string; value: number };

export default async function ReportsPage() {
  const t = await getTranslations("admin");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [orders, products, snapshots, customers] = await Promise.all([
    prisma.order.findMany({ where: { storeId: store.id }, include: { items: true } }),
    prisma.product.findMany({ where: { storeId: store.id }, include: { variants: true } }),
    prisma.reportSnapshot.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.customer.findMany({ where: { storeId: store.id } }),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const units = orders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = products.flatMap((product) => product.variants).filter((variant) => variant.inventory < 10).length;
  const chartData = ((snapshots[0]?.data ?? []) as ChartPoint[]).length ? ((snapshots[0].data ?? []) as ChartPoint[]) : [{ label: t("reports.noData"), value: 0 }];

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("reports.eyebrow")}</p><h1 className="text-3xl font-black">{t("reports.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={t("reports.revenue")} value={money(revenue)} detail={t("reports.revenueDetail")} />
        <MetricCard label={t("reports.unitsSold")} value={String(units)} detail={t("reports.unitsDetail")} />
        <MetricCard label={t("reports.customers")} value={String(customers.length)} detail={t("reports.customersDetail")} />
        <MetricCard label={t("reports.inventoryRisk")} value={String(lowStock)} detail={t("reports.inventoryRiskDetail")} />
      </div>
      <ReportsChart data={chartData} />
      <DataTable columns={[t("columns.report"), t("columns.kind"), t("columns.status"), t("columns.dataPoints")]} rows={snapshots.map((snapshot) => [
        <strong key="name">{snapshot.name}</strong>,
        snapshot.kind,
        <StatusBadge key="status" value={snapshot.status} label={translateStatus(statusT, snapshot.status)} />,
        Array.isArray(snapshot.data) ? snapshot.data.length : 0,
      ])} />
    </div>
  );
}
