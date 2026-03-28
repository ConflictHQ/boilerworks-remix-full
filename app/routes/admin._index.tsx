import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/db/connection.server";
import { products, categories, users, formSubmissions, workflowInstances } from "~/db/schema";
import { isNull, count } from "drizzle-orm";
import { requireAdmin } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const [productCount] = await db
    .select({ count: count() })
    .from(products)
    .where(isNull(products.deletedAt));
  const [categoryCount] = await db
    .select({ count: count() })
    .from(categories)
    .where(isNull(categories.deletedAt));
  const [userCount] = await db
    .select({ count: count() })
    .from(users)
    .where(isNull(users.deletedAt));
  const [submissionCount] = await db.select({ count: count() }).from(formSubmissions);
  const [instanceCount] = await db.select({ count: count() }).from(workflowInstances);

  return json({
    stats: {
      products: productCount.count,
      categories: categoryCount.count,
      users: userCount.count,
      submissions: submissionCount.count,
      workflows: instanceCount.count,
    },
  });
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-sm text-surface-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-surface-100">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
      <p className="mt-1 text-sm text-surface-400">Overview of your application.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Products" value={stats.products} />
        <StatCard label="Categories" value={stats.categories} />
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Form Submissions" value={stats.submissions} />
        <StatCard label="Workflow Instances" value={stats.workflows} />
      </div>
    </div>
  );
}
