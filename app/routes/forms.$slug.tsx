import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { db } from "~/db/connection.server";
import { formDefinitions, formSubmissions } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logAudit } from "~/services/audit.server";
import { getUser } from "~/services/session.server";

interface FormField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const [formDef] = await db
    .select()
    .from(formDefinitions)
    .where(
      and(
        eq(formDefinitions.slug, params.slug!),
        eq(formDefinitions.isActive, true),
        isNull(formDefinitions.deletedAt),
      ),
    )
    .limit(1);

  if (!formDef) throw new Response("Form not found", { status: 404 });

  return json({ formDef });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const [formDef] = await db
    .select()
    .from(formDefinitions)
    .where(
      and(
        eq(formDefinitions.slug, params.slug!),
        eq(formDefinitions.isActive, true),
        isNull(formDefinitions.deletedAt),
      ),
    )
    .limit(1);

  if (!formDef) throw new Response("Form not found", { status: 404 });

  const schema = formDef.schema as { fields: FormField[] };
  const formData = await request.formData();
  const errors: Record<string, string[]> = {};
  const data: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const value = formData.get(field.name);
    if (field.required && (!value || String(value).trim() === "")) {
      errors[field.name] = [`${field.label} is required`];
    } else {
      data[field.name] = field.type === "checkbox" ? value === "on" : value;
    }

    if (field.type === "email" && value) {
      const emailResult = z.string().email().safeParse(value);
      if (!emailResult.success) {
        errors[field.name] = ["Invalid email address"];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return json({ ok: false as const, errors }, { status: 400 });
  }

  const user = await getUser(request);

  const [submission] = await db
    .insert(formSubmissions)
    .values({
      formDefinitionId: formDef.id,
      data,
      status: "submitted",
      createdBy: user?.id,
    })
    .returning();

  await logAudit({
    userId: user?.id,
    action: "submit",
    entityType: "form_submission",
    entityId: submission.id,
    details: { formName: formDef.name },
  });

  return json({ ok: true as const, errors: null });
}

function renderField(field: FormField, errors?: string[]) {
  const baseProps = {
    id: field.name,
    name: field.name,
    required: field.required,
    className: "input",
  };

  let input;
  switch (field.type) {
    case "textarea":
      input = <textarea {...baseProps} rows={4} />;
      break;
    case "checkbox":
      input = (
        <div className="flex items-center gap-2">
          <input
            {...baseProps}
            type="checkbox"
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-600"
          />
          <label htmlFor={field.name} className="text-sm text-surface-300">
            {field.label}
          </label>
        </div>
      );
      return (
        <div key={field.name}>
          {input}
          {errors && <p className="mt-1 text-sm text-red-400">{errors[0]}</p>}
        </div>
      );
    case "select":
      input = (
        <select {...baseProps}>
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
      break;
    default:
      input = <input {...baseProps} type={field.type} />;
  }

  return (
    <div key={field.name}>
      <label htmlFor={field.name} className="label">
        {field.label} {field.required && <span className="text-red-400">*</span>}
      </label>
      {input}
      {errors && <p className="mt-1 text-sm text-red-400">{errors[0]}</p>}
    </div>
  );
}

export default function PublicForm() {
  const { formDef } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const schema = formDef.schema as { fields: FormField[] };

  if (actionData?.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold text-surface-100">Thank you!</h1>
          <p className="mt-2 text-surface-400">Your submission has been received.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-surface-100">{formDef.name}</h1>
        {formDef.description && (
          <p className="mt-1 text-sm text-surface-400">{formDef.description}</p>
        )}

        <div className="card mt-6">
          <Form method="post" className="space-y-4">
            {schema.fields.map((field) => renderField(field, actionData?.errors?.[field.name]))}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
