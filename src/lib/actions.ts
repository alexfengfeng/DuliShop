"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { CART_COOKIE, getCart, getHomeTheme, getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isAppLocale, localeCookieName } from "@/i18n/routing";
import { checkoutMode, orderPaymentStatusForMode } from "@/lib/checkout/mode";
import { getCurrentStoreId, logActivity, normalizeOptionalRelation, revalidateResource } from "@/lib/admin/crud";
import { resourceSchemas, safeReference, type ResourceName } from "@/lib/admin/schemas";
import {
  buildProductImagePrompt,
  buildThemeImagePrompt,
  generateOpenAiImage,
  imageAltFromPrompt,
  imageGenerationConfig,
  imageStoragePath,
} from "@/lib/images/generation";
import { localProductImageUrl, productSvg, safeAssetFileName } from "@/lib/local-art/product-art";
import { localThemeImageUrl, themeSectionSvg } from "@/lib/local-art/theme-art";

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(4),
  category: z.string().min(2),
  price: z.coerce.number().positive(),
  inventory: z.coerce.number().int().min(0),
});

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") || "");
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?error=supabase-env");
  }

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/dashboard");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function createProduct(formData: FormData) {
  const store = await getStore();
  const input = productSchema.parse(Object.fromEntries(formData));
  const handle = slugify(input.title);

  const product = await prisma.product.create({
    data: {
      storeId: store.id,
      title: input.title,
      handle,
      description: input.description,
      category: input.category,
      status: "Active",
      mediaColor: "#e8f2dd",
      variants: {
        create: {
          sku: `${handle.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          color: "Natural",
          size: "M",
          price: input.price,
          inventory: input.inventory,
          status: "Active",
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      storeId: store.id,
      actor: "Admin",
      action: "Created product",
      subject: product.title,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function archiveProduct(formData: FormData) {
  const id = String(formData.get("id"));
  const existingOrderItem = await prisma.orderItem.findFirst({
    where: { productId: id },
  });

  if (existingOrderItem) {
    await prisma.product.update({ where: { id }, data: { status: "Archived" } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath("/admin/products");
}

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getResource(formData: FormData): ResourceName {
  const resource = String(formData.get("resource") || "");
  if (!(resource in resourceSchemas)) {
    throw new Error(`Unsupported resource: ${resource}`);
  }
  return resource as ResourceName;
}

type ThemeSectionData = {
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

async function uploadGeneratedAsset({
  storeId,
  kind,
  targetId,
  prompt,
}: {
  storeId: string;
  kind: "product" | "theme";
  targetId: string;
  prompt: string;
}) {
  const config = imageGenerationConfig();
  if (!config.configured || !config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return { configured: false as const };
  }

  const generated = await generateOpenAiImage({ prompt, kind, config });
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const path = imageStoragePath({ storeId, kind, targetId });
  const upload = await supabase.storage.from("generated-assets").upload(path, generated.bytes, {
    contentType: generated.contentType,
    upsert: true,
  });
  if (upload.error) {
    throw new Error(`Supabase Storage upload failed: ${upload.error.message}`);
  }
  const { data } = supabase.storage.from("generated-assets").getPublicUrl(path);
  return {
    configured: true as const,
    url: data.publicUrl,
    model: generated.model,
    provider: "openai",
  };
}

async function writeLocalProductImage({
  storeId,
  product,
}: {
  storeId: string;
  product: {
    id: string;
    title: string;
    handle: string;
    category: string;
    mediaColor: string;
    imagePrompt?: string | null;
  };
}) {
  const fileName = `${safeAssetFileName(product.handle || product.title)}.svg`;
  const outputDir = join(process.cwd(), "public", "generated", "products");
  const publicUrl = localProductImageUrl(product);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, fileName), productSvg(product), "utf8");
  await prisma.imageAsset.deleteMany({
    where: { storeId, productId: product.id, provider: "local-svg" },
  });
  await prisma.imageAsset.create({
    data: {
      storeId,
      productId: product.id,
      kind: "product",
      prompt: product.imagePrompt || `Local generated product image for ${product.title}`,
      alt: `${product.title} product image`,
      url: publicUrl,
      status: "Ready",
      provider: "local-svg",
      model: "local-product-art-v1",
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { featuredImageUrl: publicUrl, featuredImageAlt: `${product.title} product image` },
  });
  return publicUrl;
}

async function writeLocalThemeImage({
  storeId,
  section,
}: {
  storeId: string;
  section: ThemeSectionData;
}) {
  const fileName = `${safeAssetFileName(section.id || section.title)}.svg`;
  const outputDir = join(process.cwd(), "public", "generated", "theme");
  const publicUrl = localThemeImageUrl(section);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, fileName), themeSectionSvg(section), "utf8");
  await prisma.imageAsset.deleteMany({
    where: { storeId, themeKey: "home", sectionId: section.id, provider: "local-svg" },
  });
  await prisma.imageAsset.create({
    data: {
      storeId,
      themeKey: "home",
      sectionId: section.id,
      kind: "theme",
      prompt: section.imagePrompt || `Local generated theme image for ${section.title}`,
      alt: `${section.title} theme image`,
      url: publicUrl,
      status: "Ready",
      provider: "local-svg",
      model: "local-theme-art-v1",
    },
  });
  return publicUrl;
}

export async function createResource(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const resource = getResource(formData);
  const input = formObject(formData);

  switch (resource) {
    case "product": {
      const data = resourceSchemas.product.create.parse(input);
      const handle = slugify(data.title);
      const product = await prisma.product.create({
        data: {
          storeId,
          title: data.title,
          handle,
          description: data.description,
          category: data.category,
          status: data.status,
          mediaColor: data.mediaColor,
          featuredImageUrl: data.featuredImageUrl,
          featuredImageAlt: data.featuredImageAlt,
          imagePrompt: data.imagePrompt,
          variants: {
            create: {
              sku: `${handle.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
              color: "Natural",
              size: "M",
              price: data.price,
              inventory: data.inventory,
              status: "Active",
            },
          },
        },
      });
      if (!data.featuredImageUrl) {
        await writeLocalProductImage({ storeId, product });
      }
      await logActivity(storeId, "Created product", product.title);
      break;
    }
    case "productVariant": {
      const data = resourceSchemas.productVariant.create.parse(input);
      const variant = await prisma.productVariant.create({ data });
      await logActivity(storeId, "Created product variant", variant.sku);
      break;
    }
    case "customer": {
      const data = resourceSchemas.customer.create.parse(input);
      const customer = await prisma.customer.create({ data: { storeId, ...data, ltv: 0 } });
      await logActivity(storeId, "Created customer", customer.email);
      break;
    }
    case "payout": {
      const data = resourceSchemas.payout.create.parse(input);
      const payout = await prisma.payout.create({
        data: { storeId, ...data, reference: safeReference("POUT", data.reference) },
      });
      await logActivity(storeId, "Created payout", payout.reference);
      break;
    }
    case "transaction": {
      const data = resourceSchemas.transaction.create.parse(input);
      const transaction = await prisma.transaction.create({
        data: { storeId, ...data, reference: safeReference("TXN", data.reference) },
      });
      await logActivity(storeId, "Created transaction", transaction.reference);
      break;
    }
    case "chargeback": {
      const data = resourceSchemas.chargeback.create.parse(input);
      const chargeback = await prisma.chargeback.create({
        data: { storeId, ...data, caseNumber: safeReference("CB", data.caseNumber) },
      });
      await logActivity(storeId, "Created chargeback", chargeback.caseNumber);
      break;
    }
    case "supplier": {
      const data = resourceSchemas.supplier.create.parse(input);
      const supplier = await prisma.supplier.create({ data: { storeId, ...data } });
      await logActivity(storeId, "Created supplier", supplier.name);
      break;
    }
    case "purchaseOrder": {
      const data = resourceSchemas.purchaseOrder.create.parse(input);
      const po = await prisma.purchaseOrder.create({
        data: {
          storeId,
          reference: safeReference("PO", data.reference),
          supplierId: normalizeOptionalRelation(data.supplierId),
          expectedAt: data.expectedAt,
          amount: data.amount,
          status: data.status,
        },
      });
      await logActivity(storeId, "Created purchase order", po.reference);
      break;
    }
    case "transfer": {
      const data = resourceSchemas.transfer.create.parse(input);
      const transfer = await prisma.transfer.create({
        data: { storeId, ...data, reference: safeReference("TR", data.reference) },
      });
      await logActivity(storeId, "Created transfer", transfer.reference);
      break;
    }
    case "inventoryMovement": {
      const data = resourceSchemas.inventoryMovement.create.parse(input);
      const movement = await prisma.inventoryMovement.create({
        data: {
          storeId,
          reference: safeReference("MOV", data.reference),
          variantId: normalizeOptionalRelation(data.variantId),
          kind: data.kind,
          location: data.location,
          quantity: data.quantity,
          status: data.status,
        },
      });
      await logActivity(storeId, "Created inventory movement", movement.reference);
      break;
    }
    case "fulfillment": {
      const data = resourceSchemas.fulfillment.create.parse(input);
      const fulfillment = await prisma.fulfillment.create({
        data: {
          storeId,
          reference: safeReference("FUL", data.reference),
          orderId: normalizeOptionalRelation(data.orderId),
          carrier: data.carrier,
          status: data.status,
        },
      });
      await logActivity(storeId, "Created fulfillment", fulfillment.reference);
      break;
    }
    case "returnCase": {
      const data = resourceSchemas.returnCase.create.parse(input);
      const returnCase = await prisma.returnCase.create({
        data: {
          storeId,
          caseNumber: safeReference("RMA", data.caseNumber),
          orderId: normalizeOptionalRelation(data.orderId),
          customer: data.customer,
          reason: data.reason,
          status: data.status,
        },
      });
      await logActivity(storeId, "Created return case", returnCase.caseNumber);
      break;
    }
    case "shippingLabel": {
      const data = resourceSchemas.shippingLabel.create.parse(input);
      const label = await prisma.shippingLabel.create({
        data: {
          storeId,
          labelNumber: safeReference("LBL", data.labelNumber),
          orderId: normalizeOptionalRelation(data.orderId),
          carrier: data.carrier,
          cost: data.cost,
          status: data.status,
        },
      });
      await logActivity(storeId, "Created shipping label", label.labelNumber);
      break;
    }
    case "market": {
      const data = resourceSchemas.market.create.parse(input);
      const market = await prisma.market.create({ data: { storeId, ...data } });
      await logActivity(storeId, "Created market", market.name);
      break;
    }
    case "reportSnapshot": {
      const data = resourceSchemas.reportSnapshot.create.parse(input);
      const snapshot = await prisma.reportSnapshot.create({ data: { storeId, ...data } });
      await logActivity(storeId, "Created report", snapshot.name);
      break;
    }
    case "appInstallation": {
      const data = resourceSchemas.appInstallation.create.parse(input);
      const app = await prisma.appInstallation.create({ data: { storeId, ...data } });
      await logActivity(storeId, "Created app record", app.name);
      break;
    }
    default:
      throw new Error(`Create is not supported for ${resource}`);
  }

  revalidateResource(resource);
}

