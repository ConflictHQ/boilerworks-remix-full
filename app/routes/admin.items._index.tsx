import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { items as itemsTable, categories } from "~/db/schema";
import { isNull, eq } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "items.read");

  const items = await db
    .select({
      id: itemsTable.id,
      name: itemsTable.name,
      slug: itemsTable.slug,
      price: itemsTable.price,
      isPublished: itemsTable.isPublished,
      categoryName: categories.name,
      createdAt: itemsTable.createdAt,
    })
    .from(itemsTable)
    .leftJoin(categories, eq(itemsTable.categoryId, categories.id))
    .where(isNull(itemsTable.deletedAt))
    .orderBy(itemsTable.createdAt);

  return json({ items: items });
}

export default function ItemsList() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Items</h1>
          <p className="mt-1 text-sm text-surface-400">Manage your item catalogue.</p>
        </div>
        <Link to="/admin/items/new" className="btn-primary">
          New Item
        </Link>
      </div>

      <div className="mt-6 table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-surface-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{item.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">
                  {item.categoryName || "Uncategorized"}
                </td>
                <td className="px-4 py-3 text-sm text-surface-400">
                  ${(item.price / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.isPublished
                        ? "bg-green-500/10 text-green-400"
                        : "bg-surface-500/10 text-surface-400"
                    }`}
                  >
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/items/${item.id}`}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-500">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
