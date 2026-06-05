import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { login } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const missingConfig = error === "supabase-env";
  const t = await getTranslations("auth");

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f4] p-4">
      <section className="w-full max-w-md rounded-lg border border-[#dfe7df] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#647067]">{t("adminAccess")}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-3xl font-black text-[#173326]">{t("title")}</h1>
        <p className="mt-2 text-sm leading-6 text-[#647067]">
          {t("lede")}
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
            {missingConfig ? t("missingSupabase") : error}
          </div>
        ) : null}
        <form action={login} className="mt-5 grid gap-3">
          <input name="email" type="email" defaultValue="admin@solacesupply.test" placeholder={t("emailPlaceholder")} className="h-11 rounded-lg border border-[#d8e0d8] px-3" required />
          <input name="password" type="password" placeholder={t("passwordPlaceholder")} className="h-11 rounded-lg border border-[#d8e0d8] px-3" required />
          <button className="h-11 w-full rounded-lg bg-[#173326] text-sm font-black text-white" type="submit">
            {t("signIn")}
          </button>
        </form>
      </section>
    </main>
  );
}
