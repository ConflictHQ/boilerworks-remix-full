import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { formDefinitions } from "~/db/schema";
import { isNull } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "forms.read");

  const forms = await db
    .select()
    .from(formDefinitions)
    .where(isNull(formDefinitions.deletedAt))
    .orderBy(formDefinitions.createdAt);

  return json({ forms });
}

export default function FormsList() {
  const { forms } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Forms</h1>
          <p className="mt-1 text-sm text-surface-400">Define and manage dynamic forms.</p>
        </div>
        <Link to="/admin/forms/new" className="btn-primary">
          New Form
        </Link>
      </div>

      <div className="mt-6 table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-surface-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {forms.map((form) => (
              <tr key={form.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{form.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{form.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      form.isActive
                        ? "bg-green-500/10 text-green-400"
                        : "bg-surface-500/10 text-surface-400"
                    }`}
                  >
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    to={`/admin/forms/${form.id}`}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/forms/${form.id}/submissions`}
                    className="text-sm text-surface-400 hover:text-surface-200"
                  >
                    Submissions
                  </Link>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-surface-500">
                  No forms defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