export async function updateResource(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const resource = getResource(formData);
  const id = String(formData.get("id") || "");
  const input = formObject(formData);
  if (!id) throw new Error("Missing resource id");

  switch (resource) {
    case "order": {
      const data = resourceSchemas.order.update.parse(input);
      const order = await prisma.order.update({ where: { id }, data });
      await logActivity(storeId, "Updated order", order.orderNumber);
      break;
    }
    case "product": {
      const data = resourceSchemas.product.update.parse(input);
      const product = await prisma.product.update({ where: { id }, data: { ...data, handle: slugify(data.title) } });
      await logActivity(storeId, "Updated product", product.title);
      break;
    }
    case "productVariant": {
      const data = resourceSchemas.productVariant.update.parse(input);
      const variant = await prisma.productVariant.update({ where: { id }, data });
      await logActivity(storeId, "Updated product variant", variant.sku);
      break;
    }
    case "customer": {
      const data = resourceSchemas.customer.update.parse(input);
      const customer = await prisma.customer.update({ where: { id }, data });
      await logActivity(storeId, "Updated customer", customer.email);
      break;
    }
    case "payout": {
      const data = resourceSchemas.payout.update.parse(input);
      const payout = await prisma.payout.update({ where: { id }, data });
      await logActivity(storeId, "Updated payout", payout.reference);
      break;
    }
    case "transaction": {
      const data = resourceSchemas.transaction.update.parse(input);
      const transaction = await prisma.transaction.update({ where: { id }, data });
      await logActivity(storeId, "Updated transaction", transaction.reference);
      break;
    }
    case "chargeback": {
      const data = resourceSchemas.chargeback.update.parse(input);
      const chargeback = await prisma.chargeback.update({ where: { id }, data });
      await logActivity(storeId, "Updated chargeback", chargeback.caseNumber);
      break;
    }
    case "supplier": {
      const data = resourceSchemas.supplier.update.parse(input);
      const supplier = await prisma.supplier.update({ where: { id }, data });
      await logActivity(storeId, "Updated supplier", supplier.name);
      break;
    }
    case "purchaseOrder": {
      const data = resourceSchemas.purchaseOrder.update.parse(input);
      const po = await prisma.purchaseOrder.update({
        where: { id },
        data: { ...data, supplierId: normalizeOptionalRelation(data.supplierId) },
      });
      await logActivity(storeId, "Updated purchase order", po.reference);
      break;
    }
    case "transfer": {
      const data = resourceSchemas.transfer.update.parse(input);
      const transfer = await prisma.transfer.update({ where: { id }, data });
      await logActivity(storeId, "Updated transfer", transfer.reference);
      break;
    }
    case "inventoryMovement": {
      const data = resourceSchemas.inventoryMovement.update.parse(input);
      const movement = await prisma.inventoryMovement.update({
        where: { id },
        data: { ...data, variantId: normalizeOptionalRelation(data.variantId) },
      });
      await logActivity(storeId, "Updated inventory movement", movement.reference);
      break;
    }
    case "fulfillment": {
      const data = resourceSchemas.fulfillment.update.parse(input);
      const fulfillment = await prisma.fulfillment.update({
        where: { id },
        data: { ...data, orderId: normalizeOptionalRelation(data.orderId) },
      });
      await logActivity(storeId, "Updated fulfillment", fulfillment.reference);
      break;
    }
    case "returnCase": {
      const data = resourceSchemas.returnCase.update.parse(input);
      const returnCase = await prisma.returnCase.update({
        where: { id },
        data: { ...data, orderId: normalizeOptionalRelation(data.orderId) },
      });
      await logActivity(storeId, "Updated return case", returnCase.caseNumber);
      break;
    }
    case "shippingLabel": {
      const data = resourceSchemas.shippingLabel.update.parse(input);
      const label = await prisma.shippingLabel.update({
        where: { id },
        data: { ...data, orderId: normalizeOptionalRelation(data.orderId) },
      });
      await logActivity(storeId, "Updated shipping label", label.labelNumber);
      break;
    }
    case "market": {
      const data = resourceSchemas.market.update.parse(input);
      const market = await prisma.market.update({ where: { id }, data });
      await logActivity(storeId, "Updated market", market.name);
      break;
    }
    case "reportSnapshot": {
      const data = resourceSchemas.reportSnapshot.update.parse(input);
      const snapshot = await prisma.reportSnapshot.update({ where: { id }, data });
      await logActivity(storeId, "Updated report", snapshot.name);
      break;
    }
    case "appInstallation": {
      const data = resourceSchemas.appInstallation.update.parse(input);
      const app = await prisma.appInstallation.update({ where: { id }, data });
      await logActivity(storeId, "Updated app record", app.name);
      break;
    }
  }

  revalidateResource(resource);
}

