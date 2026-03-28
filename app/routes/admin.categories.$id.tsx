import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, Link } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { categories } from "~/db/schema";
import { eq, isNull, and } from "drizzle-orm";
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requirePermission(request, "categories.read");

  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, params.id!), isNull(categories.deletedAt)))
    .limit(1);

  if (!category) throw new Response("Not Found", { status: 404 });

  return json({ category });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const user = await requirePermission(request, "categories.delete");

    await db
      .update(categories)
      .set({ deletedAt: new Date(), deletedBy: user.id })
      .where(eq(categories.id, params.id!));

    await logAudit({
      userId: user.id,
      action: "delete",
      entityType: "category",
      entityId: params.id,
    });

    return redirect("/admin/categories");
  }

  const user = await requirePermission(request, "categories.update");

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false as const, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      updatedAt: new Date(),
      updatedBy: user.id,
    })
    .where(eq(categories.id, params.id!));

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "category",
    entityId: params.id,
    details: { name: data.name },
  });

  return redirect("/admin/categories");
}

export default function EditCategory() {
  const { category } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/categories" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">Edit Category</h1>
      </div>

      <div className="card max-w-2xl">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" type="text" required className="input" defaultValue={category.name} />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="label">Slug</label>
            <input id="slug" name="slug" type="text" required className="input" defaultValue={category.slug} />
            {actionData?.errors?.slug && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.slug[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" name="description" rows={3} className="input" defaultValue={category.description || ""} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <Link to="/admin/categories" className="btn-secondary">Cancel</Link>
            </div>
          </div>
        </Form>

        <div className="mt-6 border-t border-surface-700 pt-6">
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <button type="submit" className="btn-danger" onClick={(e) => { if (!confirm("Delete this category?")) e.preventDefault(); }}>
              Delete Category
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
