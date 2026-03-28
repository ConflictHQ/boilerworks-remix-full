import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Base columns shared across all tables ──────────────────────────

function baseColumns() {
  return {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by"),
  };
}

// ── Users ──────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    ...baseColumns(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    isSuperuser: boolean("is_superuser").notNull().default(false),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_unique").on(table.email),
  }),
);

// ── Sessions ───────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  ...baseColumns(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// ── Groups ─────────────────────────────────────────────────────────

export const groups = pgTable(
  "groups",
  {
    ...baseColumns(),
    name: text("name").notNull(),
    description: text("description").default(""),
  },
  (table) => ({
    nameIdx: uniqueIndex("groups_name_unique").on(table.name),
  }),
);

// ── Permissions ────────────────────────────────────────────────────

export const permissions = pgTable(
  "permissions",
  {
    ...baseColumns(),
    codename: text("codename").notNull(),
    name: text("name").notNull(),
    description: text("description").default(""),
  },
  (table) => ({
    codenameIdx: uniqueIndex("permissions_codename_unique").on(table.codename),
  }),
);

// ── User ↔ Group join ──────────────────────────────────────────────

export const userGroups = pgTable("user_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
});

// ── Group ↔ Permission join ────────────────────────────────────────

export const groupPermissions = pgTable("group_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id),
});

// ── Categories ─────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    ...baseColumns(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").default(""),
  },
  (table) => ({
    slugIdx: uniqueIndex("categories_slug_unique").on(table.slug),
  }),
);

// ── Products ───────────────────────────────────────────────────────

export const products = pgTable("products", {
  ...baseColumns(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  price: integer("price").notNull().default(0),
  categoryId: uuid("category_id").references(() => categories.id),
  isPublished: boolean("is_published").notNull().default(false),
});

// ── Form Definitions (Forms Engine) ────────────────────────────────

export const formDefinitions = pgTable("form_definitions", {
  ...baseColumns(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  schema: jsonb("schema").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
});

// ── Form Submissions ───────────────────────────────────────────────

export const formSubmissions = pgTable("form_submissions", {
  ...baseColumns(),
  formDefinitionId: uuid("form_definition_id")
    .notNull()
    .references(() => formDefinitions.id),
  data: jsonb("data").notNull().default({}),
  status: text("status").notNull().default("submitted"),
});

// ── Workflow Definitions (Workflow Engine) ──────────────────────────

export const workflowDefinitions = pgTable("workflow_definitions", {
  ...baseColumns(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  states: jsonb("states").notNull().default([]),
  transitions: jsonb("transitions").notNull().default([]),
  initialState: text("initial_state").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ── Workflow Instances ─────────────────────────────────────────────

export const workflowInstances = pgTable("workflow_instances", {
  ...baseColumns(),
  workflowDefinitionId: uuid("workflow_definition_id")
    .notNull()
    .references(() => workflowDefinitions.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  currentState: text("current_state").notNull(),
});

// ── Workflow Transitions Log ───────────────────────────────────────

export const workflowTransitions = pgTable("workflow_transitions", {
  ...baseColumns(),
  instanceId: uuid("instance_id")
    .notNull()
    .references(() => workflowInstances.id),
  fromState: text("from_state").notNull(),
  toState: text("to_state").notNull(),
  triggeredBy: uuid("triggered_by").references(() => users.id),
  comment: text("comment"),
});

// ── Audit Log ──────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
});

// ── Feature Toggles ────────────────────────────────────────────────

export const featureToggles = pgTable(
  "feature_toggles",
  {
    ...baseColumns(),
    key: text("key").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    description: text("description").default(""),
  },
  (table) => ({
    keyIdx: uniqueIndex("feature_toggles_key_unique").on(table.key),
  }),
);

// ── Relations ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
  sessions: many(sessions),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  userGroups: many(userGroups),
  groupPermissions: many(groupPermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  groupPermissions: many(groupPermissions),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, { fields: [userGroups.userId], references: [users.id] }),
  group: one(groups, { fields: [userGroups.groupId], references: [groups.id] }),
}));

export const groupPermissionsRelations = relations(groupPermissions, ({ one }) => ({
  group: one(groups, { fields: [groupPermissions.groupId], references: [groups.id] }),
  permission: one(permissions, {
    fields: [groupPermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  formDefinition: one(formDefinitions, {
    fields: [formSubmissions.formDefinitionId],
    references: [formDefinitions.id],
  }),
}));

export const workflowInstancesRelations = relations(workflowInstances, ({ one, many }) => ({
  workflowDefinition: one(workflowDefinitions, {
    fields: [workflowInstances.workflowDefinitionId],
    references: [workflowDefinitions.id],
  }),
  transitions: many(workflowTransitions),
}));

export const workflowTransitionsRelations = relations(workflowTransitions, ({ one }) => ({
  instance: one(workflowInstances, {
    fields: [workflowTransitions.instanceId],
    references: [workflowInstances.id],
  }),
}));