export async function deleteResource(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const resource = getResource(formData);
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing resource id");

  switch (resource) {
    case "order": {
      const order = await prisma.order.update({
        where: { id },
        data: { paymentStatus: "Cancelled", fulfillmentStatus: "Cancelled", shippingStatus: "Cancelled" },
      });
      await logActivity(storeId, "Cancelled order", order.orderNumber);
      break;
    }
    case "product": {
      const existingOrderItem = await prisma.orderItem.findFirst({ where: { productId: id } });
      if (existingOrderItem) {
        const product = await prisma.product.update({ where: { id }, data: { status: "Archived" } });
        await logActivity(storeId, "Archived product", product.title);
      } else {
        const product = await prisma.product.delete({ where: { id } });
        await logActivity(storeId, "Deleted product", product.title);
      }
      break;
    }
    case "productVariant": {
      const existingOrderItem = await prisma.orderItem.findFirst({ where: { variantId: id } });
      if (existingOrderItem) {
        const variant = await prisma.productVariant.update({ where: { id }, data: { status: "Archived" } });
        await logActivity(storeId, "Archived product variant", variant.sku);
      } else {
        const variant = await prisma.productVariant.delete({ where: { id } });
        await logActivity(storeId, "Deleted product variant", variant.sku);
      }
      break;
    }
    case "customer": {
      const orders = await prisma.order.count({ where: { customerId: id } });
      if (orders) {
        const customer = await prisma.customer.update({ where: { id }, data: { status: "Archived" } });
        await logActivity(storeId, "Archived customer", customer.email);
      } else {
        const customer = await prisma.customer.delete({ where: { id } });
        await logActivity(storeId, "Deleted customer", customer.email);
      }
      break;
    }
    case "payout":
      await prisma.payout.delete({ where: { id } });
      await logActivity(storeId, "Deleted payout", id);
      break;
    case "transaction":
      await prisma.transaction.delete({ where: { id } });
      await logActivity(storeId, "Deleted transaction", id);
      break;
    case "chargeback":
      await prisma.chargeback.delete({ where: { id } });
      await logActivity(storeId, "Deleted chargeback", id);
      break;
    case "supplier":
      await prisma.supplier.delete({ where: { id } });
      await logActivity(storeId, "Deleted supplier", id);
      break;
    case "purchaseOrder":
      await prisma.purchaseOrder.delete({ where: { id } });
      await logActivity(storeId, "Deleted purchase order", id);
      break;
    case "transfer":
      await prisma.transfer.delete({ where: { id } });
      await logActivity(storeId, "Deleted transfer", id);
      break;
    case "inventoryMovement":
      await prisma.inventoryMovement.delete({ where: { id } });
      await logActivity(storeId, "Deleted inventory movement", id);
      break;
    case "fulfillment":
      await prisma.fulfillment.delete({ where: { id } });
      await logActivity(storeId, "Deleted fulfillment", id);
      break;
    case "returnCase":
      await prisma.returnCase.delete({ where: { id } });
      await logActivity(storeId, "Deleted return case", id);
      break;
    case "shippingLabel":
      await prisma.shippingLabel.delete({ where: { id } });
      await logActivity(storeId, "Deleted shipping label", id);
      break;
    case "market": {
      const market = await prisma.market.findUniqueOrThrow({ where: { id } });
      if (market.status === "Draft") {
        await prisma.market.delete({ where: { id } });
        await logActivity(storeId, "Deleted market", market.name);
      } else {
        await prisma.market.update({ where: { id }, data: { status: "Paused" } });
        await logActivity(storeId, "Paused market", market.name);
      }
      break;
    }
    case "reportSnapshot":
      await prisma.reportSnapshot.delete({ where: { id } });
      await logActivity(storeId, "Deleted report", id);
      break;
    case "appInstallation":
      await prisma.appInstallation.delete({ where: { id } });
      await logActivity(storeId, "Deleted app record", id);
      break;
  }

  revalidateResource(resource);
}

