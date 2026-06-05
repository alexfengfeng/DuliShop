import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import type { ResourceName } from "@/lib/admin/schemas";

export const resourceRoutes: Record<ResourceName, string> = {
  order: "/admin/orders",
  product: "/admin/products",
  productVariant: "/admin/products",
  customer: "/admin/customers",
  payout: "/admin/finance",
  transaction: "/admin/finance",
  chargeback: "/admin/finance",
  supplier: "/admin/inventory",
  purchaseOrder: "/admin/inventory",
  transfer: "/admin/inventory",
  inventoryMovement: "/admin/inventory",
  fulfillment: "/admin/shipping",
  returnCase: "/admin/shipping",
  shippingLabel: "/admin/shipping",
  market: "/admin/markets",
  reportSnapshot: "/admin/reports",
  appInstallation: "/admin/apps",
};

export async function getCurrentStoreId() {
  const store = await getStore();
  return store.id;
}

export async function logActivity(storeId: string, action: string, subject: string, actor = "Admin") {
  await prisma.activityLog.create({
    data: { storeId, actor, action, subject },
  });
}

export function revalidateResource(resource: ResourceName) {
  revalidatePath(resourceRoutes[resource]);
  revalidatePath("/admin/dashboard");
}

export function normalizeOptionalRelation(value: unknown) {
  const id = String(value ?? "").trim();
  return id ? id : null;
}
