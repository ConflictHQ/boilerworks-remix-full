import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/services/session.server";
import { AdminLayout } from "~/components/AdminLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  return json({ user });
}

export default function AdminRoot() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <AdminLayout user={user}>
      <Outlet />
    </AdminLayout>
  );
}