export async function bulkUpdateResource(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const resource = getResource(formData);
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const status = String(formData.get("status") || "");
  if (!ids.length || !status) return;

  switch (resource) {
    case "order":
      await prisma.order.updateMany({ where: { id: { in: ids }, storeId }, data: { fulfillmentStatus: status } });
      break;
    case "product":
      await prisma.product.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "customer":
      await prisma.customer.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "purchaseOrder":
      await prisma.purchaseOrder.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "transfer":
      await prisma.transfer.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "fulfillment":
      await prisma.fulfillment.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "returnCase":
      await prisma.returnCase.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "market":
      await prisma.market.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    case "appInstallation":
      await prisma.appInstallation.updateMany({ where: { id: { in: ids }, storeId }, data: { status } });
      break;
    default:
      return;
  }

  await logActivity(storeId, "Bulk status update", `${resource}: ${ids.length}`);
  revalidateResource(resource);
}

export async function adjustVariantInventory(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const variantId = String(formData.get("variantId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const location = String(formData.get("location") || "Warehouse");
  const kind = String(formData.get("kind") || "Adjustment");
  if (!variantId || !Number.isFinite(quantity)) return;

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { inventory: { increment: quantity } },
  });

  await prisma.inventoryMovement.create({
    data: {
      storeId,
      variantId,
      reference: safeReference("MOV", ""),
      kind,
      location,
      quantity,
      status: "Posted",
    },
  });
  await logActivity(storeId, "Adjusted inventory", variant.sku);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function createReturnFromOrder(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const orderId = String(formData.get("orderId") || "");
  const reason = String(formData.get("reason") || "Admin requested return");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { customer: true } });
  const returnCase = await prisma.returnCase.create({
    data: {
      storeId,
      orderId,
      caseNumber: safeReference("RMA", ""),
      customer: order.customer.name,
      reason,
      status: "Requested",
    },
  });
  await logActivity(storeId, "Created return from order", returnCase.caseNumber);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipping");
}

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const fulfillmentStatus = String(formData.get("fulfillmentStatus"));
  await prisma.order.update({
    where: { id },
    data: { fulfillmentStatus },
  });
  revalidatePath("/admin/orders");
}

