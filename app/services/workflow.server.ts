import { db } from "~/db/connection.server";
import { workflowDefinitions, workflowInstances, workflowTransitions } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logAudit } from "./audit.server";

interface WorkflowState {
  name: string;
  label: string;
}

interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
}

export async function createWorkflowInstance(params: {
  workflowSlug: string;
  entityType: string;
  entityId: string;
  userId?: string;
}) {
  const [definition] = await db
    .select()
    .from(workflowDefinitions)
    .where(
      and(
        eq(workflowDefinitions.slug, params.workflowSlug),
        eq(workflowDefinitions.isActive, true),
        isNull(workflowDefinitions.deletedAt),
      ),
    )
    .limit(1);

  if (!definition) throw new Error(`Workflow "${params.workflowSlug}" not found`);

  const [instance] = await db
    .insert(workflowInstances)
    .values({
      workflowDefinitionId: definition.id,
      entityType: params.entityType,
      entityId: params.entityId,
      currentState: definition.initialState,
      createdBy: params.userId,
    })
    .returning();

  await logAudit({
    userId: params.userId,
    action: "workflow.create_instance",
    entityType: params.entityType,
    entityId: params.entityId,
    details: { workflowSlug: params.workflowSlug, state: definition.initialState },
  });

  return instance;
}

export async function transitionWorkflow(params: {
  instanceId: string;
  toState: string;
  userId?: string;
  comment?: string;
}) {
  const [instance] = await db
    .select({
      id: workflowInstances.id,
      currentState: workflowInstances.currentState,
      workflowDefinitionId: workflowInstances.workflowDefinitionId,
    })
    .from(workflowInstances)
    .where(and(eq(workflowInstances.id, params.instanceId), isNull(workflowInstances.deletedAt)))
    .limit(1);

  if (!instance) throw new Error("Workflow instance not found");

  const [definition] = await db
    .select()
    .from(workflowDefinitions)
    .where(eq(workflowDefinitions.id, instance.workflowDefinitionId))
    .limit(1);

  if (!definition) throw new Error("Workflow definition not found");

  const transitions = definition.transitions as WorkflowTransition[];
  const valid = transitions.find(
    (t) => t.from === instance.currentState && t.to === params.toState,
  );

  if (!valid) {
    throw new Error(`Invalid transition from "${instance.currentState}" to "${params.toState}"`);
  }

  const fromState = instance.currentState;

  await db
    .update(workflowInstances)
    .set({
      currentState: params.toState,
      updatedAt: new Date(),
      updatedBy: params.userId,
    })
    .where(eq(workflowInstances.id, params.instanceId));

  const [transition] = await db
    .insert(workflowTransitions)
    .values({
      instanceId: params.instanceId,
      fromState,
      toState: params.toState,
      triggeredBy: params.userId,
      comment: params.comment,
    })
    .returning();

  await logAudit({
    userId: params.userId,
    action: "workflow.transition",
    entityType: "workflow_instance",
    entityId: params.instanceId,
    details: { from: fromState, to: params.toState, comment: params.comment },
  });

  return transition;
}

export async function getAvailableTransitions(instanceId: string) {
  const [instance] = await db
    .select()
    .from(workflowInstances)
    .where(and(eq(workflowInstances.id, instanceId), isNull(workflowInstances.deletedAt)))
    .limit(1);

  if (!instance) return [];

  const [definition] = await db
    .select()
    .from(workflowDefinitions)
    .where(eq(workflowDefinitions.id, instance.workflowDefinitionId))
    .limit(1);

  if (!definition) return [];

  const transitions = definition.transitions as WorkflowTransition[];
  const states = definition.states as WorkflowState[];

  return transitions
    .filter((t) => t.from === instance.currentState)
    .map((t) => ({
      ...t,
      toLabel: states.find((s) => s.name === t.to)?.label || t.to,
    }));
}
