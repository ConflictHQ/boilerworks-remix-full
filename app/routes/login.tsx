import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/db/connection.server";
import { users } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createSession, getUser } from "~/services/session.server";
import { logAudit } from "~/services/audit.server";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) return redirect("/admin");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = { email: formData.get("email"), password: formData.get("password") };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { ok: false as const, errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true), isNull(users.deletedAt)))
    .limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return json(
      { ok: false as const, errors: { email: ["Invalid email or password"] } },
      { status: 401 },
    );
  }

  await logAudit({
    userId: user.id,
    action: "login",
    entityType: "session",
    details: { ip: request.headers.get("x-forwarded-for") },
  });

  const cookie = await createSession(user.id, request);
  return redirect("/admin", { headers: { "Set-Cookie": cookie } });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Boilerworks" className="mx-auto h-12 w-12" />
          <h1 className="mt-4 text-2xl font-bold text-surface-100">Sign in</h1>
          <p className="mt-1 text-sm text-surface-400">Boilerworks Admin</p>
        </div>

        <div className="card">
          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="admin@boilerworks.dev"
              />
              {actionData?.errors?.email && (
                <p className="mt-1 text-sm text-red-400">{actionData.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="Password"
              />
              {actionData?.errors?.password && (
                <p className="mt-1 text-sm text-red-400">{actionData.errors.password[0]}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
