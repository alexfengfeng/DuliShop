import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CrudDrawer } from "@/components/admin/crud-drawer";
import { BulkToolbar } from "@/components/admin/bulk-toolbar";
import { DeleteResourceForm, buttonClass, fieldClass, secondaryButtonClass, textareaClass } from "@/components/admin/resource-actions";
import { adjustVariantInventory, clearProductImage, createResource, generateProductImage, updateResource } from "@/lib/actions";
import { getStore } from "@/lib/data";
import { money } from "@/lib/format";
import { translateStatus } from "@/lib/i18n-utils";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; image?: string }>;
}) {
  const { query, status, image } = await searchParams;
  const t = await getTranslations("admin");
  const common = await getTranslations("common");
  const statusT = await getTranslations("status");
  const store = await getStore();
  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      ...(status ? { status } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: { variants: true, collection: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#647067]">{t("products.eyebrow")}</p>
          <h1 className="text-3xl font-black">{t("products.title")}</h1>
        </div>
        <Link className="rounded-lg border border-[#d8e0d8] bg-white px-4 py-2 text-sm font-black" href="/products/linen-utility-tote">{t("products.preview")}</Link>
      </div>
      <CrudDrawer summary={t("products.create")} title={t("products.create")}>
        <form action={createResource} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="resource" value="product" />
          <input name="title" placeholder={t("products.placeholders.title")} className={fieldClass} required />
          <input name="category" placeholder={t("products.placeholders.category")} className={fieldClass} required />
          <input name="mediaColor" placeholder="#e8f2dd" className={fieldClass} defaultValue="#e8f2dd" />
          <input name="featuredImageUrl" placeholder={t("products.placeholders.imageUrl")} className={fieldClass} />
          <input name="featuredImageAlt" placeholder={t("products.placeholders.imageAlt")} className={fieldClass} />
          <textarea name="description" placeholder={t("products.placeholders.description")} className={`${textareaClass} md:col-span-3`} required />
          <textarea name="imagePrompt" placeholder={t("products.placeholders.imagePrompt")} className={`${textareaClass} md:col-span-3`} />
          <input name="price" type="number" min="1" step="0.01" placeholder={t("products.placeholders.price")} className={fieldClass} required />
          <input name="inventory" type="number" min="0" placeholder={t("products.placeholders.inventory")} className={fieldClass} required />
          <select name="status" defaultValue="Active" className={fieldClass}>
            {["Active", "Draft", "Archived"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
          </select>
          <button className={buttonClass}>{common("actions.create")}</button>
        </form>
      </CrudDrawer>
      {image === "missing-config" ? (
        <div className="rounded-lg border border-[#ead7a4] bg-[#fff8df] p-4 text-sm font-bold text-[#6f5620]">
          {t("products.imageConfigMissing")}
        </div>
      ) : null}
      <BulkToolbar resource="product" ids={products.map((product) => product.id)} statuses={["Active", "Draft", "Archived"]} label={common("misc.selected", { count: products.length })} actionLabel={common("actions.bulkUpdate")} />
      <section className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="text-left text-xs uppercase text-[#647067]"><tr><th className="py-2">{t("columns.product")}</th><th>{t("columns.category")}</th><th>{t("columns.variants")}</th><th>{t("columns.onHand")}</th><th>{t("columns.reserved")}</th><th>{t("columns.incoming")}</th><th>{t("columns.price")}</th><th>{t("columns.status")}</th><th>{t("columns.action")}</th></tr></thead>
            <tbody>
              {products.map((product) => {
                const inventory = product.variants.reduce((sum, variant) => sum + variant.inventory, 0);
                const reserved = product.variants.reduce((sum, variant) => sum + variant.reservedInventory, 0);
                const incoming = product.variants.reduce((sum, variant) => sum + variant.incomingInventory, 0);
                return (
                  <tr key={product.id} className="border-t border-[#edf1ed] align-top">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {product.featuredImageUrl ? (
                          <img src={product.featuredImageUrl} alt={product.featuredImageAlt || product.title} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf)` }} />
                        )}
                        <span className="font-black">{product.title}</span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.variants.length}</td>
                    <td>{inventory}</td>
                    <td>{reserved}</td>
                    <td>{incoming}</td>
                    <td>{money(product.variants[0]?.price ?? 0)}</td>
                    <td><StatusBadge value={product.status} label={translateStatus(statusT, product.status)} /></td>
                    <td>
                      <details>
                        <summary className={secondaryButtonClass}>{common("actions.details")}</summary>
                        <div className="mt-3 grid min-w-[520px] gap-4">
                          <form action={updateResource} className="grid gap-2">
                            <input type="hidden" name="resource" value="product" />
                            <input type="hidden" name="id" value={product.id} />
                            <input name="title" defaultValue={product.title} className={fieldClass} />
                            <input name="category" defaultValue={product.category} className={fieldClass} />
                            <input name="mediaColor" defaultValue={product.mediaColor} className={fieldClass} />
                            <input name="featuredImageUrl" defaultValue={product.featuredImageUrl ?? ""} placeholder={t("products.placeholders.imageUrl")} className={fieldClass} />
                            <input name="featuredImageAlt" defaultValue={product.featuredImageAlt ?? ""} placeholder={t("products.placeholders.imageAlt")} className={fieldClass} />
                            <textarea name="description" defaultValue={product.description} className={textareaClass} />
                            <textarea name="imagePrompt" defaultValue={product.imagePrompt ?? ""} placeholder={t("products.placeholders.imagePrompt")} className={textareaClass} />
                            <select name="status" defaultValue={product.status} className={fieldClass}>
                              {["Active", "Draft", "Archived"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                            </select>
                            <button className={buttonClass}>{common("actions.saveChanges")}</button>
                          </form>
                          <div className="grid gap-3 rounded-lg bg-[#f8faf8] p-3">
                            <div>
                              <p className="text-sm font-black">{t("products.aiImage")}</p>
                              <p className="text-xs text-[#647067]">{t("products.aiImageHelp")}</p>
                            </div>
                            {product.featuredImageUrl ? (
                              <img src={product.featuredImageUrl} alt={product.featuredImageAlt || product.title} className="aspect-[16/9] w-full rounded-lg object-cover" />
                            ) : (
                              <div className="aspect-[16/9] rounded-lg" style={{ background: `linear-gradient(135deg, ${product.mediaColor}, #f8e1cf)` }} />
                            )}
                            <form action={generateProductImage} className="grid gap-2 md:grid-cols-[1fr_auto]">
                              <input type="hidden" name="productId" value={product.id} />
                              <textarea name="imagePrompt" defaultValue={product.imagePrompt ?? ""} placeholder={t("products.placeholders.imagePrompt")} className={textareaClass} />
                              <button className={buttonClass}>{t("products.generateImage")}</button>
                            </form>
                            <form action={clearProductImage}>
                              <input type="hidden" name="productId" value={product.id} />
                              <button className={secondaryButtonClass}>{t("products.clearImage")}</button>
                            </form>
                          </div>
                          <form action={createResource} className="grid gap-2 rounded-lg bg-[#f8faf8] p-3 md:grid-cols-4">
                            <input type="hidden" name="resource" value="productVariant" />
                            <input type="hidden" name="productId" value={product.id} />
                            <input name="sku" placeholder={t("columns.sku")} className={fieldClass} required />
                            <input name="color" placeholder="Color" className={fieldClass} required />
                            <input name="size" placeholder="Size" className={fieldClass} required />
                            <input name="price" type="number" step="0.01" placeholder={t("columns.price")} className={fieldClass} required />
                            <input name="inventory" type="number" placeholder={t("columns.onHand")} className={fieldClass} defaultValue="0" />
                            <input name="reservedInventory" type="number" placeholder={t("columns.reserved")} className={fieldClass} defaultValue="0" />
                            <input name="incomingInventory" type="number" placeholder={t("columns.incoming")} className={fieldClass} defaultValue="0" />
                            <button className={buttonClass}>{common("actions.create")}</button>
                          </form>
                          <div className="grid gap-2">
                            {product.variants.map((variant) => (
                              <details key={variant.id} className="rounded-lg border border-[#edf1ed] p-3">
                                <summary className="cursor-pointer font-black">{variant.sku} · {variant.color}/{variant.size} · {money(variant.price)}</summary>
                                <form action={updateResource} className="mt-3 grid gap-2 md:grid-cols-4">
                                  <input type="hidden" name="resource" value="productVariant" />
                                  <input type="hidden" name="id" value={variant.id} />
                                  <input name="sku" defaultValue={variant.sku} className={fieldClass} />
                                  <input name="color" defaultValue={variant.color} className={fieldClass} />
                                  <input name="size" defaultValue={variant.size} className={fieldClass} />
                                  <input name="price" type="number" step="0.01" defaultValue={Number(variant.price)} className={fieldClass} />
                                  <input name="inventory" type="number" defaultValue={variant.inventory} className={fieldClass} />
                                  <input name="reservedInventory" type="number" defaultValue={variant.reservedInventory} className={fieldClass} />
                                  <input name="incomingInventory" type="number" defaultValue={variant.incomingInventory} className={fieldClass} />
                                  <select name="status" defaultValue={variant.status} className={fieldClass}>
                                    {["Active", "Draft", "Archived"].map((item) => <option key={item} value={item}>{translateStatus(statusT, item)}</option>)}
                                  </select>
                                  <button className={buttonClass}>{common("actions.save")}</button>
                                </form>
                                <form action={adjustVariantInventory} className="mt-2 grid gap-2 md:grid-cols-4">
                                  <input type="hidden" name="variantId" value={variant.id} />
                                  <input name="quantity" type="number" defaultValue="1" className={fieldClass} />
                                  <input name="location" defaultValue="Warehouse" className={fieldClass} />
                                  <input name="kind" defaultValue="Adjustment" className={fieldClass} />
                                  <button className={secondaryButtonClass}>{common("actions.adjustInventory")}</button>
                                </form>
                                <div className="mt-2"><DeleteResourceForm resource="productVariant" id={variant.id} label={common("actions.delete")} message={common("misc.confirmDelete")} /></div>
                              </details>
                            ))}
                          </div>
                          <DeleteResourceForm resource="product" id={product.id} label={t("products.archiveDelete")} message={common("misc.confirmDelete")} />
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
