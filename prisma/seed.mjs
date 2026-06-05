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

const storeDomain = "solace-supply.test";

const themeSections = [
  {
    id: "hero",
    title: "Calm goods for everyday rituals",
    copy: "Thoughtful storage, soft textures, and desk objects for a slower home.",
    cta: "Shop the collection",
    visible: true,
    sortOrder: 1,
    type: "Hero",
    layout: "Editorial split",
    imagePosition: "Right",
    imagePrompt: "Warm daylight editorial hero image for calm home goods, soft textiles, ceramic trays, and organized daily rituals.",
    imageUrl: "",
    imageAlt: "",
  },
  {
    id: "collection",
    title: "Designed for daily order",
    copy: "Utility totes, stackable pantry objects, and desk pieces in quiet materials.",
    cta: "Browse essentials",
    visible: true,
    sortOrder: 2,
    type: "Collection feature",
    layout: "Image band",
    imagePosition: "Left",
    imagePrompt: "Organized product collection scene with totes, pantry containers, and desk objects in neutral natural materials.",
    imageUrl: "",
    imageAlt: "",
  },
  {
    id: "story",
    title: "A slower supply cabinet",
    copy: "Solace Supply creates practical pieces that make small routines feel considered.",
    cta: "Read our story",
    visible: true,
    sortOrder: 3,
    type: "Story",
    layout: "Text first",
    imagePosition: "Right",
    imagePrompt: "Quiet brand story image for modern practical home goods, slow living, warm shelving, and soft shadows.",
    imageUrl: "",
    imageAlt: "",
  },
];

const appSeeds = [
  { appKey: "klaviyo", name: "Klaviyo", category: "Marketing", billing: "$420/mo", scopes: ["Customers", "Marketing"], status: "Installed" },
  { appKey: "shipstation", name: "ShipStation", category: "Fulfillment", billing: "$159/mo", scopes: ["Orders", "Fulfillment"], status: "Available" },
  { appKey: "reviews-pro", name: "Reviews Pro", category: "Storefront", billing: "Usage based", scopes: ["Products", "Storefront"], status: "Available" },
];

