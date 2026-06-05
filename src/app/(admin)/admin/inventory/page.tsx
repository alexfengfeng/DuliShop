import { createPurchaseOrder } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const store = await getStore();
  const [variants, purchaseOrders, transfers, movements] = await Promise.all([
    prisma.productVariant.findMany({ include: { product: true }, orderBy: { inventory: "asc" }, take: 12 }),
    prisma.purchaseOrder.findMany({ where: { storeId: store.id }, include: { supplier: true }, orderBy: { expectedAt: "asc" } }),
    prisma.transfer.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } }),
    prisma.inventoryMovement.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const lowStock = variants.filter((variant) => variant.inventory < 10).length;
  const incoming = variants.reduce((sum, variant) => sum + variant.incomingInventory, 0);

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">Stock levels, purchase orders, transfers, suppliers</p><h1 className="text-3xl font-black">Inventory</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Low stock SKUs" value={String(lowStock)} detail="Inventory below threshold" />
        <MetricCard label="Incoming units" value={String(incoming)} detail="On purchase orders" />
        <MetricCard label="Transfers" value={String(transfers.length)} detail="Between locations" />
        <MetricCard label="Movements" value={String(movements.length)} detail="Receipts and adjustments" />
      </div>
      <form action={createPurchaseOrder} className="grid gap-3 rounded-lg border border-[#dfe7df] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <input name="expectedAt" type="date" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <input name="amount" type="number" min="1" placeholder="Purchase order amount" className="h-10 rounded-lg border border-[#d8e0d8] px-3" required />
        <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">Create PO</button>
      </form>
      <DataTable columns={["SKU", "Product", "On hand", "Reserved", "Incoming", "Status"]} rows={variants.map((variant) => [
        <strong key="sku">{variant.sku}</strong>,
        variant.product.title,
        variant.inventory,
        variant.reservedInventory,
        variant.incomingInventory,
        <StatusBadge key="status" value={variant.inventory < 10 ? "Review" : variant.status} />,
      ])} />
      <DataTable columns={["PO", "Supplier", "Expected", "Amount", "Status"]} rows={purchaseOrders.map((po) => [
        <strong key="ref">{po.reference}</strong>,
        po.supplier?.name ?? "Unassigned",
        shortDate(po.expectedAt),
        money(po.amount),
        <StatusBadge key="status" value={po.status} />,
      ])} />
    </div>
  );
}
