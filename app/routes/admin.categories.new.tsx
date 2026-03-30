import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { categories } from "~/db/schema";
import { requirePermission } from "~/services/session.server";
import { logAudit } from "~/services/audit.server";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().default(""),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "categories.create");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requirePermission(request, "categories.create");
  const formData = await request.formData();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { ok: false as const, errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const [category] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "category",
    entityId: category.id,
    details: { name: category.name },
  });

  return redirect("/admin/categories");
}

export default function NewCategory() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/categories" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">New Category</h1>
      </div>

      <div className="card max-w-2xl">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Name
            </label>
            <input id="name" name="name" type="text" required className="input" />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="label">
              Slug
            </label>
            <input id="slug" name="slug" type="text" required className="input" />
            {actionData?.errors?.slug && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.slug[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea id="description" name="description" rows={3} className="input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Creating..." : "Create Category"}
            </button>
            <Link to="/admin/categories" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
