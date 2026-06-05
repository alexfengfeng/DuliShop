import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass, textareaClass } from "@/components/admin/resource-actions";
import { createResource, updateResource } from "@/lib/actions";
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

function pointsText(data: unknown) {
  return Array.isArray(data) ? (data as ChartPoint[]).map((point) => `${point.label},${point.value}`).join("\n") : "";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [orders, products, snapshots, customers] = await Promise.all([
    prisma.order.findMany({ where: { storeId: store.id }, include: { items: true } }),
    prisma.product.findMany({ where: { storeId: store.id }, include: { variants: true } }),
    prisma.reportSnapshot.findMany({ where: { storeId: store.id, ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { updatedAt: "desc" } }),
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
      <CrudDrawer summary={`${common("actions.create")} ${t("columns.report")}`} title={`${common("actions.create")} ${t("columns.report")}`}>
        <form action={createResource} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="resource" value="reportSnapshot" />
          <input name="name" placeholder={t("columns.report")} className={fieldClass} required />
          <input name="kind" placeholder={t("columns.kind")} className={fieldClass} required />
          <select name="status" defaultValue="Ready" className={fieldClass}>{["Ready", "Draft", "Review"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
          <textarea name="data" placeholder="Mon,420&#10;Tue,680" className={`${textareaClass} md:col-span-3`} />
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      <ReportsChart data={chartData} />
      <DataTable columns={[t("columns.report"), t("columns.kind"), t("columns.status"), t("columns.dataPoints"), t("columns.action")]} rows={snapshots.map((snapshot) => [
        <strong key="name">{snapshot.name}</strong>,
        snapshot.kind,
        <StatusBadge key="status" value={snapshot.status} label={translateStatus(statusT, snapshot.status)} />,
        Array.isArray(snapshot.data) ? snapshot.data.length : 0,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="reportSnapshot" /><input type="hidden" name="id" value={snapshot.id} /><input name="name" defaultValue={snapshot.name} className={fieldClass} /><input name="kind" defaultValue={snapshot.kind} className={fieldClass} /><select name="status" defaultValue={snapshot.status} className={fieldClass}>{["Ready", "Draft", "Review"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><textarea name="data" defaultValue={pointsText(snapshot.data)} className={textareaClass} /><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="reportSnapshot" id={snapshot.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
    </div>
  );
}
