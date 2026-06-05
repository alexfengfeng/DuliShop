import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { buttonClass, fieldClass, textareaClass } from "@/components/admin/resource-actions";
import { clearThemeSectionImage, createThemeSection, generateThemeSectionImage, saveTheme } from "@/lib/actions";
import { getHomeTheme, getStore } from "@/lib/data";

export const dynamic = "force-dynamic";

type ThemeSection = {
  id: string;
  title: string;
  copy: string;
  cta: string;
  visible: boolean;
  sortOrder: number;
  type?: string;
  layout?: string;
  imagePosition?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
};

const fallback: ThemeSection[] = [
  { id: "hero", title: "Calm goods for everyday rituals", copy: "Thoughtful storage, soft textures, and desk objects for a slower home.", cta: "Shop the collection", visible: true, sortOrder: 1, type: "Hero", layout: "Editorial split", imagePosition: "Right" },
  { id: "collection", title: "Designed for daily order", copy: "Utility totes, stackable pantry objects, and desk pieces in quiet materials.", cta: "Browse essentials", visible: true, sortOrder: 2, type: "Collection feature", layout: "Image band", imagePosition: "Left" },
  { id: "story", title: "A slower supply cabinet", copy: "Solace Supply creates practical pieces that make small routines feel considered.", cta: "Read our story", visible: true, sortOrder: 3, type: "Story", layout: "Text first", imagePosition: "Right" },
];

