import { getTranslations } from "next-intl/server";
import { updateMarketStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const markets = await prisma.market.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } });
  const active = markets.filter((market) => market.status === "Active").length;

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("markets.eyebrow")}</p><h1 className="text-3xl font-black">{t("markets.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label={t("markets.markets")} value={String(markets.length)} detail={t("markets.marketsDetail")} />
        <MetricCard label={t("markets.active")} value={String(active)} detail={t("markets.activeDetail")} />
        <MetricCard label={t("markets.review")} value={String(markets.length - active)} detail={t("markets.reviewDetail")} />
      </div>
      <DataTable columns={[t("columns.market"), t("columns.region"), t("columns.currency"), t("columns.language"), t("columns.status"), t("columns.action")]} rows={markets.map((market) => [
        <strong key="name">{market.name}</strong>,
        market.region,
        market.currency,
        market.language,
        <StatusBadge key="status" value={market.status} label={translateStatus(statusT, market.status)} />,
        <form key="form" action={updateMarketStatus} className="flex gap-2"><input type="hidden" name="id" value={market.id} /><input type="hidden" name="status" value={market.status === "Active" ? "Paused" : "Active"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{market.status === "Active" ? common("actions.pause") : common("actions.activate")}</button></form>,
      ])} />
    </div>
  );
}
