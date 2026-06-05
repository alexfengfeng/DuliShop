import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale, localeCookieName } from "@/i18n/routing";

async function loadMessages(locale: "en" | "zh") {
  const [common, auth, admin, commerce, status] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/admin.json`),
    import(`../messages/${locale}/commerce.json`),
    import(`../messages/${locale}/status.json`),
  ]);

  return {
    common: common.default,
    auth: auth.default,
    admin: admin.default,
    commerce: commerce.default,
    status: status.default,
  };
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeValue = cookieStore.get(localeCookieName)?.value;
  const locale = isAppLocale(localeValue) ? localeValue : defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
