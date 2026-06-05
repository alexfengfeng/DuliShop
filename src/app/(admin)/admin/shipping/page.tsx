import { createReturnCase, updateFulfillmentStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const store = await getStore();
  const [fulfillments, labels, returns] = await Promise.all([
    prisma.fulfillment.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.shippingLabel.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.returnCase.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
  ]);
  const exceptions = labels.filter((label) => label.status === "Exception").length;

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">Fulfillment queue, labels, returns, exceptions</p><h1 className="text-3xl font-black">Shipping</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Fulfillment queue" value={String(fulfillments.length)} detail="Open work items" />
        <MetricCard label="Labels" value={String(labels.length)} detail="Purchased labels" />
        <MetricCard label="Returns" value={String(returns.length)} detail="RMA workflow" />
        <MetricCard label="Exceptions" value={String(exceptions)} detail="Carrier attention needed" />
      </div>
      <form action={createReturnCase} className="grid gap-3 rounded-lg border border-[#dfe7df] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <input name="customer" placeholder="Customer" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <input name="reason" placeholder="Return reason" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">Create return</button>
      </form>
      <DataTable columns={["Fulfillment", "Carrier", "Status", "Action"]} rows={fulfillments.map((fulfillment) => [
        <strong key="ref">{fulfillment.reference}</strong>,
        fulfillment.carrier,
        <StatusBadge key="status" value={fulfillment.status} />,
        <form key="form" action={updateFulfillmentStatus} className="flex gap-2"><input type="hidden" name="id" value={fulfillment.id} /><input type="hidden" name="status" value={fulfillment.status === "Fulfilled" ? "Queued" : "Fulfilled"} /><button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black">{fulfillment.status === "Fulfilled" ? "Reopen" : "Fulfill"}</button></form>,
      ])} />
      <DataTable columns={["Return", "Customer", "Reason", "Status"]} rows={returns.map((item) => [
        <strong key="case">{item.caseNumber}</strong>,
        item.customer,
        item.reason,
        <StatusBadge key="status" value={item.status} />,
      ])} />
      <DataTable columns={["Label", "Carrier", "Cost", "Status"]} rows={labels.map((label) => [
        <strong key="label">{label.labelNumber}</strong>,
        label.carrier,
        money(label.cost),
        <StatusBadge key="status" value={label.status} />,
      ])} />
    </div>
  );
}
