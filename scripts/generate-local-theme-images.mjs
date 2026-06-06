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

const outputDir = join(process.cwd(), "public", "generated", "theme");

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeFileName(value) {
  return String(value ?? "section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "section";
}

function sectionSvg(section) {
  const title = escapeXml(section.title);
  const copy = escapeXml(section.copy || "Solace Supply storefront section");
  const type = escapeXml(section.type || "Theme section");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title><desc id="desc">Local theme image for ${title}</desc>
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfaf6"/><stop offset=".5" stop-color="#e8f2dd"/><stop offset="1" stop-color="#f7d7c3"/></linearGradient><linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".88"/><stop offset="1" stop-color="#c8d9ed" stop-opacity=".72"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="26" stdDeviation="34" flood-color="#173326" flood-opacity=".16"/></filter></defs>
  <rect width="1600" height="1000" fill="url(#bg)"/><circle cx="1360" cy="120" r="260" fill="#fff" opacity=".34"/><circle cx="240" cy="840" r="320" fill="#fff" opacity=".3"/>
  <g filter="url(#shadow)"><rect x="865" y="190" width="410" height="520" rx="54" fill="url(#panel)" stroke="#173326" stroke-width="9"/><rect x="1010" y="105" width="345" height="455" rx="52" fill="#fbfaf6" stroke="#173326" stroke-width="9"/><rect x="725" y="370" width="315" height="310" rx="48" fill="#d9a38b" stroke="#173326" stroke-width="8" opacity=".9"/><circle cx="1178" cy="370" r="88" fill="#9caf98" opacity=".86"/></g>
  <g transform="translate(110 130)"><rect x="0" y="0" width="420" height="94" rx="47" fill="#fff" opacity=".78"/><text x="38" y="39" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="#173326" letter-spacing="3">${type.toUpperCase()}</text><text x="38" y="67" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#647067">Solace Supply</text></g>
  <text x="110" y="785" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="900" fill="#173326">${title}</text><text x="112" y="842" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#647067">${copy}</text>
</svg>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const themes = await prisma.themeConfig.findMany({ where: { key: "home" } });

  for (const theme of themes) {
    const sections = [...theme.sections].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const updatedSections = [];
    for (const section of sections) {
      const fileName = `${safeFileName(section.id || section.title)}.svg`;
      const publicUrl = `/generated/theme/${fileName}`;
      await writeFile(join(outputDir, fileName), sectionSvg(section), "utf8");
      await prisma.imageAsset.deleteMany({
        where: { storeId: theme.storeId, themeKey: "home", sectionId: section.id, provider: "local-svg" },
      });
      await prisma.imageAsset.create({
        data: {
          storeId: theme.storeId,
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
      updatedSections.push({ ...section, imageUrl: publicUrl, imageAlt: `${section.title} theme image` });
      console.log(`${section.title}: ${publicUrl}`);
    }
    await prisma.themeConfig.update({ where: { id: theme.id }, data: { sections: updatedSections } });
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
