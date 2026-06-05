import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { createResource, updateResource } from "@/lib/actions";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const { query, status } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const customers = await prisma.customer.findMany({
    where: {
      storeId: store.id,
      ...(status ? { status } : {}),
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: { orders: true },
    orderBy: { updatedAt: "desc" },
  });
  const vip = customers.filter((customer) => customer.status === "VIP").length;
  const ltv = customers.reduce((sum, customer) => sum + Number(customer.ltv), 0);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">{t("customers.eyebrow")}</p>
          <h1 className="text-3xl font-black">{t("customers.title")}</h1>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label={t("customers.title")} value={String(customers.length)} detail={t("customers.knownProfiles")} />
        <MetricCard label={t("customers.vipSegment")} value={String(vip)} detail={t("customers.vipDetail")} />
        <MetricCard label={t("customers.totalLtv")} value={money(ltv)} detail={t("customers.ltvDetail")} />
      </div>
      <CrudDrawer summary={`${common("actions.create")} ${t("customers.title")}`} title={`${common("actions.create")} ${t("customers.title")}`}>
        <form action={createResource} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="resource" value="customer" />
          <input name="name" placeholder={t("columns.customer")} className={fieldClass} required />
          <input name="email" type="email" placeholder={t("columns.email")} className={fieldClass} required />
          <input name="tags" placeholder={t("columns.tags")} className={fieldClass} />
          <select name="status" className={fieldClass} defaultValue="New">
            {["New", "VIP", "At risk", "Returning"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
          </select>
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      <BulkToolbar resource="customer" ids={customers.map((customer) => customer.id)} statuses={["VIP", "At risk", "Returning", "Archived"]} label={common("misc.selected", { count: customers.length })} actionLabel={common("actions.bulkUpdate")} />
      <section className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]"><tr><th className="py-2">{t("columns.customer")}</th><th>{t("columns.email")}</th><th>{t("columns.tags")}</th><th>{t("columns.ltv")}</th><th>{t("columns.orders")}</th><th>{t("columns.status")}</th><th>{t("columns.action")}</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#edf1ed] align-top">
                  <td className="py-3 font-black">{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.tags.join(", ")}</td>
                  <td>{money(customer.ltv)}</td>
                  <td>{customer.orders.length}</td>
                  <td><StatusBadge value={customer.status} label={translateStatus(statusT, customer.status)} /></td>
                  <td>
                    <details>
                      <summary className={secondaryButtonClass}>{common("actions.edit")}</summary>
                      <form action={updateResource} className="mt-3 grid min-w-[280px] gap-2">
                        <input type="hidden" name="resource" value="customer" />
                        <input type="hidden" name="id" value={customer.id} />
                        <input name="name" defaultValue={customer.name} className={fieldClass} />
                        <input name="email" defaultValue={customer.email} className={fieldClass} />
                        <input name="tags" defaultValue={customer.tags.join(", ")} className={fieldClass} />
                        <select name="status" defaultValue={customer.status} className={fieldClass}>
                          {["New", "VIP", "At risk", "Returning", "Archived"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                        </select>
                        <button className={buttonClass}>{common("actions.saveChanges")}</button>
                      </form>
                      <div className="mt-2"><DeleteResourceForm resource="customer" id={customer.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
