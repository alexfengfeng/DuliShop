import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { createResource, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function ShippingPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const [fulfillments, labels, returns, orders] = await Promise.all([
    prisma.fulfillment.findMany({ where: { storeId: store.id, ...(query ? { reference: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { updatedAt: "desc" } }),
    prisma.shippingLabel.findMany({ where: { storeId: store.id, ...(query ? { labelNumber: { contains: query, mode: "insensitive" } } : {}) }, orderBy: { updatedAt: "desc" } }),
    prisma.returnCase.findMany({ where: { storeId: store.id, ...(query ? { OR: [{ caseNumber: { contains: query, mode: "insensitive" } }, { customer: { contains: query, mode: "insensitive" } }] } : {}) }, orderBy: { updatedAt: "desc" } }),
    prisma.order.findMany({ where: { storeId: store.id }, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 50 }),
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
      <section className="grid gap-3 lg:grid-cols-3">
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.fulfillment")}`} title={`${common("actions.create")} ${t("columns.fulfillment")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="fulfillment" />
            <input name="reference" placeholder="FUL" className={fieldClass} />
            <select name="orderId" className={fieldClass} defaultValue=""><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.customer.name}</option>)}</select>
            <input name="carrier" placeholder={t("columns.carrier")} className={fieldClass} defaultValue="UPS" />
            <select name="status" defaultValue="Queued" className={fieldClass}>{["Queued", "Packed", "Fulfilled", "Exception"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.return")}`} title={`${common("actions.create")} ${t("columns.return")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="returnCase" />
            <input name="caseNumber" placeholder="RMA" className={fieldClass} />
            <select name="orderId" className={fieldClass} defaultValue=""><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.customer.name}</option>)}</select>
            <input name="customer" placeholder={t("shipping.customerPlaceholder")} className={fieldClass} required />
            <input name="reason" placeholder={t("shipping.reasonPlaceholder")} className={fieldClass} required />
            <select name="status" defaultValue="Requested" className={fieldClass}>{["Requested", "Approved", "Fulfilled", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
        <CrudDrawer summary={`${common("actions.create")} ${t("columns.label")}`} title={`${common("actions.create")} ${t("columns.label")}`}>
          <form action={createResource} className="grid gap-2">
            <input type="hidden" name="resource" value="shippingLabel" />
            <input name="labelNumber" placeholder="LBL" className={fieldClass} />
            <select name="orderId" className={fieldClass} defaultValue=""><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.customer.name}</option>)}</select>
            <input name="carrier" placeholder={t("columns.carrier")} className={fieldClass} defaultValue="UPS" />
            <input name="cost" type="number" step="0.01" placeholder={t("columns.cost")} className={fieldClass} required />
            <select name="status" defaultValue="Purchased" className={fieldClass}>{["Purchased", "Ready", "Exception", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
            <button className={buttonClass}>{common("actions.create")}</button>
          </form>
        </CrudDrawer>
      </section>
      <BulkToolbar resource="fulfillment" ids={fulfillments.map((item) => item.id)} statuses={["Queued", "Packed", "Fulfilled", "Exception"]} label={common("misc.selected", { count: fulfillments.length })} actionLabel={common("actions.bulkUpdate")} />
      <DataTable caption={t("shipping.fulfillmentQueue")} columns={[t("columns.fulfillment"), t("columns.carrier"), t("columns.status"), t("columns.action")]} rows={fulfillments.map((fulfillment) => [
        <strong key="ref">{fulfillment.reference}</strong>,
        fulfillment.carrier,
        <StatusBadge key="status" value={fulfillment.status} label={translateStatus(statusT, fulfillment.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="fulfillment" /><input type="hidden" name="id" value={fulfillment.id} /><select name="orderId" defaultValue={fulfillment.orderId ?? ""} className={fieldClass}><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select><input name="carrier" defaultValue={fulfillment.carrier} className={fieldClass} /><select name="status" defaultValue={fulfillment.status} className={fieldClass}>{["Queued", "Packed", "Fulfilled", "Exception"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="fulfillment" id={fulfillment.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("shipping.returns")} columns={[t("columns.return"), t("columns.customer"), t("columns.reason"), t("columns.status"), t("columns.action")]} rows={returns.map((item) => [
        <strong key="case">{item.caseNumber}</strong>,
        item.customer,
        item.reason,
        <StatusBadge key="status" value={item.status} label={translateStatus(statusT, item.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="returnCase" /><input type="hidden" name="id" value={item.id} /><select name="orderId" defaultValue={item.orderId ?? ""} className={fieldClass}><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select><input name="customer" defaultValue={item.customer} className={fieldClass} /><input name="reason" defaultValue={item.reason} className={fieldClass} /><select name="status" defaultValue={item.status} className={fieldClass}>{["Requested", "Approved", "Fulfilled", "Cancelled"].map((statusItem) => <option key={statusItem} value={statusItem}>{translateStatus(statusT, statusItem)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="returnCase" id={item.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
      <DataTable caption={t("shipping.labels")} columns={[t("columns.label"), t("columns.carrier"), t("columns.cost"), t("columns.status"), t("columns.action")]} rows={labels.map((label) => [
        <strong key="label">{label.labelNumber}</strong>,
        label.carrier,
        money(label.cost),
        <StatusBadge key="status" value={label.status} label={translateStatus(statusT, label.status)} />,
        <details key="actions"><summary className={secondaryButtonClass}>{common("actions.edit")}</summary><form action={updateResource} className="mt-2 grid gap-2"><input type="hidden" name="resource" value="shippingLabel" /><input type="hidden" name="id" value={label.id} /><select name="orderId" defaultValue={label.orderId ?? ""} className={fieldClass}><option value="">{common("misc.unassigned")}</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select><input name="carrier" defaultValue={label.carrier} className={fieldClass} /><input name="cost" type="number" step="0.01" defaultValue={Number(label.cost)} className={fieldClass} /><select name="status" defaultValue={label.status} className={fieldClass}>{["Purchased", "Ready", "Exception", "Cancelled"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select><button className={buttonClass}>{common("actions.save")}</button></form><div className="mt-2"><DeleteResourceForm resource="shippingLabel" id={label.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div></details>,
      ])} />
    </div>
  );
}
