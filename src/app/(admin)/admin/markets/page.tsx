import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { createResource, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const { query, status } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const markets = await prisma.market.findMany({
    where: {
      storeId: store.id,
      ...(status ? { status } : {}),
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { region: { contains: query, mode: "insensitive" } }] } : {}),
    },
    orderBy: { name: "asc" },
  });
  const active = markets.filter((market) => market.status === "Active").length;

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("markets.eyebrow")}</p><h1 className="text-3xl font-black">{t("markets.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label={t("markets.markets")} value={String(markets.length)} detail={t("markets.marketsDetail")} />
        <MetricCard label={t("markets.active")} value={String(active)} detail={t("markets.activeDetail")} />
        <MetricCard label={t("markets.review")} value={String(markets.length - active)} detail={t("markets.reviewDetail")} />
      </div>
      <CrudDrawer summary={`${common("actions.create")} ${t("columns.market")}`} title={`${common("actions.create")} ${t("columns.market")}`}>
        <form action={createResource} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="resource" value="market" />
          <input name="name" placeholder={t("columns.market")} className={fieldClass} required />
          <input name="region" placeholder={t("columns.region")} className={fieldClass} required />
          <input name="currency" placeholder={t("columns.currency")} className={fieldClass} defaultValue="USD" />
          <input name="language" placeholder={t("columns.language")} className={fieldClass} defaultValue="en" />
          <select name="status" defaultValue="Draft" className={fieldClass}>{["Draft", "Review", "Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      <BulkToolbar resource="market" ids={markets.map((market) => market.id)} statuses={["Active", "Paused", "Review"]} label={common("misc.selected", { count: markets.length })} actionLabel={common("actions.bulkUpdate")} />
      <DataTable columns={[t("columns.market"), t("columns.region"), t("columns.currency"), t("columns.language"), t("columns.status"), t("columns.action")]} rows={markets.map((market) => [
        <strong key="name">{market.name}</strong>,
        market.region,
        market.currency,
        market.language,
        <StatusBadge key="status" value={market.status} label={translateStatus(statusT, market.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="market" /><input type="hidden" name="id" value={market.id} /><input name="name" defaultValue={market.name} className={fieldClass} /><input name="region" defaultValue={market.region} className={fieldClass} /><input name="currency" defaultValue={market.currency} className={fieldClass} /><input name="language" defaultValue={market.language} className={fieldClass} /><select name="status" defaultValue={market.status} className={fieldClass}>{["Draft", "Review", "Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="market" id={market.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
    </div>
  );
}
