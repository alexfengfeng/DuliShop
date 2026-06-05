import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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

const outputDir = join(process.cwd(), "public", "generated", "products");

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeFileName(value) {
  return String(value ?? "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

function themeFor(product) {
  const text = `${product.title} ${product.category}`.toLowerCase();
  if (text.includes("tote") || text.includes("bag")) return "tote";
  if (text.includes("pantry") || text.includes("set") || text.includes("home")) return "pantry";
  if (text.includes("tray") || text.includes("desk") || text.includes("ceramic")) return "tray";
  return "generic";
}

function palette(seedColor) {
  return {
    base: seedColor || "#e8f2dd",
    ink: "#173326",
    sage: "#9caf98",
    clay: "#d9a38b",
    cream: "#fbfaf6",
    paper: "#f4efe5",
    blue: "#abc1d5",
    charcoal: "#3d4640",
  };
}

function toteArt(colors) {
  return `
    <ellipse cx="610" cy="725" rx="315" ry="45" fill="#000" opacity=".08"/>
    <path d="M415 335 C430 235 515 190 600 190 C685 190 770 235 785 335" fill="none" stroke="${colors.ink}" stroke-width="34" stroke-linecap="round"/>
    <path d="M350 320 C342 304 353 285 371 284 L829 284 C847 285 858 304 850 320 L790 710 C787 732 769 748 746 748 L404 748 C381 748 363 732 360 710 Z" fill="url(#toteFill)" stroke="${colors.ink}" stroke-width="10"/>
    <path d="M430 350 L392 690" stroke="#fff" stroke-width="7" opacity=".45"/>
    <path d="M765 350 L724 690" stroke="#7d8f82" stroke-width="7" opacity=".32"/>
    <rect x="475" y="446" width="250" height="160" rx="28" fill="#fff" opacity=".22" stroke="#fff" stroke-width="6"/>
    <circle cx="455" cy="352" r="16" fill="${colors.ink}"/>
    <circle cx="745" cy="352" r="16" fill="${colors.ink}"/>
  `;
}

function pantryArt(colors) {
  return `
    <ellipse cx="610" cy="735" rx="360" ry="50" fill="#000" opacity=".08"/>
    <rect x="285" y="620" width="630" height="48" rx="24" fill="${colors.ink}" opacity=".14"/>
    <g transform="translate(310 190)">
      <rect x="0" y="120" width="175" height="410" rx="42" fill="url(#glassFill)" stroke="${colors.ink}" stroke-width="9"/>
      <rect x="25" y="82" width="125" height="72" rx="20" fill="${colors.clay}" stroke="${colors.ink}" stroke-width="7"/>
      <path d="M34 270 C78 242 117 292 164 255 L164 492 L34 492 Z" fill="${colors.sage}" opacity=".55"/>
      <circle cx="88" cy="345" r="42" fill="${colors.cream}" opacity=".55"/>
    </g>
    <g transform="translate(512 130)">
      <rect x="0" y="150" width="205" height="470" rx="48" fill="url(#glassFill)" stroke="${colors.ink}" stroke-width="10"/>
      <rect x="30" y="92" width="145" height="92" rx="22" fill="${colors.sage}" stroke="${colors.ink}" stroke-width="8"/>
      <path d="M42 332 C93 292 150 358 194 312 L194 584 L42 584 Z" fill="${colors.clay}" opacity=".55"/>
      <circle cx="104" cy="440" r="54" fill="${colors.cream}" opacity=".52"/>
    </g>
    <g transform="translate(742 250)">
      <rect x="0" y="105" width="155" height="350" rx="38" fill="url(#glassFill)" stroke="${colors.ink}" stroke-width="8"/>
      <rect x="24" y="62" width="108" height="66" rx="18" fill="${colors.blue}" stroke="${colors.ink}" stroke-width="7"/>
      <path d="M28 245 C62 220 101 263 147 229 L147 424 L28 424 Z" fill="${colors.sage}" opacity=".58"/>
    </g>
  `;
}

function trayArt(colors) {
  return `
    <ellipse cx="610" cy="730" rx="350" ry="52" fill="#000" opacity=".08"/>
    <path d="M315 455 C330 365 414 315 530 318 L750 323 C858 326 925 385 928 474 C932 587 839 677 662 694 L512 708 C395 718 300 648 294 555 C292 522 301 485 315 455 Z" fill="url(#ceramicFill)" stroke="${colors.ink}" stroke-width="10"/>
    <path d="M396 470 C427 414 495 389 585 395 L722 402 C800 407 850 444 852 502 C854 574 786 624 665 637 L526 652 C448 661 378 619 373 556 C371 529 382 495 396 470 Z" fill="${colors.cream}" opacity=".74" stroke="#fff" stroke-width="8"/>
    <rect x="500" y="345" width="200" height="42" rx="21" fill="${colors.charcoal}" opacity=".9"/>
    <rect x="465" y="322" width="92" height="45" rx="18" fill="${colors.clay}" transform="rotate(-12 511 345)"/>
    <circle cx="740" cy="460" r="36" fill="${colors.sage}" opacity=".9"/>
    <path d="M452 575 L580 535" stroke="${colors.ink}" stroke-width="14" stroke-linecap="round" opacity=".7"/>
    <path d="M600 528 L690 500" stroke="${colors.ink}" stroke-width="9" stroke-linecap="round" opacity=".35"/>
  `;
}

function genericArt(colors) {
  return `
    <ellipse cx="610" cy="730" rx="330" ry="52" fill="#000" opacity=".08"/>
    <rect x="340" y="260" width="520" height="430" rx="82" fill="url(#boxFill)" stroke="${colors.ink}" stroke-width="10"/>
    <rect x="425" y="340" width="350" height="110" rx="34" fill="#fff" opacity=".24"/>
    <circle cx="505" cy="550" r="58" fill="${colors.clay}" opacity=".86"/>
    <circle cx="650" cy="555" r="86" fill="${colors.sage}" opacity=".82"/>
    <circle cx="760" cy="535" r="44" fill="${colors.blue}" opacity=".82"/>
  `;
}

function productSvg(product) {
  const colors = palette(product.mediaColor);
  const title = escapeXml(product.title);
  const category = escapeXml(product.category);
  const theme = themeFor(product);
  const art = theme === "tote" ? toteArt(colors) : theme === "pantry" ? pantryArt(colors) : theme === "tray" ? trayArt(colors) : genericArt(colors);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Local Solace Supply product image for ${title}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.cream}"/>
      <stop offset=".48" stop-color="${colors.base}"/>
      <stop offset="1" stop-color="${colors.paper}"/>
    </linearGradient>
    <linearGradient id="toteFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.base}"/>
      <stop offset="1" stop-color="${colors.sage}"/>
    </linearGradient>
    <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".78"/>
      <stop offset="1" stop-color="#dce7db" stop-opacity=".58"/>
    </linearGradient>
    <linearGradient id="ceramicFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8f1e8"/>
      <stop offset=".55" stop-color="${colors.blue}"/>
      <stop offset="1" stop-color="#d9d1c4"/>
    </linearGradient>
    <linearGradient id="boxFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.base}"/>
      <stop offset=".6" stop-color="${colors.clay}"/>
      <stop offset="1" stop-color="${colors.blue}"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#173326" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <circle cx="1050" cy="118" r="170" fill="#fff" opacity=".28"/>
  <circle cx="155" cy="735" r="210" fill="#fff" opacity=".32"/>
  <g filter="url(#softShadow)">${art}</g>
  <g transform="translate(86 82)">
    <rect x="0" y="0" width="290" height="84" rx="42" fill="#fff" opacity=".72"/>
    <text x="32" y="36" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="${colors.ink}" letter-spacing="2">${category.toUpperCase()}</text>
    <text x="32" y="62" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#647067">Solace Supply</text>
  </g>
  <text x="86" y="824" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="900" fill="${colors.ink}">${title}</text>
</svg>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const products = await prisma.product.findMany({
    include: { store: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!products.length) {
    console.log("No products found.");
    return;
  }

  for (const product of products) {
    const fileName = `${safeFileName(product.handle || product.title)}.svg`;
    const publicUrl = `/generated/products/${fileName}`;
    const path = join(outputDir, fileName);
    const svg = productSvg(product);

    await writeFile(path, svg, "utf8");
    await prisma.imageAsset.deleteMany({
      where: { storeId: product.storeId, productId: product.id, provider: "local-svg" },
    });
    await prisma.imageAsset.create({
      data: {
        storeId: product.storeId,
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
      data: {
        featuredImageUrl: publicUrl,
        featuredImageAlt: `${product.title} product image`,
      },
    });

    console.log(`${product.title}: ${publicUrl}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
