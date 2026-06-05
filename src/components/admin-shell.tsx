import Link from "next/link";
import { BadgeDollarSign, BarChart3, Globe2, LayoutDashboard, Package, ReceiptText, Store, Truck, Users, WandSparkles, Plug, Warehouse } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { logout } from "@/lib/actions";
import { LanguageSwitcher } from "@/components/language-switcher";

const nav = [
  { href: "/admin/dashboard", labelKey: "home", icon: LayoutDashboard },
  { href: "/admin/orders", labelKey: "orders", icon: ReceiptText },
  { href: "/admin/products", labelKey: "products", icon: Package },
  { href: "/admin/customers", labelKey: "customers", icon: Users },
  { href: "/admin/finance", labelKey: "finance", icon: BadgeDollarSign },
  { href: "/admin/inventory", labelKey: "inventory", icon: Warehouse },
  { href: "/admin/shipping", labelKey: "shipping", icon: Truck },
  { href: "/admin/markets", labelKey: "markets", icon: Globe2 },
  { href: "/admin/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/admin/theme", labelKey: "theme", icon: WandSparkles },
  { href: "/admin/apps", labelKey: "apps", icon: Plug },
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("admin");
  const common = await getTranslations("common");

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-[#173326] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-r border-[#274634] bg-[#102f22] p-4 text-white">
        <Link href="/admin/dashboard" className="block px-3 py-2 text-xl font-black">
          Solace Supply
        </Link>
        <nav className="mt-5 grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-white/82 hover:bg-white/10"
              >
                <Icon size={17} />
                {t(`nav.${item.labelKey}`)}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="mt-5 flex items-center gap-3 rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-white/82"
        >
          <Store size={17} />
          {t("shell.storefront")}
        </Link>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#dfe7df] bg-white/90 px-4 backdrop-blur">
          <form action="/admin/orders" className="w-full max-w-xl">
            <input
              name="query"
              placeholder={t("shell.searchPlaceholder")}
              className="h-10 w-full rounded-lg border border-[#d8e0d8] bg-[#f8faf8] px-3 text-sm outline-none focus:border-[#173326]"
            />
          </form>
          <LanguageSwitcher />
          <form action={logout}>
            <button className="rounded-lg border border-[#d8e0d8] px-3 py-2 text-sm font-bold" type="submit">
              {common("actions.logout")}
            </button>
          </form>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
