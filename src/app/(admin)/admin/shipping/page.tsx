import { getTranslations } from "next-intl/server";
import { createReturnCase, updateFulfillmentStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [fulfillments, labels, returns] = await Promise.all([
    prisma.fulfillment.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.shippingLabel.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.returnCase.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
  ]);
  const exceptions = labels.filter((label) => label.status === "Exception").length;

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("shipping.eyebrow")}</p><h1 className="text-3xl font-black">{t("shipping.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={t("shipping.fulfillmentQueue")} value={String(fulfillments.length)} detail={t("shipping.fulfillmentDetail")} />
        <MetricCard label={t("shipping.labels")} value={String(labels.length)} detail={t("shipping.labelsDetail")} />
        <MetricCard label={t("shipping.returns")} value={String(returns.length)} detail={t("shipping.returnsDetail")} />
        <MetricCard label={t("shipping.exceptions")} value={String(exceptions)} detail={t("shipping.exceptionsDetail")} />
      </div>
      <form action={createReturnCase} className="grid gap-3 rounded-lg border border-[#dfe7df] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <input name="customer" placeholder={t("shipping.customerPlaceholder")} className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <input name="reason" placeholder={t("shipping.reasonPlaceholder")} className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">{t("shipping.createReturn")}</button>
      </form>
      <DataTable columns={[t("columns.fulfillment"), t("columns.carrier"), t("columns.status"), t("columns.action")]} rows={fulfillments.map((fulfillment) => [
        <strong key="ref">{fulfillment.reference}</strong>,
        fulfillment.carrier,
        <StatusBadge key="status" value={fulfillment.status} label={translateStatus(statusT, fulfillment.status)} />,
        <form key="form" action={updateFulfillmentStatus} className="flex gap-2"><input type="hidden" name="id" value={fulfillment.id} /><input type="hidden" name="status" value={fulfillment.status === "Fulfilled" ? "Queued" : "Fulfilled"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{fulfillment.status === "Fulfilled" ? common("actions.reopen") : common("actions.fulfill")}</button></form>,
      ])} />
      <DataTable columns={[t("columns.return"), t("columns.customer"), t("columns.reason"), t("columns.status")]} rows={returns.map((item) => [
        <strong key="case">{item.caseNumber}</strong>,
        item.customer,
        item.reason,
        <StatusBadge key="status" value={item.status} label={translateStatus(statusT, item.status)} />,
      ])} />
      <DataTable columns={[t("columns.label"), t("columns.carrier"), t("columns.cost"), t("columns.status")]} rows={labels.map((label) => [
        <strong key="label">{label.labelNumber}</strong>,
        label.carrier,
        money(label.cost),
        <StatusBadge key="status" value={label.status} label={translateStatus(statusT, label.status)} />,
      ])} />
    </div>
  );
}
