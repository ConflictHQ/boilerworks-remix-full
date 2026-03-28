import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { users } from "~/db/schema";
import { isNull } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "users.manage");

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      isActive: users.isActive,
      isSuperuser: users.isSuperuser,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.createdAt);

  return json({ users: allUsers });
}

export default function UsersList() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Users</h1>
        <p className="mt-1 text-sm text-surface-400">Manage user accounts.</p>
      </div>

      <div className="mt-6 table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{user.displayName}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isSuperuser
                        ? "bg-brand-500/10 text-brand-400"
                        : "bg-surface-500/10 text-surface-400"
                    }`}
                  >
                    {user.isSuperuser ? "Superuser" : "User"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
