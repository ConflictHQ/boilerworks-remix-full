import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { workflowDefinitions } from "~/db/schema";
import { requirePermission } from "~/services/session.server";
import { logAudit } from "~/services/audit.server";

const stateSchema = z.object({ name: z.string().min(1), label: z.string().min(1) });
const transitionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().min(1),
});

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/),
  description: z.string().optional().default(""),
  definition: z.string().min(1, "Definition JSON is required"),
  isActive: z.coerce.boolean().optional().default(true),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "workflows.create");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requirePermission(request, "workflows.create");
  const formData = await request.formData();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    definition: formData.get("definition"),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = workflowSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false as const, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  let defObj;
  try {
    defObj = JSON.parse(parsed.data.definition);
    const result = z
      .object({
        states: z.array(stateSchema).min(1),
        transitions: z.array(transitionSchema),
        initialState: z.string().min(1),
      })
      .safeParse(defObj);
    if (!result.success) {
      return json(
        { ok: false as const, errors: { definition: ["Invalid workflow definition structure"] } },
        { status: 400 },
      );
    }
  } catch {
    return json(
      { ok: false as const, errors: { definition: ["Invalid JSON"] } },
      { status: 400 },
    );
  }

  const [wf] = await db
    .insert(workflowDefinitions)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      states: defObj.states,
      transitions: defObj.transitions,
      initialState: defObj.initialState,
      isActive: parsed.data.isActive,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "workflow_definition",
    entityId: wf.id,
    details: { name: wf.name },
  });

  return redirect("/admin/workflows");
}

const exampleDef = JSON.stringify(
  {
    states: [
      { name: "draft", label: "Draft" },
      { name: "review", label: "Under Review" },
      { name: "approved", label: "Approved" },
      { name: "rejected", label: "Rejected" },
    ],
    transitions: [
      { from: "draft", to: "review", label: "Submit" },
      { from: "review", to: "approved", label: "Approve" },
      { from: "review", to: "rejected", label: "Reject" },
      { from: "rejected", to: "draft", label: "Revise" },
    ],
    initialState: "draft",
  },
  null,
  2,
);

export default function NewWorkflow() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/workflows" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to workflows
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">New Workflow Definition</h1>
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
            <label htmlFor="definition" className="label">Definition (JSON)</label>
            <textarea
              id="definition"
              name="definition"
              rows={16}
              required
              className="input font-mono text-sm"
              defaultValue={exampleDef}
            />
            {actionData?.errors?.definition && (
              <p className="mt-1 text-sm text-red-400">{actionData.errors.definition[0]}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-600" />
            <label htmlFor="isActive" className="text-sm text-surface-300">Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Creating..." : "Create Workflow"}
            </button>
            <Link to="/admin/workflows" className="btn-secondary">Cancel</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