export async function saveTheme(formData: FormData) {
  const store = await getStore();
  const sectionIds = String(formData.get("sectionIds") || "hero,collection,story")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const sections = sectionIds
    .filter((id) => formData.get(`${id}.delete`) !== "on")
    .map((id, index) => ({
      id,
      title: String(formData.get(`${id}.title`) || ""),
      copy: String(formData.get(`${id}.copy`) || ""),
      cta: String(formData.get(`${id}.cta`) || ""),
      visible: formData.get(`${id}.visible`) === "on",
      sortOrder: Number(formData.get(`${id}.sortOrder`) || index + 1),
      type: String(formData.get(`${id}.type`) || "Section"),
      layout: String(formData.get(`${id}.layout`) || "Editorial split"),
      imagePosition: String(formData.get(`${id}.imagePosition`) || "Right"),
      imagePrompt: String(formData.get(`${id}.imagePrompt`) || ""),
      imageUrl: String(formData.get(`${id}.imageUrl`) || ""),
      imageAlt: String(formData.get(`${id}.imageAlt`) || ""),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => ({ ...section, sortOrder: index + 1 }));

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId: store.id, key: "home" } },
    update: { sections },
    create: { storeId: store.id, key: "home", sections },
  });

  revalidatePath("/admin/theme");
  revalidatePath("/");
}

