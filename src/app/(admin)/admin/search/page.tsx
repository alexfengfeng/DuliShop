import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminSearch } from "@/lib/data";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { translateStatus } from "@/lib/i18n-utils";

export const dynamic = "force-dynamic";

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#dfe7df] bg-white p-4">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function ResultLink({ href, title, detail }: { href: string; title: string; detail: React.ReactNode }) {
  return (
    <Link className="flex items-center justify-between gap-3 rounded-lg bg-[#f8faf8] p-3 text-sm hover:bg-[#edf5ed]" href={href}>
      <strong>{title}</strong>
      <span className="text-[#647067]">{detail}</span>
    </Link>
  );
}

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query = "" } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const results = await adminSearch(query);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-[#647067]">{common("misc.searchFor", { query })}</p>
        <h1 className="text-3xl font-black">{common("actions.search")}</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ResultSection title={t("nav.orders")}>
          {results.orders.map((order) => <ResultLink key={order.id} href={`/admin/orders?query=${order.orderNumber}`} title={order.orderNumber} detail={`${order.customer.name} · ${money(order.total)}`} />)}
        </ResultSection>
        <ResultSection title={t("nav.products")}>
          {results.products.map((product) => <ResultLink key={product.id} href={`/admin/products?query=${product.title}`} title={product.title} detail={product.category} />)}
        </ResultSection>
        <ResultSection title={t("nav.customers")}>
          {results.customers.map((customer) => <ResultLink key={customer.id} href={`/admin/customers?query=${customer.email}`} title={customer.name} detail={customer.email} />)}
        </ResultSection>
        <ResultSection title={t("nav.finance")}>
          {[...results.payouts.map((item) => ({ id: item.id, title: item.reference, detail: item.status })), ...results.transactions.map((item) => ({ id: item.id, title: item.reference, detail: item.status })), ...results.chargebacks.map((item) => ({ id: item.id, title: item.caseNumber, detail: item.status }))].map((item) => <ResultLink key={item.id} href={`/admin/finance?query=${item.title}`} title={item.title} detail={<StatusBadge value={item.detail} label={translateStatus(statusT, item.detail)} />} />)}
        </ResultSection>
        <ResultSection title={t("nav.inventory")}>
          {[...results.suppliers.map((item) => ({ id: item.id, title: item.name, detail: item.status })), ...results.purchaseOrders.map((item) => ({ id: item.id, title: item.reference, detail: item.status })), ...results.transfers.map((item) => ({ id: item.id, title: item.reference, detail: item.status }))].map((item) => <ResultLink key={item.id} href={`/admin/inventory?query=${item.title}`} title={item.title} detail={<StatusBadge value={item.detail} label={translateStatus(statusT, item.detail)} />} />)}
        </ResultSection>
        <ResultSection title={t("nav.shipping")}>
          {[...results.fulfillments.map((item) => ({ id: item.id, title: item.reference, detail: item.status })), ...results.returnCases.map((item) => ({ id: item.id, title: item.caseNumber, detail: item.status })), ...results.shippingLabels.map((item) => ({ id: item.id, title: item.labelNumber, detail: item.status }))].map((item) => <ResultLink key={item.id} href={`/admin/shipping?query=${item.title}`} title={item.title} detail={<StatusBadge value={item.detail} label={translateStatus(statusT, item.detail)} />} />)}
        </ResultSection>
        <ResultSection title={t("nav.markets")}>
          {results.markets.map((market) => <ResultLink key={market.id} href={`/admin/markets?query=${market.name}`} title={market.name} detail={market.region} />)}
        </ResultSection>
        <ResultSection title={t("nav.reports")}>
          {results.reports.map((report) => <ResultLink key={report.id} href={`/admin/reports?query=${report.name}`} title={report.name} detail={report.kind} />)}
        </ResultSection>
        <ResultSection title={t("nav.apps")}>
          {results.apps.map((app) => <ResultLink key={app.id} href={`/admin/apps?query=${app.name}`} title={app.name} detail={app.category} />)}
        </ResultSection>
      </div>
    </div>
  );
}
