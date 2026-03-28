import { describe, it, expect } from "vitest";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  isSuperuser: boolean;
  permissions: string[];
}

// Pure permission checking logic (same as used in requirePermission)
function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.isSuperuser) return true;
  return user.permissions.includes(permission);
}

function hasAdminAccess(user: AuthUser): boolean {
  if (user.isSuperuser) return true;
  return user.permissions.includes("admin.access");
}

const superuser: AuthUser = {
  id: "su-1",
  email: "admin@test.com",
  displayName: "Admin",
  isActive: true,
  isSuperuser: true,
  permissions: [],
};

const editor: AuthUser = {
  id: "ed-1",
  email: "editor@test.com",
  displayName: "Editor",
  isActive: true,
  isSuperuser: false,
  permissions: ["products.create", "products.read", "products.update", "admin.access"],
};

const viewer: AuthUser = {
  id: "vw-1",
  email: "viewer@test.com",
  displayName: "Viewer",
  isActive: true,
  isSuperuser: false,
  permissions: ["products.read", "categories.read"],
};

describe("permission checks", () => {
  it("superuser has all permissions implicitly", () => {
    expect(hasPermission(superuser, "products.create")).toBe(true);
    expect(hasPermission(superuser, "anything.at.all")).toBe(true);
    expect(hasPermission(superuser, "nonexistent")).toBe(true);
  });

  it("editor has only assigned permissions", () => {
    expect(hasPermission(editor, "products.create")).toBe(true);
    expect(hasPermission(editor, "products.read")).toBe(true);
    expect(hasPermission(editor, "products.delete")).toBe(false);
    expect(hasPermission(editor, "categories.create")).toBe(false);
  });

  it("viewer has only read permissions", () => {
    expect(hasPermission(viewer, "products.read")).toBe(true);
    expect(hasPermission(viewer, "categories.read")).toBe(true);
    expect(hasPermission(viewer, "products.create")).toBe(false);
    expect(hasPermission(viewer, "products.update")).toBe(false);
  });

  it("admin access check works", () => {
    expect(hasAdminAccess(superuser)).toBe(true);
    expect(hasAdminAccess(editor)).toBe(true);
    expect(hasAdminAccess(viewer)).toBe(false);
  });
});