export async function createThemeSection(formData: FormData) {
  const store = await getStore();
  const theme = await getHomeTheme(store.id);
  const existing = ((theme?.sections ?? []) as { id: string; sortOrder: number }[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const rawId = slugify(String(formData.get("id") || formData.get("title") || `section-${Date.now()}`));
  const id = existing.some((section) => section.id === rawId) ? `${rawId}-${Date.now().toString().slice(-4)}` : rawId;
  const sections = [
    ...existing,
    {
      id,
      title: String(formData.get("title") || "New section"),
      copy: String(formData.get("copy") || "Add section copy."),
      cta: String(formData.get("cta") || "Shop now"),
      visible: true,
      sortOrder: existing.length + 1,
      type: String(formData.get("type") || "Banner"),
      layout: String(formData.get("layout") || "Editorial split"),
      imagePosition: String(formData.get("imagePosition") || "Right"),
      imagePrompt: String(formData.get("imagePrompt") || ""),
      imageUrl: "",
      imageAlt: "",
    },
  ];

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId: store.id, key: "home" } },
    update: { sections },
    create: { storeId: store.id, key: "home", sections },
  });
  await prisma.activityLog.create({
    data: { storeId: store.id, actor: "Admin", action: "Created theme section", subject: id },
  });
  revalidatePath("/admin/theme");
  revalidatePath("/");
}

export async function generateProductImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const productId = String(formData.get("productId") || "");
  const product = await prisma.product.findFirstOrThrow({ where: { id: productId, storeId } });
  const prompt = String(formData.get("imagePrompt") || product.imagePrompt || "").trim() || buildProductImagePrompt(product);
  const generated = await uploadGeneratedAsset({ storeId, kind: "product", targetId: product.id, prompt });

  if (!generated.configured) {
    redirect("/admin/products?image=missing-config");
  }

  const alt = imageAltFromPrompt(prompt, product.title);
  await prisma.imageAsset.create({
    data: {
      storeId,
      productId: product.id,
      kind: "product",
      prompt,
      alt,
      url: generated.url,
      provider: generated.provider,
      model: generated.model,
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { featuredImageUrl: generated.url, featuredImageAlt: alt, imagePrompt: prompt },
  });
  await logActivity(storeId, "Generated product image", product.title);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.handle}`);
  revalidatePath("/collections/all-products");
}

export async function clearProductImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const productId = String(formData.get("productId") || "");
  const product = await prisma.product.findFirstOrThrow({ where: { id: productId, storeId } });
  await prisma.product.update({
    where: { id: product.id },
    data: { featuredImageUrl: null, featuredImageAlt: null },
  });
  await logActivity(storeId, "Cleared product image", product.title);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.handle}`);
  revalidatePath("/collections/all-products");
}