async function main() {
  const store = await prisma.store.upsert({
    where: { domain: storeDomain },
    update: {},
    create: {
      name: "Solace Supply",
      domain: storeDomain,
      currency: "USD",
      language: "en",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@solacesupply.test" },
    update: {},
    create: {
      storeId: store.id,
      email: "admin@solacesupply.test",
      name: "Avery Stone",
      role: "owner",
    },
  });

  const collection = await prisma.collection.upsert({
    where: { storeId_handle: { storeId: store.id, handle: "all-products" } },
    update: {},
    create: {
      storeId: store.id,
      title: "All products",
      handle: "all-products",
      description: "Practical pieces for home, desk, and daily routines.",
    },
  });

  const products = [
    { title: "Linen Utility Tote", handle: "linen-utility-tote", description: "A soft-sided carryall with reinforced seams, calm colors, and room for market days or work tools.", category: "Bags", color: "#e8f2dd", price: 68, imagePrompt: "Premium product photo of a linen utility tote in natural sage fabric, warm daylight, clean ecommerce background." },
    { title: "Stackable Pantry Set", handle: "stackable-pantry-set", description: "Modular storage vessels that keep dry goods visible and counters quiet.", category: "Home", color: "#f7d7c3", price: 54, imagePrompt: "Premium product photo of stackable pantry storage vessels with dry goods, calm kitchen counter, natural daylight." },
    { title: "Ceramic Desk Tray", handle: "ceramic-desk-tray", description: "A low ceramic tray for keys, notes, chargers, and the soft chaos of a workday.", category: "Desk", color: "#c8d9ed", price: 42, imagePrompt: "Premium product photo of a low ceramic desk tray holding keys notes and charger, minimal desk styling, soft daylight." },
  ];

  for (const productSeed of products) {
    const product = await prisma.product.upsert({
      where: { storeId_handle: { storeId: store.id, handle: productSeed.handle } },
      update: {
        description: productSeed.description,
        category: productSeed.category,
        mediaColor: productSeed.color,
        imagePrompt: productSeed.imagePrompt,
      },
      create: {
        storeId: store.id,
        collectionId: collection.id,
        title: productSeed.title,
        handle: productSeed.handle,
        description: productSeed.description,
        status: "Active",
        category: productSeed.category,
        mediaColor: productSeed.color,
        imagePrompt: productSeed.imagePrompt,
      },
    });

    for (const color of ["Sage", "Natural", "Charcoal"]) {
      for (const size of ["S", "M", "L"]) {
        const sku = `${productSeed.handle.slice(0, 3).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            color,
            size,
            price: productSeed.price,
            inventory: size === "S" ? 8 : 18,
            reservedInventory: size === "S" ? 2 : 4,
            incomingInventory: size === "S" ? 12 : 6,
            status: "Active",
          },
        });
      }
    }
  }

  const customers = [
    { name: "Avery Stone", email: "avery@example.test", tags: ["VIP"], ltv: 418, status: "VIP" },
    { name: "Mina Chen", email: "mina@example.test", tags: ["At risk"], ltv: 126, status: "At risk" },
    { name: "Jon Bell", email: "jon@example.test", tags: ["New"], ltv: 68, status: "New" },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { storeId_email: { storeId: store.id, email: customer.email } },
      update: {},
      create: { storeId: store.id, ...customer },
    });
  }

  await prisma.themeConfig.upsert({
    where: { storeId_key: { storeId: store.id, key: "home" } },
    update: { sections: themeSections },
    create: { storeId: store.id, key: "home", sections: themeSections },
  });

  for (const app of appSeeds) {
    await prisma.appInstallation.upsert({
      where: { storeId_appKey: { storeId: store.id, appKey: app.appKey } },
      update: {},
      create: { storeId: store.id, ...app },
    });
  }

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  for (const payout of [
    { reference: "POUT-1001", amount: 1284.32, method: "Bank transfer", status: "Scheduled", scheduledAt: new Date(now.getTime() + day) },
    { reference: "POUT-1002", amount: 842.18, method: "Bank transfer", status: "Paid", scheduledAt: new Date(now.getTime() - day * 2) },
  ]) {
    await prisma.payout.upsert({
      where: { reference: payout.reference },
      update: payout,
      create: { storeId: store.id, ...payout },
    });
  }

  for (const transaction of [
    { reference: "TXN-9001", kind: "Online payment", amount: 168, fee: 5.18, status: "Captured" },
    { reference: "TXN-9002", kind: "Refund", amount: -42, fee: 0, status: "Posted" },
  ]) {
    await prisma.transaction.upsert({
      where: { reference: transaction.reference },
      update: transaction,
      create: { storeId: store.id, ...transaction },
    });
  }

  for (const chargeback of [
    { caseNumber: "CB-3101", customer: "Mina Chen", amount: 68, reason: "Product not received", status: "Needs evidence", dueAt: new Date(now.getTime() + day * 6) },
  ]) {
    await prisma.chargeback.upsert({
      where: { caseNumber: chargeback.caseNumber },
      update: chargeback,
      create: { storeId: store.id, ...chargeback },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { id: "supplier-northstar" },
    update: {},
    create: { id: "supplier-northstar", storeId: store.id, name: "Northstar Textiles", contact: "ops@northstar.test", status: "Active" },
  });

  for (const purchaseOrder of [
    { reference: "PO-4401", supplierId: supplier.id, expectedAt: new Date(now.getTime() + day * 10), amount: 3200, status: "Ordered" },
    { reference: "PO-4402", supplierId: supplier.id, expectedAt: new Date(now.getTime() + day * 3), amount: 1450, status: "Partially received" },
  ]) {
    await prisma.purchaseOrder.upsert({
      where: { reference: purchaseOrder.reference },
      update: purchaseOrder,
      create: { storeId: store.id, ...purchaseOrder },
    });
  }

  for (const transfer of [
    { reference: "TR-2201", fromLocation: "Warehouse", toLocation: "Downtown POS", units: 42, status: "In transit" },
    { reference: "TR-2202", fromLocation: "Warehouse", toLocation: "Pop-up", units: 18, status: "Ready" },
  ]) {
    await prisma.transfer.upsert({
      where: { reference: transfer.reference },
      update: transfer,
      create: { storeId: store.id, ...transfer },
    });
  }

  for (const movement of [
    { reference: "MOV-7001", kind: "Receipt", location: "Warehouse", quantity: 64, status: "Posted" },
    { reference: "MOV-7002", kind: "Adjustment", location: "Downtown POS", quantity: -3, status: "Review" },
  ]) {
    await prisma.inventoryMovement.upsert({
      where: { reference: movement.reference },
      update: movement,
      create: { storeId: store.id, ...movement },
    });
  }

  for (const fulfillment of [
    { reference: "FUL-5001", carrier: "UPS", status: "Queued" },
    { reference: "FUL-5002", carrier: "USPS", status: "Packed" },
  ]) {
    await prisma.fulfillment.upsert({
      where: { reference: fulfillment.reference },
      update: fulfillment,
      create: { storeId: store.id, ...fulfillment },
    });
  }

  for (const returnCase of [
    { caseNumber: "RMA-6101", customer: "Avery Stone", reason: "Size exchange", status: "Requested" },
    { caseNumber: "RMA-6102", customer: "Jon Bell", reason: "Damaged item", status: "Approved" },
  ]) {
    await prisma.returnCase.upsert({
      where: { caseNumber: returnCase.caseNumber },
      update: returnCase,
      create: { storeId: store.id, ...returnCase },
    });
  }

  for (const label of [
    { labelNumber: "LBL-8001", carrier: "UPS", cost: 9.82, status: "Purchased" },
    { labelNumber: "LBL-8002", carrier: "DHL", cost: 18.44, status: "Exception" },
  ]) {
    await prisma.shippingLabel.upsert({
      where: { labelNumber: label.labelNumber },
      update: label,
      create: { storeId: store.id, ...label },
    });
  }

  for (const market of [
    { name: "United States", region: "North America", currency: "USD", language: "en", status: "Active" },
    { name: "Canada", region: "North America", currency: "CAD", language: "en", status: "Review" },
    { name: "Australia", region: "APAC", currency: "AUD", language: "en", status: "Draft" },
  ]) {
    await prisma.market.upsert({
      where: { storeId_name: { storeId: store.id, name: market.name } },
      update: market,
      create: { storeId: store.id, ...market },
    });
  }

  for (const report of [
    { name: "Sales trend", kind: "Sales", status: "Ready", data: [{ label: "Mon", value: 420 }, { label: "Tue", value: 680 }, { label: "Wed", value: 540 }, { label: "Thu", value: 890 }] },
    { name: "Top products", kind: "Merchandising", status: "Ready", data: [{ label: "Tote", value: 32 }, { label: "Pantry", value: 24 }, { label: "Tray", value: 18 }] },
  ]) {
    await prisma.reportSnapshot.upsert({
      where: { storeId_name: { storeId: store.id, name: report.name } },
      update: report,
      create: { storeId: store.id, ...report },
    });
  }

  await prisma.activityLog.create({
    data: {
      storeId: store.id,
      actor: "Seed",
      action: "Demo data refreshed",
      subject: "Solace Supply",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