export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string; preview?: string }>;
}) {
  const { image, preview } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const store = await getStore();
  const theme = await getHomeTheme(store.id);
  const sections = ((theme?.sections ?? fallback) as ThemeSection[]).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">{t("theme.eyebrow")}</p>
          <h1 className="text-3xl font-black">{t("theme.title")}</h1>
        </div>
      </div>
      {image === "missing-config" ? (
        <div className="rounded-lg border border-[#ead7a4] bg-[#fff8df] p-4 text-sm font-bold text-[#6f5620]">
          {t("theme.imageConfigMissing")}
        </div>
      ) : null}
      <CrudDrawer summary={`${common("actions.create")} section`} title={`${common("actions.create")} section`}>
        <form action={createThemeSection} className="grid gap-3 md:grid-cols-4">
          <input name="title" placeholder={t("columns.report")} className={fieldClass} required />
          <input name="cta" placeholder="CTA" className={fieldClass} defaultValue="Shop now" />
          <select name="type" className={fieldClass} defaultValue="Banner">
            {["Hero", "Collection feature", "Story", "Product spotlight", "Banner"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select name="layout" className={fieldClass} defaultValue="Editorial split">
            {["Editorial split", "Image band", "Text first", "Product grid"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <textarea name="copy" placeholder="Copy" className={`${textareaClass} md:col-span-2`} />
          <textarea name="imagePrompt" placeholder={t("theme.imagePrompt")} className={`${textareaClass} md:col-span-2`} />
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      <form action={saveTheme} className="grid gap-5">
        <input type="hidden" name="sectionIds" value={sections.map((section) => section.id).join(",")} />
        <div className="flex flex-wrap justify-end gap-2">
          <a className={preview === "mobile" ? buttonClass : "rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black"} href="/admin/theme?preview=mobile">Mobile</a>
          <a className={preview === "mobile" ? "rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black" : buttonClass} href="/admin/theme">Desktop</a>
          <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">{t("theme.save")}</button>
        </div>
        <section className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="grid gap-3">
            {sections.map((section) => (
              <div key={section.id} className="rounded-lg border border-[#dfe7df] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-[#647067]">{section.id}</p>
                  <input name={`${section.id}.sortOrder`} type="number" defaultValue={section.sortOrder} className="h-9 w-20 rounded-lg border border-[#d8e0d8] px-2 text-sm" />
                </div>
                <input name={`${section.id}.title`} defaultValue={section.title} className="mt-2 h-10 w-full rounded-lg border border-[#d8e0d8] px-3 font-bold" />
                <textarea name={`${section.id}.copy`} defaultValue={section.copy} className="mt-2 min-h-24 w-full rounded-lg border border-[#d8e0d8] p-3 text-sm" />
                <input name={`${section.id}.cta`} defaultValue={section.cta} className="mt-2 h-10 w-full rounded-lg border border-[#d8e0d8] px-3" />
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <select name={`${section.id}.type`} defaultValue={section.type ?? "Section"} className={fieldClass}>
                    {["Hero", "Collection feature", "Story", "Product spotlight", "Banner", "Section"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select name={`${section.id}.layout`} defaultValue={section.layout ?? "Editorial split"} className={fieldClass}>
                    {["Editorial split", "Image band", "Text first", "Product grid"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select name={`${section.id}.imagePosition`} defaultValue={section.imagePosition ?? "Right"} className={fieldClass}>
                    {["Right", "Left", "Background", "Top"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input name={`${section.id}.imageAlt`} defaultValue={section.imageAlt ?? ""} placeholder={t("theme.imageAlt")} className={fieldClass} />
                </div>
                <textarea name={`${section.id}.imagePrompt`} defaultValue={section.imagePrompt ?? ""} placeholder={t("theme.imagePrompt")} className="mt-2 min-h-20 w-full rounded-lg border border-[#d8e0d8] p-3 text-sm" />
                <input name={`${section.id}.imageUrl`} defaultValue={section.imageUrl ?? ""} placeholder={t("theme.imageUrl")} className="mt-2 h-10 w-full rounded-lg border border-[#d8e0d8] px-3" />
                {section.imageUrl ? (
                  <img src={section.imageUrl} alt={section.imageAlt || section.title} className="mt-3 aspect-[16/9] w-full rounded-lg object-cover" />
                ) : null}
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                  <label className="flex items-center gap-2"><input name={`${section.id}.visible`} type="checkbox" defaultChecked={section.visible} /> {t("theme.visible")}</label>
                  <label className="flex items-center gap-2 text-[#9f2f20]"><input name={`${section.id}.delete`} type="checkbox" /> {common("actions.delete")}</label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button name="sectionId" value={section.id} formAction={generateThemeSectionImage} className={buttonClass}>{t("theme.generateImage")}</button>
                  <button name="sectionId" value={section.id} formAction={clearThemeSectionImage} className="rounded-lg border border-[#d8e0d8] bg-white px-3 py-2 text-sm font-black">{t("theme.clearImage")}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#dfe7df] bg-[#fbfaf6] p-5">
            <p className="mb-3 text-sm font-black text-[#647067]">{t("theme.livePreview")}</p>
            <div className={`overflow-hidden rounded-lg border border-[#e6dfd2] bg-white ${preview === "mobile" ? "mx-auto max-w-[390px]" : ""}`}>
              {sections.filter((section) => section.visible).map((section) => (
                <section key={section.id} className={`grid gap-5 border-b border-[#eee7da] p-6 ${section.imageUrl && preview !== "mobile" ? "md:grid-cols-2 md:items-center" : ""}`}>
                  {section.imageUrl && section.imagePosition === "Left" ? (
                    <img src={section.imageUrl} alt={section.imageAlt || section.title} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  ) : null}
                  <div>
                    <p className="text-xs font-black uppercase text-[#647067]">{section.type ?? "Section"}</p>
                    <h2 className="mt-2 text-3xl font-black text-[#173326]">{section.title}</h2>
                    <p className="mt-2 max-w-xl text-[#5f665f]">{section.copy}</p>
                    <button className="mt-4 rounded-full border border-[#d8d0c2] px-4 py-2 text-sm font-black" type="button">{section.cta}</button>
                  </div>
                  {section.imageUrl && section.imagePosition !== "Left" ? (
                    <img src={section.imageUrl} alt={section.imageAlt || section.title} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  ) : section.imageUrl ? null : (
                    <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#e8f2dd,#f7d7c3_48%,#c8d9ed)]" />
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
