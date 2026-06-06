import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { buttonClass, fieldClass, textareaClass } from "@/components/admin/resource-actions";
import {
  clearThemeSectionImage,
  createThemeSection,
  generateLlmsContent,
  generateLocalThemeSectionImage,
  generateSeoDraftFromTheme,
  generateThemeSectionImage,
  saveTheme,
} from "@/lib/actions";
import { getHomeTheme, getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { mergeMarketAlternates, normalizeThemeGrowthConfig, seoChecklist } from "@/lib/seo/theme-seo";

export const dynamic = "force-dynamic";

export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string; preview?: string }>;
}) {
  const { image, preview } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const store = await getStore();
  const [theme, markets] = await Promise.all([
    getHomeTheme(store.id),
    prisma.market.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
  ]);
  const themeConfig = mergeMarketAlternates(normalizeThemeGrowthConfig(theme?.sections), markets);
  const sections = themeConfig.sections.sort((a, b) => a.sortOrder - b.sortOrder);
  const checklist = seoChecklist(themeConfig);
  const score = Math.round((checklist.filter((item) => item.passed).length / checklist.length) * 100);
  const faqText = themeConfig.geo.faq.map((item) => `${item.question} | ${item.answer}`).join("\n");
  const alternateText = themeConfig.marketSeo.alternates
    .map((item) => [item.market, item.region, item.language, item.currency, item.path, item.title, item.description].join(" | "))
    .join("\n");

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
          <button formAction={generateSeoDraftFromTheme} className="rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black">{t("theme.generateSeoDraft")}</button>
          <button formAction={generateLlmsContent} className="rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black">{t("theme.generateLlms")}</button>
          <button className="rounded-lg bg-[#173326] px-4 py-2 text-sm font-black text-white">{t("theme.save")}</button>
        </div>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#647067]">{t("theme.workspaceSeo")}</p>
                  <h2 className="text-xl font-black">{t("theme.seoTitle")}</h2>
                </div>
                <span className="rounded-full bg-[#e8f2dd] px-3 py-1 text-sm font-black text-[#173326]">{score}%</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input name="seo.pageTitle" defaultValue={themeConfig.seo.pageTitle} placeholder={t("theme.seoPageTitle")} className={fieldClass} />
                <input name="seo.canonicalPath" defaultValue={themeConfig.seo.canonicalPath} placeholder={t("theme.canonicalPath")} className={fieldClass} />
                <textarea name="seo.metaDescription" defaultValue={themeConfig.seo.metaDescription} placeholder={t("theme.metaDescription")} className={`${textareaClass} md:col-span-2`} />
                <input name="seo.ogTitle" defaultValue={themeConfig.seo.ogTitle} placeholder={t("theme.ogTitle")} className={fieldClass} />
                <input name="seo.ogImage" defaultValue={themeConfig.seo.ogImage} placeholder={t("theme.ogImage")} className={fieldClass} />
                <textarea name="seo.ogDescription" defaultValue={themeConfig.seo.ogDescription} placeholder={t("theme.ogDescription")} className={`${textareaClass} md:col-span-2`} />
                <input name="seo.twitterTitle" defaultValue={themeConfig.seo.twitterTitle} placeholder={t("theme.twitterTitle")} className={fieldClass} />
                <input name="seo.twitterDescription" defaultValue={themeConfig.seo.twitterDescription} placeholder={t("theme.twitterDescription")} className={fieldClass} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                <label className="flex items-center gap-2"><input name="seo.robotsIndex" type="checkbox" defaultChecked={themeConfig.seo.robotsIndex} /> {t("theme.indexPage")}</label>
                <label className="flex items-center gap-2"><input name="seo.robotsFollow" type="checkbox" defaultChecked={themeConfig.seo.robotsFollow} /> {t("theme.followLinks")}</label>
              </div>
            </div>
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.workspaceGeo")}</p>
              <h2 className="text-xl font-black">{t("theme.geoTitle")}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <textarea name="geo.brandEntity" defaultValue={themeConfig.geo.brandEntity} placeholder={t("theme.brandEntity")} className={textareaClass} />
                <textarea name="geo.aiSummary" defaultValue={themeConfig.geo.aiSummary} placeholder={t("theme.aiSummary")} className={textareaClass} />
                <textarea name="geo.credibility" defaultValue={themeConfig.geo.credibility} placeholder={t("theme.credibility")} className={textareaClass} />
                <textarea name="geo.productFacts" defaultValue={themeConfig.geo.productFacts} placeholder={t("theme.productFacts")} className={textareaClass} />
                <textarea name="geo.faq" defaultValue={faqText} placeholder={t("theme.faqFormat")} className={`${textareaClass} md:col-span-2`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                <label className="flex items-center gap-2"><input name="structuredData.enableOrganization" type="checkbox" defaultChecked={themeConfig.structuredData.enableOrganization} /> Organization JSON-LD</label>
                <label className="flex items-center gap-2"><input name="structuredData.enableWebsite" type="checkbox" defaultChecked={themeConfig.structuredData.enableWebsite} /> WebSite JSON-LD</label>
                <label className="flex items-center gap-2"><input name="structuredData.enableProduct" type="checkbox" defaultChecked={themeConfig.structuredData.enableProduct} /> Product JSON-LD</label>
                <label className="flex items-center gap-2"><input name="structuredData.enableBreadcrumbs" type="checkbox" defaultChecked={themeConfig.structuredData.enableBreadcrumbs} /> Breadcrumbs</label>
                <label className="flex items-center gap-2"><input name="structuredData.enableFaq" type="checkbox" defaultChecked={themeConfig.structuredData.enableFaq} /> FAQ JSON-LD</label>
              </div>
            </div>
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.workspaceMarkets")}</p>
              <h2 className="text-xl font-black">{t("theme.marketsTitle")}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                <input name="marketSeo.defaultMarket" defaultValue={themeConfig.marketSeo.defaultMarket} placeholder={t("theme.defaultMarket")} className={fieldClass} />
                <textarea name="marketSeo.alternates" defaultValue={alternateText} placeholder={t("theme.marketFormat")} className={textareaClass} />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {markets.map((market) => (
                  <div key={market.id} className="rounded-lg border border-[#e6eee6] bg-[#fbfaf6] p-3 text-sm">
                    <p className="font-black">{market.name}</p>
                    <p className="text-[#647067]">{market.region} · {market.currency} · {market.language}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="grid gap-4">
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.serpPreview")}</p>
              <h3 className="mt-3 text-lg font-black text-[#1a0dab]">{themeConfig.seo.pageTitle}</h3>
              <p className="mt-1 text-xs text-[#0f7b36]">solace-supply.test{themeConfig.seo.canonicalPath}</p>
              <p className="mt-2 text-sm leading-6 text-[#4d5156]">{themeConfig.seo.metaDescription}</p>
            </div>
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.socialPreview")}</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-[#e6dfd2]">
                {themeConfig.seo.ogImage || sections.find((section) => section.imageUrl)?.imageUrl ? (
                  <img src={themeConfig.seo.ogImage || sections.find((section) => section.imageUrl)?.imageUrl} alt="" className="aspect-[1.91/1] w-full object-cover" />
                ) : (
                  <div className="aspect-[1.91/1] bg-[linear-gradient(135deg,#e8f2dd,#f7d7c3_48%,#c8d9ed)]" />
                )}
                <div className="p-3">
                  <p className="font-black">{themeConfig.seo.ogTitle}</p>
                  <p className="mt-1 text-sm text-[#647067]">{themeConfig.seo.ogDescription}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.aiPreview")}</p>
              <p className="mt-3 text-sm leading-6 text-[#4c554e]">{themeConfig.geo.aiSummary}</p>
              <p className="mt-3 text-sm leading-6 text-[#4c554e]">{themeConfig.geo.credibility}</p>
            </div>
            <div className="rounded-lg border border-[#dfe7df] bg-white p-4">
              <p className="text-xs font-black uppercase text-[#647067]">{t("theme.checklist")}</p>
              <div className="mt-3 grid gap-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm font-bold">
                    <span>{item.label}</span>
                    <span className={item.passed ? "text-[#0f7b36]" : "text-[#9f2f20]"}>{item.passed ? t("theme.pass") : t("theme.needsWork")}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
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
                  <button formAction={generateThemeSectionImage.bind(null, section.id)} className={buttonClass}>{t("theme.generateImage")}</button>
                  <button formAction={generateLocalThemeSectionImage.bind(null, section.id)} className="rounded-lg border border-[#d8e0d8] bg-white px-3 py-2 text-sm font-black">{t("theme.generateLocalImage")}</button>
                  <button formAction={clearThemeSectionImage.bind(null, section.id)} className="rounded-lg border border-[#d8e0d8] bg-white px-3 py-2 text-sm font-black">{t("theme.clearImage")}</button>
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
