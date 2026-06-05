import { updatePayoutStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
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
      <div><p className="text-sm font-bold text-[#647067]">Payouts, transactions, fees, and chargebacks</p><h1 className="text-3xl font-black">Finance</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Scheduled payouts" value={money(scheduled)} detail="Awaiting bank transfer" />
        <MetricCard label="Transactions" value={String(transactions.length)} detail="Captured and posted" />
        <MetricCard label="Fees" value={money(fees)} detail="Payment processing" />
        <MetricCard label="Chargebacks" value={String(chargebacks.length)} detail="Cases requiring action" />
      </div>
      <DataTable columns={["Payout", "Amount", "Method", "Scheduled", "Status", "Action"]} rows={payouts.map((payout) => [
        <strong key="ref">{payout.reference}</strong>,
        money(payout.amount),
        payout.method,
        shortDate(payout.scheduledAt),
        <StatusBadge key="status" value={payout.status} />,
        <form key="form" action={updatePayoutStatus} className="flex gap-2"><input type="hidden" name="id" value={payout.id} /><input type="hidden" name="status" value={payout.status === "Paid" ? "Scheduled" : "Paid"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{payout.status === "Paid" ? "Reopen" : "Mark paid"}</button></form>,
      ])} />
      <DataTable columns={["Chargeback", "Customer", "Amount", "Reason", "Due", "Status"]} rows={chargebacks.map((chargeback) => [
        <strong key="case">{chargeback.caseNumber}</strong>,
        chargeback.customer,
        money(chargeback.amount),
        chargeback.reason,
        shortDate(chargeback.dueAt),
        <StatusBadge key="status" value={chargeback.status} />,
      ])} />
    </div>
  );
}
