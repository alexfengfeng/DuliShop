import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { createResource, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const { query, status } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [payouts, transactions, chargebacks] = await Promise.all([
    prisma.payout.findMany({ where: { storeId: store.id, ...(status ? { status } : {}), ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { scheduledAt: "asc" } }),
    prisma.transaction.findMany({ where: { storeId: store.id, ...(status ? { status } : {}), ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { createdAt: "desc" } }),
    prisma.chargeback.findMany({ where: { storeId: store.id, ...(status ? { status } : {}), ...(query ? { OR: [{ caseNumber: { contains: query, mode: "insensitive" } }, { customer: { contains: query, mode: "insensitive" } }] } : {}) }, orderBy: { dueAt: "asc" } }),
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
      <section className="grid gap-3 lg:grid-cols-3">
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.payout")}`} title={`${common("actions.create")} ${t("columns.payout")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="payout" />
            <input name="reference" placeholder={t("columns.payout")} className={fieldClass} />
            <input name="amount" type="number" step="0.01" placeholder={t("columns.amount")} className={fieldClass} required />
            <input name="method" placeholder={t("columns.method")} className={fieldClass} defaultValue="Bank transfer" />
            <input name="scheduledAt" type="date" className={fieldClass} required />
            <select name="status" defaultValue="Scheduled" className={fieldClass}>{["Scheduled", "Paid"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("finance.transactions")}`} title={`${common("actions.create")} ${t("finance.transactions")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="transaction" />
            <input name="reference" placeholder="TXN" className={fieldClass} />
            <input name="kind" placeholder={t("columns.kind")} className={fieldClass} defaultValue="Online payment" />
            <input name="amount" type="number" step="0.01" placeholder={t("columns.amount")} className={fieldClass} required />
            <input name="fee" type="number" step="0.01" placeholder={t("finance.fees")} className={fieldClass} defaultValue="0" />
            <select name="status" defaultValue="Captured" className={fieldClass}>{["Captured", "Posted", "Pending"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.chargeback")}`} title={`${common("actions.create")} ${t("columns.chargeback")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="chargeback" />
            <input name="caseNumber" placeholder={t("columns.chargeback")} className={fieldClass} />
            <input name="customer" placeholder={t("columns.customer")} className={fieldClass} required />
            <input name="amount" type="number" step="0.01" placeholder={t("columns.amount")} className={fieldClass} required />
            <input name="reason" placeholder={t("columns.reason")} className={fieldClass} required />
            <input name="dueAt" type="date" className={fieldClass} required />
            <select name="status" defaultValue="Open" className={fieldClass}>{["Open", "Needs evidence", "Approved", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
      </section>
      <DataTable caption={t("finance.scheduledPayouts")} columns={[t("columns.payout"), t("columns.amount"), t("columns.method"), t("columns.scheduled"), t("columns.status"), t("columns.action")]} rows={payouts.map((payout) => [
        <strong key="ref">{payout.reference}</strong>,
        money(payout.amount),
        payout.method,
        shortDate(payout.scheduledAt),
        <StatusBadge key="status" value={payout.status} label={translateStatus(statusT, payout.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="payout" /><input type="hidden" name="id" value={payout.id} /><input name="amount" type="number" step="0.01" defaultValue={Number(payout.amount)} className={fieldClass} /><input name="method" defaultValue={payout.method} className={fieldClass} /><input name="scheduledAt" type="date" defaultValue={payout.scheduledAt.toISOString().slice(0, 10)} className={fieldClass} /><select name="status" defaultValue={payout.status} className={fieldClass}>{["Scheduled", "Paid"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="payout" id={payout.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("finance.transactions")} columns={[t("columns.report"), t("columns.kind"), t("columns.amount"), t("finance.fees"), t("columns.status"), t("columns.action")]} rows={transactions.map((transaction) => [
        <strong key="ref">{transaction.reference}</strong>,
        transaction.kind,
        money(transaction.amount),
        money(transaction.fee),
        <StatusBadge key="status" value={transaction.status} label={translateStatus(statusT, transaction.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="transaction" /><input type="hidden" name="id" value={transaction.id} /><input name="kind" defaultValue={transaction.kind} className={fieldClass} /><input name="amount" type="number" step="0.01" defaultValue={Number(transaction.amount)} className={fieldClass} /><input name="fee" type="number" step="0.01" defaultValue={Number(transaction.fee)} className={fieldClass} /><select name="status" defaultValue={transaction.status} className={fieldClass}>{["Captured", "Posted", "Pending"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="transaction" id={transaction.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("finance.chargebacks")} columns={[t("columns.chargeback"), t("columns.customer"), t("columns.amount"), t("columns.reason"), t("columns.due"), t("columns.status"), t("columns.action")]} rows={chargebacks.map((chargeback) => [
        <strong key="case">{chargeback.caseNumber}</strong>,
        chargeback.customer,
        money(chargeback.amount),
        chargeback.reason,
        shortDate(chargeback.dueAt),
        <StatusBadge key="status" value={chargeback.status} label={translateStatus(statusT, chargeback.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="chargeback" /><input type="hidden" name="id" value={chargeback.id} /><input name="customer" defaultValue={chargeback.customer} className={fieldClass} /><input name="amount" type="number" step="0.01" defaultValue={Number(chargeback.amount)} className={fieldClass} /><input name="reason" defaultValue={chargeback.reason} className={fieldClass} /><input name="dueAt" type="date" defaultValue={chargeback.dueAt.toISOString().slice(0, 10)} className={fieldClass} /><select name="status" defaultValue={chargeback.status} className={fieldClass}>{["Open", "Needs evidence", "Approved", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="chargeback" id={chargeback.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
    </div>
  );
}
