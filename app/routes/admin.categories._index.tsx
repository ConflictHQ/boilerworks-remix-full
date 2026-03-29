import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { categories } from "~/db/schema";
import { isNull } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "categories.read");

  const items = await db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(categories.createdAt);

  return json({ categories: items });
}

export default function CategoriesList() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Categories</h1>
          <p className="mt-1 text-sm text-surface-400">Organize items into categories.</p>
        </div>
        <Link to="/admin/categories/new" className="btn-primary">
          New Category
        </Link>
      </div>

      <div className="mt-6 table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Description</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-surface-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{category.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{category.slug}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{category.description}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/categories/${category.id}`}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-surface-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
