import { getTranslations } from "next-intl/server";
import { updateAppStatus } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const apps = await prisma.appInstallation.findMany({
    where: { storeId: store.id },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{t("apps.eyebrow")}</p>
        <h1 className="text-3xl font-black">{t("apps.title")}</h1>
      </div>
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
            <form action={updateAppStatus} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={app.id} />
              <input type="hidden" name="status" value={app.status === "Installed" ? "Available" : "Installed"} />
              <button className="rounded-lg bg-[#173326] px-3 py-2 text-sm font-black text-white">
                {app.status === "Installed" ? common("actions.uninstall") : common("actions.install")}
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
