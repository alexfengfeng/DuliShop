"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CART_COOKIE, getCart, getStore } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(4),
  category: z.string().min(2),
  price: z.coerce.number().positive(),
  inventory: z.coerce.number().int().min(0),
});

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
  const sections = ["hero", "collection", "story"].map((id, index) => ({
    id,
    title: String(formData.get(`${id}.title`) || ""),
    copy: String(formData.get(`${id}.copy`) || ""),
    cta: String(formData.get(`${id}.cta`) || ""),
    visible: formData.get(`${id}.visible`) === "on",
    sortOrder: index + 1,
  }));

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId: store.id, key: "home" } },
    update: { sections },
    create: { storeId: store.id, key: "home", sections },
  });

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
  if (!stripe) {
    redirect("/checkout?error=stripe-env");
  }

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
        paymentStatus: "Pending",
        fulfillmentStatus: "Unfulfilled",
        channel: "Online Store",
        subtotal,
        total: subtotal,
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

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "Pending payment" },
    });

    await tx.activityLog.create({
      data: {
        storeId: store.id,
        actor: name,
        action: "Checkout session started",
        subject: orderNumber,
      },
    });

    return createdOrder;
  });

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
