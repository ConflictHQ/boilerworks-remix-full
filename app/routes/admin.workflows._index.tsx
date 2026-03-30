import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { workflowDefinitions, workflowInstances } from "~/db/schema";
import { isNull, eq, count } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "workflows.read");

  const workflows = await db
    .select()
    .from(workflowDefinitions)
    .where(isNull(workflowDefinitions.deletedAt))
    .orderBy(workflowDefinitions.createdAt);

  const instanceCounts: Record<string, number> = {};
  for (const wf of workflows) {
    const [result] = await db
      .select({ count: count() })
      .from(workflowInstances)
      .where(eq(workflowInstances.workflowDefinitionId, wf.id));
    instanceCounts[wf.id] = result.count;
  }

  return json({ workflows, instanceCounts });
}

export default function WorkflowsList() {
  const { workflows, instanceCounts } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Workflows</h1>
          <p className="mt-1 text-sm text-surface-400">
            Define and manage state machine workflows.
          </p>
        </div>
        <Link to="/admin/workflows/new" className="btn-primary">
          New Workflow
        </Link>
      </div>

      <div className="mt-6 table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">
                Initial State
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">
                Instances
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-surface-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {workflows.map((wf) => (
              <tr key={wf.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{wf.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{wf.initialState}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{instanceCounts[wf.id] || 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      wf.isActive
                        ? "bg-green-500/10 text-green-400"
                        : "bg-surface-500/10 text-surface-400"
                    }`}
                  >
                    {wf.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    to={`/admin/workflows/${wf.id}`}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/workflows/${wf.id}/instances`}
                    className="text-sm text-surface-400 hover:text-surface-200"
                  >
                    Instances
                  </Link>
                </td>
              </tr>
            ))}
            {workflows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-500">
                  No workflows defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
