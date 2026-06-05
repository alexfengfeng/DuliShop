import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const STORE_DOMAIN = "solace-supply.test";
export const CART_COOKIE = "solace_cart";

export async function getStore() {
  return prisma.store.findUniqueOrThrow({
    where: { domain: STORE_DOMAIN },
  });
}

export async function getHomeTheme(storeId: string) {
  return prisma.themeConfig.findUnique({
    where: { storeId_key: { storeId, key: "home" } },
  });
}

export async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value;
}

export async function getCart() {
  const token = await getCartToken();
  if (!token) return null;

  return prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export function cartTotal(cart: Awaited<ReturnType<typeof getCart>>) {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);
}

export async function adminSearch(query?: string) {
  const store = await getStore();
  const q = query?.trim();

  const [orders, products, customers] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId: store.id,
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customer: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.product.findMany({
      where: {
        storeId: store.id,
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { variants: true, collection: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.customer.findMany({
      where: {
        storeId: store.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return { store, orders, products, customers };
}
