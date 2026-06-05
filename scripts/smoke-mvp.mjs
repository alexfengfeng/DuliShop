const baseUrl = process.env.MVP_BASE_URL ?? "http://localhost:3000";

async function expectStatus(path, expected) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== expected) {
    throw new Error(`${path} expected ${expected}, got ${response.status}`);
  }
  return response;
}

await expectStatus("/", 200);
await expectStatus("/products/linen-utility-tote", 200);
await expectStatus("/cart", 200);

const admin = await expectStatus("/admin/dashboard", 307);
const location = admin.headers.get("location") ?? "";
if (!location.includes("/login")) {
  throw new Error(`/admin/dashboard should redirect to /login, got ${location}`);
}

console.log(`MVP smoke check passed against ${baseUrl}.`);
