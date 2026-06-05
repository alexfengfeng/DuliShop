type ImageEnv = Partial<Record<string, string | undefined>>;

export type ImageKind = "product" | "theme";

export type ImageGenerationConfig = {
  configured: boolean;
  model: string;
  quality: string;
  themeSize: string;
  productSize: string;
  openAiApiKey?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
};

const requiredKeys = ["OPENAI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export function missingImageGenerationKeys(env: ImageEnv = process.env) {
  return requiredKeys.filter((key) => !env[key]);
}

export function imageGenerationConfig(env: ImageEnv = process.env): ImageGenerationConfig {
  return {
    configured: missingImageGenerationKeys(env).length === 0,
    model: env.IMAGE_GENERATION_MODEL || "gpt-image-1.5",
    quality: env.IMAGE_GENERATION_QUALITY || "medium",
    themeSize: env.IMAGE_GENERATION_SIZE || "1536x1024",
    productSize: "1024x1024",
    openAiApiKey: env.OPENAI_API_KEY,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function buildProductImagePrompt(product: {
  title: string;
  category?: string | null;
  description?: string | null;
}) {
  const parts = [
    `Create a premium ecommerce product image for Solace Supply.`,
    `Product: ${product.title}.`,
    product.category ? `Category: ${product.category}.` : "",
    product.description ? `Product notes: ${product.description}.` : "",
    "Style: calm modern independent store, natural materials, warm daylight, editorial but inspectable product detail, no logos, no text overlay, no people, no private data.",
  ];
  return parts.filter(Boolean).join(" ");
}

export function buildThemeImagePrompt(section: {
  type?: string | null;
  title: string;
  copy?: string | null;
  layout?: string | null;
}) {
  const type = section.type || "section";
  const layout = section.layout || "balanced editorial commerce layout";
  return [
    `Create a Solace Supply storefront homepage ${type} image.`,
    `Headline mood: ${section.title}.`,
    section.copy ? `Supporting direction: ${section.copy}.` : "",
    `Layout: ${layout}.`,
    "Visual style: polished modern Shopify-like independent store, natural home goods, soft textures, practical objects, realistic lighting, no logos, no text overlay, no copyrighted brand assets.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function imageStoragePath({
  storeId,
  kind,
  targetId,
  timestamp = Date.now(),
}: {
  storeId: string;
  kind: ImageKind;
  targetId: string;
  timestamp?: number;
}) {
  const folder = kind === "product" ? "products" : "theme";
  return `stores/${storeId}/${folder}/${targetId}-${timestamp}.webp`;
}

export function imageAltFromPrompt(prompt: string, fallback: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

export async function generateOpenAiImage({
  prompt,
  kind,
  config = imageGenerationConfig(),
}: {
  prompt: string;
  kind: ImageKind;
  config?: ImageGenerationConfig;
}) {
  if (!config.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for image generation.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      size: kind === "product" ? config.productSize : config.themeSize,
      quality: config.quality,
      output_format: "webp",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Image generation failed: ${response.status} ${body.slice(0, 220)}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const image = payload.data?.[0];
  if (image?.b64_json) {
    return { bytes: Buffer.from(image.b64_json, "base64"), contentType: "image/webp", model: config.model };
  }
  if (image?.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) throw new Error("Generated image URL could not be downloaded.");
    return {
      bytes: Buffer.from(await imageResponse.arrayBuffer()),
      contentType: imageResponse.headers.get("content-type") || "image/webp",
      model: config.model,
    };
  }
  throw new Error("Image generation response did not include image data.");
}
