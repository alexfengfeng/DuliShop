import { updateMarketStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const store = await getStore();
  const markets = await prisma.market.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } });
  const active = markets.filter((market) => market.status === "Active").length;

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">Regions, currencies, languages, rollout status</p><h1 className="text-3xl font-black">Markets</h1></div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Markets" value={String(markets.length)} detail="Configured regions" />
        <MetricCard label="Active" value={String(active)} detail="Selling enabled" />
        <MetricCard label="Review" value={String(markets.length - active)} detail="Localization tasks open" />
      </div>
      <DataTable columns={["Market", "Region", "Currency", "Language", "Status", "Action"]} rows={markets.map((market) => [
        <strong key="name">{market.name}</strong>,
        market.region,
        market.currency,
        market.language,
        <StatusBadge key="status" value={market.status} />,
        <form key="form" action={updateMarketStatus} className="flex gap-2"><input type="hidden" name="id" value={market.id} /><input type="hidden" name="status" value={market.status === "Active" ? "Paused" : "Active"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{market.status === "Active" ? "Pause" : "Activate"}</button></form>,
      ])} />
    </div>
  );
}
