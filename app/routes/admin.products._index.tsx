import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { products, categories } from "~/db/schema";
import { isNull, eq } from "drizzle-orm";
import { requirePermission } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "products.read");

  const items = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      isPublished: products.isPublished,
      categoryName: categories.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(isNull(products.deletedAt))
    .orderBy(products.createdAt);

  return json({ products: items });
}

export default function ProductsList() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Products</h1>
          <p className="mt-1 text-sm text-surface-400">Manage your product catalogue.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          New Product
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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-surface-800/30">
                <td className="px-4 py-3 text-sm text-surface-100">{product.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">
                  {product.categoryName || "Uncategorized"}
                </td>
                <td className="px-4 py-3 text-sm text-surface-400">
                  ${(product.price / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.isPublished
                        ? "bg-green-500/10 text-green-400"
                        : "bg-surface-500/10 text-surface-400"
                    }`}
                  >
                    {product.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
