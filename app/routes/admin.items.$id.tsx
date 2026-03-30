import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, Link } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { items, categories } from "~/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";
import { logAudit } from "~/services/audit.server";

const itemSchema = z.object({
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requirePermission(request, "items.read");

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, params.id!), isNull(items.deletedAt)))
    .limit(1);

  if (!item) throw new Response("Not Found", { status: 404 });

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.deletedAt));

  return json({ item, categories: cats });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const user = await requirePermission(request, "items.delete");

    await db
      .update(items)
      .set({ deletedAt: new Date(), deletedBy: user.id })
      .where(eq(items.id, params.id!));

    await logAudit({
      userId: user.id,
      action: "delete",
      entityType: "item",
      entityId: params.id,
    });

    return redirect("/admin/items");
  }

  const user = await requirePermission(request, "items.update");

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    isPublished: formData.get("isPublished") === "on",
  };

  const parsed = itemSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { ok: false as const, errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  await db
    .update(items)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId || null,
      isPublished: data.isPublished,
      updatedAt: new Date(),
      updatedBy: user.id,
    })
    .where(eq(items.id, params.id!));

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "item",
    entityId: params.id,
    details: { name: data.name },
  });

  return redirect("/admin/items");
}

export default function EditItem() {
  const { item, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/items" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to items
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">Edit Item</h1>
      </div>

      <div className="card max-w-2xl">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input"
              defaultValue={item.name}
            />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="label">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              className="input"
              defaultValue={item.slug}
            />
            {actionData?.errors?.slug && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.slug[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input"
              defaultValue={item.description || ""}
            />
          </div>

          <div>
            <label htmlFor="price" className="label">
              Price (cents)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              className="input"
              defaultValue={item.price}
            />
            {actionData?.errors?.price && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.price[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoryId" className="label">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="input"
              defaultValue={item.categoryId || ""}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              className="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-600"
              defaultChecked={item.isPublished}
            />
            <label htmlFor="isPublished" className="text-sm text-surface-300">
              Published
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <Link to="/admin/items" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </div>
        </Form>

        <div className="mt-6 border-t border-surface-700 pt-6">
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <button
              type="submit"
              className="btn-danger"
              onClick={(e) => {
                if (!confirm("Delete this item?")) e.preventDefault();
              }}
            >
              Delete Item
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
