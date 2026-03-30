import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, Link, useNavigation } from "@remix-run/react";
import { db } from "~/db/connection.server";
import {
  workflowDefinitions,
  workflowInstances,
  workflowTransitions as wfTransitionsTable,
} from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";
import { transitionWorkflow, getAvailableTransitions } from "~/services/workflow.server";

interface AvailableTransition {
  from: string;
  to: string;
  label: string;
  toLabel: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requirePermission(request, "workflows.read");

  const [wf] = await db
    .select()
    .from(workflowDefinitions)
    .where(and(eq(workflowDefinitions.id, params.id!), isNull(workflowDefinitions.deletedAt)))
    .limit(1);

  if (!wf) throw new Response("Not Found", { status: 404 });

  const instances = await db
    .select()
    .from(workflowInstances)
    .where(eq(workflowInstances.workflowDefinitionId, params.id!))
    .orderBy(workflowInstances.createdAt);

  const instancesWithTransitions = await Promise.all(
    instances.map(async (inst) => {
      const available = await getAvailableTransitions(inst.id);
      const history = await db
        .select()
        .from(wfTransitionsTable)
        .where(eq(wfTransitionsTable.instanceId, inst.id))
        .orderBy(wfTransitionsTable.createdAt);
      return { ...inst, availableTransitions: available, history };
    }),
  );

  return json({ workflow: wf, instances: instancesWithTransitions });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requirePermission(request, "workflows.transition");
  const formData = await request.formData();
  const instanceId = formData.get("instanceId") as string;
  const toState = formData.get("toState") as string;
  const comment = (formData.get("comment") as string) || undefined;

  try {
    await transitionWorkflow({ instanceId, toState, userId: user.id, comment });
    return json({ ok: true });
  } catch (err) {
    return json(
      { ok: false, error: err instanceof Error ? err.message : "Transition failed" },
      { status: 400 },
    );
  }
}

export default function WorkflowInstances() {
  const { workflow, instances } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/workflows" className="text-sm text-surface-400 hover:text-surface-200">
          &larr; Back to workflows
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-surface-100">Instances: {workflow.name}</h1>
        <p className="mt-1 text-sm text-surface-400">{instances.length} instance(s)</p>
      </div>

      <div className="space-y-4">
        {instances.map((inst) => (
          <div key={inst.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm text-surface-400">Entity:</span>{" "}
                <span className="text-sm text-surface-200">
                  {inst.entityType} / {inst.entityId}
                </span>
              </div>
              <span className="inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-400">
                {inst.currentState}
              </span>
            </div>

            {(inst.availableTransitions as AvailableTransition[]).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {(inst.availableTransitions as AvailableTransition[]).map((t) => (
                  <Form key={t.to} method="post" className="inline">
                    <input type="hidden" name="instanceId" value={inst.id} />
                    <input type="hidden" name="toState" value={t.to} />
                    <button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="btn-secondary text-xs"
                    >
                      {t.label}
                    </button>
                  </Form>
                ))}
              </div>
            )}

            {inst.history.length > 0 && (
              <div className="mt-3 border-t border-surface-800 pt-3">
                <p className="text-xs font-medium text-surface-500 mb-2">Transition History</p>
                <div className="space-y-1">
                  {inst.history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs text-surface-400">
                      <span>{h.fromState}</span>
                      <span className="text-surface-600">&rarr;</span>
                      <span>{h.toState}</span>
                      {h.comment && <span className="text-surface-500">({h.comment})</span>}
                      <span className="ml-auto text-surface-600">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {instances.length === 0 && (
          <div className="card text-center text-sm text-surface-500">
            No instances for this workflow yet.
          </div>
        )}
      </div>
    </div>
  );
}
