import { getTranslations } from "next-intl/server";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const t = await getTranslations("admin");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    include: { orders: true },
    orderBy: { updatedAt: "desc" },
  });
  const vip = customers.filter((customer) => customer.status === "VIP").length;
  const ltv = customers.reduce((sum, customer) => sum + Number(customer.ltv), 0);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{t("customers.eyebrow")}</p>
        <h1 className="text-3xl font-black">{t("customers.title")}</h1>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label={t("customers.title")} value={String(customers.length)} detail={t("customers.knownProfiles")} />
        <MetricCard label={t("customers.vipSegment")} value={String(vip)} detail={t("customers.vipDetail")} />
        <MetricCard label={t("customers.totalLtv")} value={money(ltv)} detail={t("customers.ltvDetail")} />
      </div>
      <section className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]"><tr><th className="py-2">{t("columns.customer")}</th><th>{t("columns.email")}</th><th>{t("columns.tags")}</th><th>{t("columns.ltv")}</th><th>{t("columns.orders")}</th><th>{t("columns.status")}</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#edf1ed]">
                  <td className="py-3 font-black">{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.tags.join(", ")}</td>
                  <td>{money(customer.ltv)}</td>
                  <td>{customer.orders.length}</td>
                  <td><StatusBadge value={customer.status} label={translateStatus(statusT, customer.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
