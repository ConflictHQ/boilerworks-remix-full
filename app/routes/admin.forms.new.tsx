import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { formDefinitions } from "~/db/schema";
import { requirePermission } from "~/services/session.server";
import { logAudit } from "~/services/audit.server";

const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "email", "number", "textarea", "select", "checkbox"]),
  label: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

const formDefSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().default(""),
  schema: z.string().min(1, "Schema JSON is required"),
  isActive: z.coerce.boolean().optional().default(true),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "forms.create");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requirePermission(request, "forms.create");
  const formData = await request.formData();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    schema: formData.get("schema"),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = formDefSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false as const, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  let schemaObj;
  try {
    schemaObj = JSON.parse(parsed.data.schema);
    const fieldsResult = z.object({ fields: z.array(fieldSchema) }).safeParse(schemaObj);
    if (!fieldsResult.success) {
      return json(
        { ok: false as const, errors: { schema: ["Schema must have a valid fields array"] } },
        { status: 400 },
      );
    }
  } catch {
    return json(
      { ok: false as const, errors: { schema: ["Invalid JSON"] } },
      { status: 400 },
    );
  }

  const [formDef] = await db
    .insert(formDefinitions)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      schema: schemaObj,
      isActive: parsed.data.isActive,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "form_definition",
    entityId: formDef.id,
    details: { name: formDef.name },
  });

  return redirect("/admin/forms");
}

const exampleSchema = JSON.stringify(
  {
    fields: [
      { name: "name", type: "text", label: "Full Name", required: true },
      { name: "email", type: "email", label: "Email Address", required: true },
      { name: "message", type: "textarea", label: "Message", required: false },
    ],
  },
  null,
  2,
);

export default function NewFormDefinition() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/forms" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to forms
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">New Form Definition</h1>
      </div>

      <div className="card max-w-2xl">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" type="text" required className="input" />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="label">Slug</label>
            <input id="slug" name="slug" type="text" required className="input" />
            {actionData?.errors?.slug && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.slug[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" name="description" rows={2} className="input" />
          </div>

          <div>
            <label htmlFor="schema" className="label">Schema (JSON)</label>
            <textarea
              id="schema"
              name="schema"
              rows={12}
              required
              className="input font-mono text-sm"
              defaultValue={exampleSchema}
            />
            {actionData?.errors?.schema && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.schema[0]}</p>
            )}
            <p className="mt-1 text-xs text-surface-500">
              Field types: text, email, number, textarea, select, checkbox
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-600" />
            <label htmlFor="isActive" className="text-sm text-surface-300">Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Creating..." : "Create Form"}
            </button>
            <Link to="/admin/forms" className="btn-secondary">Cancel</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
