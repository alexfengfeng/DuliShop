import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const cartId = session.metadata?.cartId;

    if (orderId && cartId) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order || order.paymentStatus === "Paid") return;

        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "Paid",
            fulfillmentStatus: "Unfulfilled",
            shippingStatus: "Ready to ship",
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
            paidAt: new Date(),
          },
        });

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventory: { decrement: item.quantity } },
          });
        }

        await tx.cart.update({
          where: { id: cartId },
          data: { status: "Converted", items: { deleteMany: {} } },
        });

        await tx.transaction.create({
          data: {
            storeId: order.storeId,
            reference: `STRIPE-${session.id}`,
            kind: "Stripe checkout",
            amount: order.total,
            fee: 0,
            status: "Captured",
          },
        });

        await tx.activityLog.create({
          data: {
            storeId: order.storeId,
            actor: "Stripe",
            action: "Payment captured",
            subject: order.orderNumber,
          },
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
