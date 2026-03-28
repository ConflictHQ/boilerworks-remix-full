import { describe, it, expect } from "vitest";
import * as schema from "~/db/schema";

describe("database schema", () => {
  it("exports users table", () => {
    expect(schema.users).toBeDefined();
  });

  it("exports sessions table", () => {
    expect(schema.sessions).toBeDefined();
  });

  it("exports groups table", () => {
    expect(schema.groups).toBeDefined();
  });

  it("exports permissions table", () => {
    expect(schema.permissions).toBeDefined();
  });

  it("exports userGroups join table", () => {
    expect(schema.userGroups).toBeDefined();
  });

  it("exports groupPermissions join table", () => {
    expect(schema.groupPermissions).toBeDefined();
  });

  it("exports products table", () => {
    expect(schema.products).toBeDefined();
  });

  it("exports categories table", () => {
    expect(schema.categories).toBeDefined();
  });

  it("exports formDefinitions table", () => {
    expect(schema.formDefinitions).toBeDefined();
  });

  it("exports formSubmissions table", () => {
    expect(schema.formSubmissions).toBeDefined();
  });

  it("exports workflowDefinitions table", () => {
    expect(schema.workflowDefinitions).toBeDefined();
  });

  it("exports workflowInstances table", () => {
    expect(schema.workflowInstances).toBeDefined();
  });

  it("exports workflowTransitions table", () => {
    expect(schema.workflowTransitions).toBeDefined();
  });

  it("exports auditLog table", () => {
    expect(schema.auditLog).toBeDefined();
  });

  it("exports featureToggles table", () => {
    expect(schema.featureToggles).toBeDefined();
  });

  it("exports all relation definitions", () => {
    expect(schema.usersRelations).toBeDefined();
    expect(schema.groupsRelations).toBeDefined();
    expect(schema.permissionsRelations).toBeDefined();
    expect(schema.categoriesRelations).toBeDefined();
    expect(schema.productsRelations).toBeDefined();
    expect(schema.formSubmissionsRelations).toBeDefined();
    expect(schema.workflowInstancesRelations).toBeDefined();
    expect(schema.workflowTransitionsRelations).toBeDefined();
  });
});
