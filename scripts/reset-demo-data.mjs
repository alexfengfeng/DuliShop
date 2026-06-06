import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  }),
});

const storeDomain = process.env.DEMO_STORE_DOMAIN ?? "solace-supply.test";

async function main() {
  const store = await prisma.store.findUnique({ where: { domain: storeDomain } });
  if (!store) {
    console.log(`No store found for ${storeDomain}; nothing to reset.`);
    return;
  }

  const deletes = [
    () => prisma.shippingLabel.deleteMany({ where: { storeId: store.id } }),
    () => prisma.returnCase.deleteMany({ where: { storeId: store.id } }),
    () => prisma.fulfillment.deleteMany({ where: { storeId: store.id } }),
    () => prisma.orderItem.deleteMany({ where: { order: { storeId: store.id } } }),
    () => prisma.order.deleteMany({ where: { storeId: store.id } }),
    () => prisma.cartItem.deleteMany({ where: { cart: { storeId: store.id } } }),
    () => prisma.cart.deleteMany({ where: { storeId: store.id } }),
    () => prisma.inventoryMovement.deleteMany({ where: { storeId: store.id } }),
    () => prisma.purchaseOrder.deleteMany({ where: { storeId: store.id } }),
    () => prisma.transfer.deleteMany({ where: { storeId: store.id } }),
    () => prisma.supplier.deleteMany({ where: { storeId: store.id } }),
    () => prisma.transaction.deleteMany({ where: { storeId: store.id } }),
    () => prisma.payout.deleteMany({ where: { storeId: store.id } }),
    () => prisma.chargeback.deleteMany({ where: { storeId: store.id } }),
    () => prisma.market.deleteMany({ where: { storeId: store.id } }),
    () => prisma.reportSnapshot.deleteMany({ where: { storeId: store.id } }),
    () => prisma.appInstallation.deleteMany({ where: { storeId: store.id } }),
    () => prisma.imageAsset.deleteMany({ where: { storeId: store.id } }),
    () => prisma.productVariant.deleteMany({ where: { product: { storeId: store.id } } }),
    () => prisma.product.deleteMany({ where: { storeId: store.id } }),
    () => prisma.collection.deleteMany({ where: { storeId: store.id } }),
    () => prisma.themeConfig.deleteMany({ where: { storeId: store.id } }),
    () => prisma.customer.deleteMany({ where: { storeId: store.id } }),
    () => prisma.activityLog.deleteMany({ where: { storeId: store.id } }),
  ];

  for (const runDelete of deletes) {
    await runDelete();
  }

  console.log(`Demo data reset for ${storeDomain}. Store and users were preserved.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
