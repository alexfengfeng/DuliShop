const baseUrl = process.env.MVP_BASE_URL ?? "http://localhost:3000";

async function expectStatus(path, expected) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== expected) {
    throw new Error(`${path} expected ${expected}, got ${response.status}`);
  }
  return response;
}

async function expectBodyIncludes(path, token) {
  const response = await expectStatus(path, 200);
  const body = await response.text();
  if (!body.includes(token)) {
    throw new Error(`${path} expected body to include ${token}`);
  }
  return body;
}

await expectBodyIncludes("/", "/generated/products/linen-utility-tote.svg");
await expectBodyIncludes("/", "/generated/theme/hero.svg");
await expectBodyIncludes("/products/linen-utility-tote", "/generated/products/linen-utility-tote.svg");
await expectStatus("/cart", 200);
const checkoutBody = await expectStatus("/checkout", 200).then((response) => response.text());
if (!checkoutBody.includes("Mock demo payment") && !checkoutBody.includes("Stripe test checkout")) {
  throw new Error("/checkout expected either mock or Stripe checkout payment option");
}

const admin = await expectStatus("/admin/dashboard", 307);
const location = admin.headers.get("location") ?? "";
if (!location.includes("/login")) {
  throw new Error(`/admin/dashboard should redirect to /login, got ${location}`);
}

console.log(`MVP smoke check passed against ${baseUrl}.`);
