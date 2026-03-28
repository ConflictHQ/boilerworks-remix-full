import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "~/db/connection.server";
import { sessions, users, userGroups, groupPermissions, permissions } from "~/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secrets: [SESSION_SECRET],
  },
});

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, request: Request) {
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  const session = await sessionStorage.getSession();
  session.set("tokenHash", tokenHash);

  return sessionStorage.commitSession(session);
}

export async function destroySession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const tokenHash = session.get("tokenHash");

  if (tokenHash) {
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  return sessionStorage.destroySession(session);
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  isSuperuser: boolean;
  permissions: string[];
}

export async function getUser(request: Request): Promise<AuthUser | null> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const tokenHash = session.get("tokenHash");
  if (!tokenHash) return null;

  const [dbSession] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
        isNull(sessions.deletedAt),
      ),
    )
    .limit(1);

  if (!dbSession) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, dbSession.userId), eq(users.isActive, true), isNull(users.deletedAt)))
    .limit(1);

  if (!user) return null;

  // Load permissions through groups
  const userPerms = await db
    .select({ codename: permissions.codename })
    .from(userGroups)
    .innerJoin(groupPermissions, eq(userGroups.groupId, groupPermissions.groupId))
    .innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
    .where(eq(userGroups.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isActive: user.isActive,
    isSuperuser: user.isSuperuser,
    permissions: userPerms.map((p) => p.codename),
  };
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  return user;
}

export async function requirePermission(request: Request, permission: string): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.isSuperuser) return user;
  if (!user.permissions.includes(permission)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!user.isSuperuser && !user.permissions.includes("admin.access")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
