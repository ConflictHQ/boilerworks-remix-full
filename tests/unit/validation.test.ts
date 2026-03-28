import { describe, it, expect } from "vitest";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().default(""),
  price: z.coerce.number().int().min(0, "Price must be non-negative"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  isPublished: z.coerce.boolean().optional().default(false),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().default(""),
});

describe("product validation", () => {
  it("accepts valid product data", () => {
    const result = productSchema.safeParse({
      name: "Test Product",
      slug: "test-product",
      price: 1999,
      isPublished: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({
      name: "",
      slug: "test",
      price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug with uppercase", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "Test-Product",
      price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug with spaces", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test product",
      price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test",
      price: -1,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string price to number", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test",
      price: "2500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(2500);
    }
  });

  it("accepts empty categoryId", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test",
      price: 100,
      categoryId: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid uuid categoryId", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test",
      price: 100,
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid categoryId", () => {
    const result = productSchema.safeParse({
      name: "Test",
      slug: "test",
      price: 100,
      categoryId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("category validation", () => {
  it("accepts valid category data", () => {
    const result = categorySchema.safeParse({
      name: "Electronics",
      slug: "electronics",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = categorySchema.safeParse({
      name: "",
      slug: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special characters", () => {
    const result = categorySchema.safeParse({
      name: "Test",
      slug: "test_category!",
    });
    expect(result.success).toBe(false);
  });

  it("defaults description to empty string", () => {
    const result = categorySchema.safeParse({
      name: "Test",
      slug: "test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });
});