export async function generateLocalProductImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const productId = String(formData.get("productId") || "");
  const product = await prisma.product.findFirstOrThrow({ where: { id: productId, storeId } });
  await writeLocalProductImage({ storeId, product });
  await logActivity(storeId, "Generated local product image", product.title);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.handle}`);
  revalidatePath("/collections/all-products");
}

export async function generateThemeSectionImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const sectionId = String(formData.get("sectionId") || "");
  const theme = await getHomeTheme(storeId);
  const sections = ((theme?.sections ?? []) as ThemeSectionData[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const section = sections.find((item) => item.id === sectionId);
  if (!section) throw new Error("Theme section not found.");

  const prompt =
    String(formData.get(`${sectionId}.imagePrompt`) || section.imagePrompt || "").trim() ||
    buildThemeImagePrompt(section);
  const generated = await uploadGeneratedAsset({ storeId, kind: "theme", targetId: section.id, prompt });

  if (!generated.configured) {
    redirect("/admin/theme?image=missing-config");
  }

  const alt = imageAltFromPrompt(prompt, section.title);
  const updatedSections = sections.map((item) =>
    item.id === section.id
      ? {
          ...item,
          imagePrompt: prompt,
          imageUrl: generated.url,
          imageAlt: alt,
        }
      : item,
  );

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId, key: "home" } },
    update: { sections: updatedSections },
    create: { storeId, key: "home", sections: updatedSections },
  });
  await prisma.imageAsset.create({
    data: {
      storeId,
      themeKey: "home",
      sectionId: section.id,
      kind: "theme",
      prompt,
      alt,
      url: generated.url,
      provider: generated.provider,
      model: generated.model,
    },
  });
  await logActivity(storeId, "Generated theme image", section.id);
  revalidatePath("/admin/theme");
  revalidatePath("/");
}

export async function clearThemeSectionImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const sectionId = String(formData.get("sectionId") || "");
  const theme = await getHomeTheme(storeId);
  const sections = ((theme?.sections ?? []) as ThemeSectionData[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const updatedSections = sections.map((section) =>
    section.id === sectionId ? { ...section, imageUrl: "", imageAlt: "" } : section,
  );
  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId, key: "home" } },
    update: { sections: updatedSections },
    create: { storeId, key: "home", sections: updatedSections },
  });
  await logActivity(storeId, "Cleared theme image", sectionId);
  revalidatePath("/admin/theme");
  revalidatePath("/");
}

export async function generateLocalThemeSectionImage(formData: FormData) {
  const storeId = await getCurrentStoreId();
  const sectionId = String(formData.get("sectionId") || "");
  const theme = await getHomeTheme(storeId);
  const sections = ((theme?.sections ?? []) as ThemeSectionData[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const section = sections.find((item) => item.id === sectionId);
  if (!section) throw new Error("Theme section not found.");

  const url = await writeLocalThemeImage({ storeId, section });
  const updatedSections = sections.map((item) =>
    item.id === section.id
      ? { ...item, imageUrl: url, imageAlt: `${section.title} theme image` }
      : item,
  );

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId, key: "home" } },
    update: { sections: updatedSections },
    create: { storeId, key: "home", sections: updatedSections },
  });
  await logActivity(storeId, "Generated local theme image", section.id);
  revalidatePath("/admin/theme");
  revalidatePath("/");
}

export async function updateAppStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.appInstallation.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/apps");
}

export async function updatePayoutStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.payout.update({ where: { id }, data: { status } });
  revalidatePath("/admin/finance");
}

export async function updateMarketStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.market.update({ where: { id }, data: { status } });
  revalidatePath("/admin/markets");
  revalidatePath("/admin/dashboard");
}

export async function updateFulfillmentStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.fulfillment.update({ where: { id }, data: { status } });
  revalidatePath("/admin/shipping");
}

export async function createPurchaseOrder(formData: FormData) {
  const store = await getStore();
  await prisma.purchaseOrder.create({
    data: {
      storeId: store.id,
      reference: `PO-${Date.now().toString().slice(-5)}`,
      expectedAt: new Date(String(formData.get("expectedAt"))),
      amount: Number(formData.get("amount") || 0),
      status: "Ordered",
    },
  });
  revalidatePath("/admin/inventory");
}

export async function createReturnCase(formData: FormData) {
  const store = await getStore();
  await prisma.returnCase.create({
    data: {
      storeId: store.id,
      caseNumber: `RMA-${Date.now().toString().slice(-5)}`,
      customer: String(formData.get("customer") || "Guest Customer"),
      reason: String(formData.get("reason") || "Review requested"),
      status: "Requested",
    },
  });
  revalidatePath("/admin/shipping");
}

export async function addToCart(formData: FormData) {
  const store = await getStore();
  const variantId = String(formData.get("variantId"));
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: true },
  });
  const cookieStore = await cookies();
  let token = cookieStore.get(CART_COOKIE)?.value;

  if (!token) {
    token = randomUUID();
    cookieStore.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  const cart = await prisma.cart.upsert({
    where: { token },
    update: {},
    create: { storeId: store.id, token },
  });

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: quantity } },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId,
      quantity,
    },
  });

  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateCartItem(formData: FormData) {
  const id = String(formData.get("id"));
  const quantity = Number(formData.get("quantity"));

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id } });
  } else {
    await prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  revalidatePath("/cart");
}

export async function checkout(formData: FormData) {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const stripe = getStripe();
  const mode = checkoutMode({ stripeConfigured: Boolean(stripe) });

  const store = await getStore();
  const name = String(formData.get("name") || "Guest Customer");
  const email = String(formData.get("email") || "guest@example.test");
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);
  const orderNumber = `SF${Math.floor(1000 + Math.random() * 9000)}`;
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { storeId_email: { storeId: store.id, email } },
      update: { name, ltv: { increment: subtotal }, status: "Returning" },
      create: {
        storeId: store.id,
        name,
        email,
        tags: ["Online Store"],
        ltv: subtotal,
        status: "New",
      },
    });

    const createdOrder = await tx.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        orderNumber,
        paymentStatus: orderPaymentStatusForMode(mode),
        fulfillmentStatus: "Unfulfilled",
        shippingStatus: "Not shipped",
        riskLevel: "Low",
        channel: "Online Store",
        subtotal,
        total: subtotal,
        paidAt: mode === "mock" ? new Date() : null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            title: item.product.title,
            sku: item.variant.sku,
            quantity: item.quantity,
            price: item.variant.price,
          })),
        },
      },
    });

    if (mode === "mock") {
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventory: { decrement: item.quantity } },
        });
      }
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "Completed" },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.transaction.create({
        data: {
          storeId: store.id,
          reference: `MOCK-${orderNumber}`,
          kind: "Mock checkout",
          amount: subtotal,
          fee: 0,
          status: "Captured",
        },
      });
    } else {
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "Pending payment" },
      });
    }

    await tx.activityLog.create({
      data: {
        storeId: store.id,
        actor: name,
        action: mode === "mock" ? "Mock checkout completed" : "Checkout session started",
        subject: orderNumber,
      },
    });

    return createdOrder;
  });

  if (mode === "mock") {
    revalidatePath("/cart");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    redirect(`/order-success/${order.orderNumber}?mode=mock`);
  }

  if (!stripe) {
    redirect("/checkout?error=stripe-env");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      cartId: cart.id,
      orderNumber: order.orderNumber,
    },
    line_items: cart.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.variant.price) * 100),
        product_data: {
          name: item.product.title,
          description: `${item.variant.color} / ${item.variant.size} · ${item.variant.sku}`,
        },
      },
    })),
    success_url: `${origin}/order-success/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?error=payment-cancelled`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) {
    redirect("/checkout?error=stripe-session");
  }

  redirect(session.url);
}
