import { db } from "./connection.server";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function seed() {
  console.log("Seeding database...");

  // ── Permissions ────────────────────────────────────────────────
  const permissionDefs = [
    { codename: "products.create", name: "Create products" },
    { codename: "products.read", name: "Read products" },
    { codename: "products.update", name: "Update products" },
    { codename: "products.delete", name: "Delete products" },
    { codename: "categories.create", name: "Create categories" },
    { codename: "categories.read", name: "Read categories" },
    { codename: "categories.update", name: "Update categories" },
    { codename: "categories.delete", name: "Delete categories" },
    { codename: "forms.create", name: "Create form definitions" },
    { codename: "forms.read", name: "Read form definitions" },
    { codename: "forms.update", name: "Update form definitions" },
    { codename: "forms.delete", name: "Delete form definitions" },
    { codename: "forms.submit", name: "Submit forms" },
    { codename: "workflows.create", name: "Create workflow definitions" },
    { codename: "workflows.read", name: "Read workflow definitions" },
    { codename: "workflows.update", name: "Update workflow definitions" },
    { codename: "workflows.delete", name: "Delete workflow definitions" },
    { codename: "workflows.transition", name: "Trigger workflow transitions" },
    { codename: "users.manage", name: "Manage users" },
    { codename: "admin.access", name: "Access admin panel" },
  ];

  const insertedPerms = [];
  for (const perm of permissionDefs) {
    const [row] = await db
      .insert(schema.permissions)
      .values({ id: uuidv4(), ...perm })
      .onConflictDoNothing()
      .returning();
    if (row) insertedPerms.push(row);
  }

  // ── Groups ─────────────────────────────────────────────────────
  const [adminGroup] = await db
    .insert(schema.groups)
    .values({ id: uuidv4(), name: "Administrators", description: "Full system access" })
    .onConflictDoNothing()
    .returning();

  const [editorGroup] = await db
    .insert(schema.groups)
    .values({ id: uuidv4(), name: "Editors", description: "Content management" })
    .onConflictDoNothing()
    .returning();

  const [viewerGroup] = await db
    .insert(schema.groups)
    .values({ id: uuidv4(), name: "Viewers", description: "Read-only access" })
    .onConflictDoNothing()
    .returning();

  // ── Group permissions ──────────────────────────────────────────
  if (adminGroup && insertedPerms.length > 0) {
    for (const perm of insertedPerms) {
      await db
        .insert(schema.groupPermissions)
        .values({ id: uuidv4(), groupId: adminGroup.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  if (editorGroup && insertedPerms.length > 0) {
    const editorPerms = insertedPerms.filter(
      (p) =>
        p.codename.startsWith("products.") ||
        p.codename.startsWith("categories.") ||
        p.codename.startsWith("forms.") ||
        p.codename === "admin.access",
    );
    for (const perm of editorPerms) {
      await db
        .insert(schema.groupPermissions)
        .values({ id: uuidv4(), groupId: editorGroup.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  if (viewerGroup && insertedPerms.length > 0) {
    const viewerPerms = insertedPerms.filter(
      (p) => p.codename.endsWith(".read") || p.codename === "admin.access",
    );
    for (const perm of viewerPerms) {
      await db
        .insert(schema.groupPermissions)
        .values({ id: uuidv4(), groupId: viewerGroup.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  // ── Users ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 10);

  const [adminUser] = await db
    .insert(schema.users)
    .values({
      id: uuidv4(),
      email: "admin@boilerworks.dev",
      passwordHash,
      displayName: "Admin",
      isSuperuser: true,
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [editorUser] = await db
    .insert(schema.users)
    .values({
      id: uuidv4(),
      email: "editor@boilerworks.dev",
      passwordHash,
      displayName: "Editor",
      isSuperuser: false,
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  // ── User ↔ Group ───────────────────────────────────────────────
  if (adminUser && adminGroup) {
    await db
      .insert(schema.userGroups)
      .values({ id: uuidv4(), userId: adminUser.id, groupId: adminGroup.id })
      .onConflictDoNothing();
  }

  if (editorUser && editorGroup) {
    await db
      .insert(schema.userGroups)
      .values({ id: uuidv4(), userId: editorUser.id, groupId: editorGroup.id })
      .onConflictDoNothing();
  }

  // ── Sample categories ──────────────────────────────────────────
  const [cat1] = await db
    .insert(schema.categories)
    .values({
      id: uuidv4(),
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and accessories",
      createdBy: adminUser?.id,
    })
    .onConflictDoNothing()
    .returning();

  const [cat2] = await db
    .insert(schema.categories)
    .values({
      id: uuidv4(),
      name: "Books",
      slug: "books",
      description: "Physical and digital books",
      createdBy: adminUser?.id,
    })
    .onConflictDoNothing()
    .returning();

  // ── Sample products ────────────────────────────────────────────
  if (cat1) {
    await db
      .insert(schema.products)
      .values({
        id: uuidv4(),
        name: "Wireless Keyboard",
        slug: "wireless-keyboard",
        description: "Ergonomic wireless keyboard",
        price: 7999,
        categoryId: cat1.id,
        isPublished: true,
        createdBy: adminUser?.id,
      })
      .onConflictDoNothing();
  }

  if (cat2) {
    await db
      .insert(schema.products)
      .values({
        id: uuidv4(),
        name: "TypeScript Handbook",
        slug: "typescript-handbook",
        description: "Comprehensive TypeScript reference",
        price: 3499,
        categoryId: cat2.id,
        isPublished: true,
        createdBy: adminUser?.id,
      })
      .onConflictDoNothing();
  }

  // ── Sample form definition ─────────────────────────────────────
  await db
    .insert(schema.formDefinitions)
    .values({
      id: uuidv4(),
      name: "Contact Form",
      slug: "contact",
      description: "Simple contact form",
      schema: {
        fields: [
          { name: "name", type: "text", label: "Name", required: true },
          { name: "email", type: "email", label: "Email", required: true },
          { name: "message", type: "textarea", label: "Message", required: true },
        ],
      },
      isActive: true,
      createdBy: adminUser?.id,
    })
    .onConflictDoNothing();

  // ── Sample workflow definition ─────────────────────────────────
  await db
    .insert(schema.workflowDefinitions)
    .values({
      id: uuidv4(),
      name: "Product Approval",
      slug: "product-approval",
      description: "Workflow for approving new products",
      states: [
        { name: "draft", label: "Draft" },
        { name: "pending_review", label: "Pending Review" },
        { name: "approved", label: "Approved" },
        { name: "rejected", label: "Rejected" },
      ],
      transitions: [
        { from: "draft", to: "pending_review", label: "Submit for Review" },
        { from: "pending_review", to: "approved", label: "Approve" },
        { from: "pending_review", to: "rejected", label: "Reject" },
        { from: "rejected", to: "draft", label: "Revise" },
      ],
      initialState: "draft",
      isActive: true,
      createdBy: adminUser?.id,
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
}
