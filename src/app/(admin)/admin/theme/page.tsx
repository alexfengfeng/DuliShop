import { getTranslations } from "next-intl/server";
import { saveTheme } from "@/lib/actions";
import { getHomeTheme, getStore } from "@/lib/data";

export const dynamic = "force-dynamic";

type ThemeSection = {
  id: string;
  title: string;
  copy: string;
  cta: string;
  visible: boolean;
  sortOrder: number;
};

const fallback: ThemeSection[] = [
  { id: "hero", title: "Calm goods for everyday rituals", copy: "Thoughtful storage, soft textures, and desk objects for a slower home.", cta: "Shop the collection", visible: true, sortOrder: 1 },
  { id: "collection", title: "Designed for daily order", copy: "Utility totes, stackable pantry objects, and desk pieces in quiet materials.", cta: "Browse essentials", visible: true, sortOrder: 2 },
  { id: "story", title: "A slower supply cabinet", copy: "Solace Supply creates practical pieces that make small routines feel considered.", cta: "Read our story", visible: true, sortOrder: 3 },
];

export default async function ThemePage() {
  const t = await getTranslations("admin");
  const store = await getStore();
  const theme = await getHomeTheme(store.id);
  const sections = ((theme?.sections ?? fallback) as ThemeSection[]).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <form action={saveTheme} className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">{t("theme.eyebrow")}</p>
          <h1 className="text-3xl font-black">{t("theme.title")}</h1>
        </div>
        <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">{t("theme.save")}</button>
      </div>
      <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-3">
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{section.id}</p>
              <input name={`${section.id}.title`} defaultValue={section.title} className="mt-2 h-10 w-full rounded-lg border border-[#d8e0d8] px-3 font-bold" />
              <textarea name={`${section.id}.copy`} defaultValue={section.copy} className="mt-2 min-h-24 w-full rounded-lg border border-[#d8e0d8] p-3 text-sm" />
              <input name={`${section.id}.cta`} defaultValue={section.cta} className="mt-2 h-10 w-full rounded-lg border border-[#d8e0d8] px-3" />
              <label className="mt-3 flex items-center gap-2 text-sm font-bold"><input name={`${section.id}.visible`} type="checkbox" defaultChecked={section.visible} /> {t("theme.visible")}</label>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[#dfe7df] bg-[#fbfaf6] p-5">
          <p className="mb-3 text-sm font-black text-[#647067]">{t("theme.livePreview")}</p>
          <div className="overflow-hidden rounded-lg border border-[#e6dfd2] bg-white">
            {sections.filter((section) => section.visible).map((section) => (
              <section key={section.id} className="border-b border-[#eee7da] p-6">
                <h2 className="text-3xl font-black text-[#173326]">{section.title}</h2>
                <p className="mt-2 max-w-xl text-[#5f665f]">{section.copy}</p>
                <button className="mt-4 rounded-full border border-[#d8d0c2] px-4 py-2 text-sm font-black" type="button">{section.cta}</button>
              </section>
            ))}
          </div>
        </div>
      </section>
    </form>
  );
}
