import { describe, expect, test } from "vitest";
import {
  buildProductImagePrompt,
  buildThemeImagePrompt,
  imageGenerationConfig,
  imageStoragePath,
  missingImageGenerationKeys,
} from "./generation";

describe("image generation helpers", () => {
  test("uses safe defaults and reports missing runtime configuration", () => {
    const env = {};

    expect(imageGenerationConfig(env)).toMatchObject({
      configured: false,
      model: "gpt-image-1.5",
      quality: "medium",
      themeSize: "1536x1024",
      productSize: "1024x1024",
    });
    expect(missingImageGenerationKeys(env)).toEqual([
      "OPENAI_API_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  });

  test("honors image2 or any configured image model name", () => {
    const env = {
      OPENAI_API_KEY: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      IMAGE_GENERATION_MODEL: "image2",
      IMAGE_GENERATION_QUALITY: "high",
      IMAGE_GENERATION_SIZE: "1792x1024",
    };

    expect(imageGenerationConfig(env)).toMatchObject({
      configured: true,
      model: "image2",
      quality: "high",
      themeSize: "1792x1024",
      productSize: "1024x1024",
    });
  });

  test("builds brand-safe product and theme prompts", () => {
    expect(
      buildProductImagePrompt({
        title: "Linen Utility Tote",
        category: "Home",
        description: "A soft utility tote for daily errands.",
      }),
    ).toContain("Solace Supply");
    expect(
      buildProductImagePrompt({
        title: "Linen Utility Tote",
        category: "Home",
        description: "A soft utility tote for daily errands.",
      }),
    ).not.toContain("customer");

    expect(
      buildThemeImagePrompt({
        type: "Hero",
        title: "Calm goods for everyday rituals",
        copy: "Thoughtful storage and soft textures.",
        layout: "Editorial split",
      }),
    ).toContain("homepage Hero");
  });

  test("creates deterministic storage paths with webp extension", () => {
    expect(
      imageStoragePath({
        storeId: "store_123",
        kind: "product",
        targetId: "prod_456",
        timestamp: 1720000000000,
      }),
    ).toBe("stores/store_123/products/prod_456-1720000000000.webp");

    expect(
      imageStoragePath({
        storeId: "store_123",
        kind: "theme",
        targetId: "hero",
        timestamp: 1720000000000,
      }),
    ).toBe("stores/store_123/theme/hero-1720000000000.webp");
  });
});
