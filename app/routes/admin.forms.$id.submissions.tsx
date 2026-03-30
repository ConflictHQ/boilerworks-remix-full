import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { formDefinitions, formSubmissions } from "~/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requirePermission(request, "forms.read");

  const [formDef] = await db
    .select()
    .from(formDefinitions)
    .where(and(eq(formDefinitions.id, params.id!), isNull(formDefinitions.deletedAt)))
    .limit(1);

  if (!formDef) throw new Response("Not Found", { status: 404 });

  const submissions = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.formDefinitionId, params.id!))
    .orderBy(formSubmissions.createdAt);

  return json({ formDef, submissions });
}

export default function FormSubmissionsList() {
  const { formDef, submissions } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/forms" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to forms
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">Submissions: {formDef.name}</h1>
        <p className="mt-1 text-sm text-surface-400">{submissions.length} submission(s)</p>
      </div>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  sub.status === "submitted"
                    ? "bg-blue-500/10 text-blue-400"
                    : sub.status === "reviewed"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-surface-500/10 text-surface-400"
                }`}
              >
                {sub.status}
              </span>
              <span className="text-xs text-surface-500">
                {new Date(sub.createdAt).toLocaleString()}
              </span>
            </div>
            <pre className="overflow-auto rounded bg-surface-800 p-3 text-xs text-surface-300">
              {JSON.stringify(sub.data, null, 2)}
            </pre>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="card text-center text-sm text-surface-500">No submissions yet.</div>
        )}
      </div>
    </div>
  );
}
