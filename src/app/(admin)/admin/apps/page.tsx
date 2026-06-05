import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass } from "@/components/admin/resource-actions";
import { createResource, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const { query, status } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const apps = await prisma.appInstallation.findMany({
    where: {
      storeId: store.id,
      ...(status ? { status } : {}),
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{t("apps.eyebrow")}</p>
        <h1 className="text-3xl font-black">{t("apps.title")}</h1>
      </div>
      <CrudDrawer summary={`${common("actions.create")} ${t("apps.title")}`} title={`${common("actions.create")} ${t("apps.title")}`}>
        <form action={createResource} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="resource" value="appInstallation" />
          <input name="appKey" placeholder="app-key" className={fieldClass} required />
          <input name="name" placeholder={t("apps.title")} className={fieldClass} required />
          <input name="category" placeholder={t("columns.category")} className={fieldClass} required />
          <input name="billing" placeholder="Billing" className={fieldClass} required />
          <input name="scopes" placeholder={t("apps.scopes")} className={fieldClass} />
          <select name="status" defaultValue="Available" className={fieldClass}>{["Available", "Installed", "Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      <BulkToolbar resource="appInstallation" ids={apps.map((app) => app.id)} statuses={["Available", "Installed", "Active", "Paused"]} label={common("misc.selected", { count: apps.length })} actionLabel={common("actions.bulkUpdate")} />
      <section className="grid gap-3 md:grid-cols-3">
        {apps.map((app) => (
          <article key={app.id} className="rounded-lg border border-[#dfe7df] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{app.name}</h2>
                <p className="text-sm text-[#647067]">{app.category} · {app.billing}</p>
              </div>
              <StatusBadge value={app.status} label={translateStatus(statusT, app.status)} />
            </div>
            <p className="mt-3 text-sm text-[#647067]">{t("apps.scopes")}: {app.scopes.join(", ")}</p>
            <details className="mt-4">
              <summary className={secondaryButtonClass}>{common("actions.edit")}</summary>
              <form action={updateResource} className="mt-3 grid gap-2">
                <input type="hidden" name="resource" value="appInstallation" />
                <input type="hidden" name="id" value={app.id} />
                <input name="name" defaultValue={app.name} className={fieldClass} />
                <input name="category" defaultValue={app.category} className={fieldClass} />
                <input name="billing" defaultValue={app.billing} className={fieldClass} />
                <input name="scopes" defaultValue={app.scopes.join(", ")} className={fieldClass} />
                <select name="status" defaultValue={app.status} className={fieldClass}>{["Available", "Installed", "Active", "Paused"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}</select>
                <button className={buttonClass}>{common("actions.save")}</button>
              </form>
              <div className="mt-2"><DeleteResourceForm resource="appInstallation" id={app.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
