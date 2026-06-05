import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { adjustVariantInventory, createResource, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [variants, purchaseOrders, transfers, movements, suppliers] = await Promise.all([
    prisma.productVariant.findMany({ where: query ? { OR: [{ sku: { contains: query, mode: "insensitive" } }, { product: { title: { contains: query, mode: "insensitive" } } }] } : {}, include: { product: true }, orderBy: { inventory: "asc" }, take: 30 }),
    prisma.purchaseOrder.findMany({ where: { storeId: store.id, ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, include: { supplier: true }, orderBy: { expectedAt: "asc" } }),
    prisma.transfer.findMany({ where: { storeId: store.id, ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { updatedAt: "desc" } }),
    prisma.inventoryMovement.findMany({ where: { storeId: store.id, ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { createdAt: "desc" } }),
    prisma.supplier.findMany({ where: { storeId: store.id, ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { name: "asc" } }),
  ]);
  const lowStock = variants.filter((variant) => variant.inventory < 10).length;
  const incoming = variants.reduce((sum, variant) => sum + variant.incomingInventory, 0);

  return (
    <div className="grid gap-5">
      <div><p className="text-sm font-bold text-[#647067]">{t("inventory.eyebrow")}</p><h1 className="text-3xl font-black">{t("inventory.title")}</h1></div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={t("inventory.lowStock")} value={String(lowStock)} detail={t("inventory.lowStockDetail")} />
        <MetricCard label={t("inventory.incomingUnits")} value={String(incoming)} detail={t("inventory.incomingDetail")} />
        <MetricCard label={t("inventory.transfers")} value={String(transfers.length)} detail={t("inventory.transfersDetail")} />
        <MetricCard label={t("inventory.movements")} value={String(movements.length)} detail={t("inventory.movementsDetail")} />
      </div>
      <section className="grid gap-3 lg:grid-cols-4">
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.supplier")}`} title={`${common("actions.create")} ${t("columns.supplier")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="supplier" />
            <input name="name" placeholder={t("columns.supplier")} className={fieldClass} required />
            <input name="contact" placeholder={t("columns.email")} className={fieldClass} required />
            <select name="status" className={fieldClass} defaultValue="Active">{["Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={t("inventory.createPo")} title={t("inventory.createPo")}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="purchaseOrder" />
            <input name="reference" placeholder={t("columns.po")} className={fieldClass} />
            <select name="supplierId" className={fieldClass} defaultValue=""><option value="">{common("misc.unassigned")}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
            <input name="expectedAt" type="date" className={fieldClass} required />
            <input name="amount" type="number" step="0.01" placeholder={t("inventory.poAmount")} className={fieldClass} required />
            <select name="status" className={fieldClass} defaultValue="Ordered">{["Ordered", "Partially received", "Posted", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("inventory.transfers")}`} title={`${common("actions.create")} ${t("inventory.transfers")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="transfer" />
            <input name="reference" placeholder="TR" className={fieldClass} />
            <input name="fromLocation" placeholder="From" className={fieldClass} required />
            <input name="toLocation" placeholder="To" className={fieldClass} required />
            <input name="units" type="number" placeholder={t("inventory.incomingUnits")} className={fieldClass} required />
            <select name="status" defaultValue="In transit" className={fieldClass}>{["In transit", "Ready", "Posted", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("inventory.movements")}`} title={`${common("actions.create")} ${t("inventory.movements")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="inventoryMovement" />
            <input name="reference" placeholder="MOV" className={fieldClass} />
            <select name="variantId" className={fieldClass} defaultValue=""><option value="">{common("misc.unassigned")}</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.sku}</option>)}</select>
            <input name="kind" placeholder={t("columns.kind")} className={fieldClass} defaultValue="Adjustment" />
            <input name="location" placeholder="Location" className={fieldClass} defaultValue="Warehouse" />
            <input name="quantity" type="number" className={fieldClass} defaultValue="1" />
            <select name="status" defaultValue="Posted" className={fieldClass}>{["Posted", "Review"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
      </section>
      <BulkToolbar resource="purchaseOrder" ids={purchaseOrders.map((po) => po.id)} statuses={["Ordered", "Partially received", "Posted", "Cancelled"]} label={common("misc.selected", { count: purchaseOrders.length })} actionLabel={common("actions.bulkUpdate")} />
      <DataTable caption={t("products.title")} columns={[t("columns.sku"), t("columns.product"), t("columns.onHand"), t("columns.reserved"), t("columns.incoming"), t("columns.status"), t("columns.action")]} rows={variants.map((variant) => [
        <strong key="sku">{variant.sku}</strong>,
        variant.product.title,
        variant.inventory,
        variant.reservedInventory,
        variant.incomingInventory,
        <StatusBadge key="status" value={variant.inventory < 10 ? "Review" : variant.status} label={translateStatus(statusT, variant.inventory < 10 ? "Review" : variant.status)} />,
        <form key="adjust" action={adjustVariantInventory} className="flex gap-2"><input type="hidden" name="variantId" value={variant.id} /><input name="quantity" type="number" defaultValue="1" className="h-9 w-20 rounded-lg border border-[#d8e0d8] px-2" /><input type="hidden" name="location" value="Warehouse" /><input type="hidden" name="kind" value="Adjustment" /><button className={secondaryButtonClass}>{common("actions.adjustInventory")}</button></form>,
      ])} />
      <DataTable caption={t("columns.supplier")} columns={[t("columns.supplier"), t("columns.email"), t("columns.status"), t("columns.action")]} rows={suppliers.map((supplier) => [
        <strong key="name">{supplier.name}</strong>,
        supplier.contact,
        <StatusBadge key="status" value={supplier.status} label={translateStatus(statusT, supplier.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="supplier" /><input type="hidden" name="id" value={supplier.id} /><input name="name" defaultValue={supplier.name} className={fieldClass} /><input name="contact" defaultValue={supplier.contact} className={fieldClass} /><select name="status" defaultValue={supplier.status} className={fieldClass}>{["Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="supplier" id={supplier.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("inventory.createPo")} columns={[t("columns.po"), t("columns.supplier"), t("columns.expected"), t("columns.amount"), t("columns.status"), t("columns.action")]} rows={purchaseOrders.map((po) => [
        <strong key="ref">{po.reference}</strong>,
        po.supplier?.name ?? common("misc.unassigned"),
        shortDate(po.expectedAt),
        money(po.amount),
        <StatusBadge key="status" value={po.status} label={translateStatus(statusT, po.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="purchaseOrder" /><input type="hidden" name="id" value={po.id} /><select name="supplierId" defaultValue={po.supplierId ?? ""} className={fieldClass}><option value="">{common("misc.unassigned")}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><input name="expectedAt" type="date" defaultValue={po.expectedAt.toISOString().slice(0, 10)} className={fieldClass} /><input name="amount" type="number" step="0.01" defaultValue={Number(po.amount)} className={fieldClass} /><select name="status" defaultValue={po.status} className={fieldClass}>{["Ordered", "Partially received", "Posted", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="purchaseOrder" id={po.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("inventory.transfers")} columns={["TR", "From", "To", t("inventory.incomingUnits"), t("columns.status"), t("columns.action")]} rows={transfers.map((transfer) => [
        <strong key="ref">{transfer.reference}</strong>,
        transfer.fromLocation,
        transfer.toLocation,
        transfer.units,
        <StatusBadge key="status" value={transfer.status} label={translateStatus(statusT, transfer.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="transfer" /><input type="hidden" name="id" value={transfer.id} /><input name="fromLocation" defaultValue={transfer.fromLocation} className={fieldClass} /><input name="toLocation" defaultValue={transfer.toLocation} className={fieldClass} /><input name="units" type="number" defaultValue={transfer.units} className={fieldClass} /><select name="status" defaultValue={transfer.status} className={fieldClass}>{["In transit", "Ready", "Posted", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="transfer" id={transfer.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("inventory.movements")} columns={["MOV", t("columns.kind"), "Location", "Qty", t("columns.status"), t("columns.action")]} rows={movements.map((movement) => [
        <strong key="ref">{movement.reference}</strong>,
        movement.kind,
        movement.location,
        movement.quantity,
        <StatusBadge key="status" value={movement.status} label={translateStatus(statusT, movement.status)} />,
        <DeleteResourceForm key="delete" resource="inventoryMovement" id={movement.id} label={common("actions.delete")} message={common("misc.confirmDelete")} />,
      ])} />
    </div>
  );
}
