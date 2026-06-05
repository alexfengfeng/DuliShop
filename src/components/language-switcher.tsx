import { getLocale, getTranslations } from "next-intl/server";
import { setLocale } from "@/lib/actions";

export async function LanguageSwitcher() {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#d8e0d8] bg-white p-1 text-xs font-black">
      <span className="sr-only">{t("language.label")}</span>
      {(["en", "zh"] as const).map((item) => (
        <form key={item} action={setLocale}>
          <input type="hidden" name="locale" value={item} />
          <button
            type="submit"
            className={`rounded-md px-2 py-1 ${
              locale === item ? "bg-[#173326] text-white" : "text-[#173326] hover:bg-[#edf3ed]"
            }`}
            aria-pressed={locale === item}
          >
            {item === "en" ? t("language.english") : t("language.chinese")}
          </button>
        </form>
      ))}
    </div>
  );
}
