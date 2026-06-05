import { ReportsChart } from "@/components/reports-chart";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ChartPoint = { label: string; value: number };

export default async function ReportsPage() {
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
  const chartData = ((snapshots[0]?.data ?? []) as ChartPoint[]).length ? ((snapshots[0].data ?? []) as ChartPoint[]) : [{ label: "No data", value: 0 }];

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">Sales reports, top products, conversion, live view</p><h1 className="text-3xl font-black">Reports</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Revenue" value={money(revenue)} detail="All demo orders" />
        <MetricCard label="Units sold" value={String(units)} detail="Order item quantity" />
        <MetricCard label="Customers" value={String(customers.length)} detail="Known profiles" />
        <MetricCard label="Inventory risk" value={String(lowStock)} detail="Low stock variants" />
      </div>
      <ReportsChart data={chartData} />
      <DataTable columns={["Report", "Kind", "Status", "Data points"]} rows={snapshots.map((snapshot) => [
        <strong key="name">{snapshot.name}</strong>,
        snapshot.kind,
        <StatusBadge key="status" value={snapshot.status} />,
        Array.isArray(snapshot.data) ? snapshot.data.length : 0,
      ])} />
    </div>
  );
}
