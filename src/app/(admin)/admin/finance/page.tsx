import { getTranslations } from "next-intl/server";
import { updatePayoutStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [payouts, transactions, chargebacks] = await Promise.all([
    prisma.payout.findMany({ where: { storeId: store.id }, orderBy: { scheduledAt: "asc" } }),
    prisma.transaction.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }),
    prisma.chargeback.findMany({ where: { storeId: store.id }, orderBy: { dueAt: "asc" } }),
  ]);
  const scheduled = payouts.filter((payout) => payout.status !== "Paid").reduce((sum, payout) => sum + Number(payout.amount), 0);
  const fees = transactions.reduce((sum, transaction) => sum + Number(transaction.fee), 0);

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("finance.eyebrow")}</p><h1 className="text-3xl font-black">{t("finance.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={t("finance.scheduledPayouts")} value={money(scheduled)} detail={t("finance.scheduledDetail")} />
        <MetricCard label={t("finance.transactions")} value={String(transactions.length)} detail={t("finance.transactionsDetail")} />
        <MetricCard label={t("finance.fees")} value={money(fees)} detail={t("finance.feesDetail")} />
        <MetricCard label={t("finance.chargebacks")} value={String(chargebacks.length)} detail={t("finance.chargebacksDetail")} />
      </div>
      <DataTable columns={[t("columns.payout"), t("columns.amount"), t("columns.method"), t("columns.scheduled"), t("columns.status"), t("columns.action")]} rows={payouts.map((payout) => [
        <strong key="ref">{payout.reference}</strong>,
        money(payout.amount),
        payout.method,
        shortDate(payout.scheduledAt),
        <StatusBadge key="status" value={payout.status} label={translateStatus(statusT, payout.status)} />,
        <form key="form" action={updatePayoutStatus} className="flex gap-2"><input type="hidden" name="id" value={payout.id} /><input type="hidden" name="status" value={payout.status === "Paid" ? "Scheduled" : "Paid"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{payout.status === "Paid" ? common("actions.reopen") : common("actions.markPaid")}</button></form>,
      ])} />
      <DataTable columns={[t("columns.chargeback"), t("columns.customer"), t("columns.amount"), t("columns.reason"), t("columns.due"), t("columns.status")]} rows={chargebacks.map((chargeback) => [
        <strong key="case">{chargeback.caseNumber}</strong>,
        chargeback.customer,
        money(chargeback.amount),
        chargeback.reason,
        shortDate(chargeback.dueAt),
        <StatusBadge key="status" value={chargeback.status} label={translateStatus(statusT, chargeback.status)} />,
      ])} />
    </div>
  );
}
