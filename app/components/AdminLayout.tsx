import { Link, NavLink, Form, useLocation } from "@remix-run/react";
import type { AuthUser } from "~/services/session.server";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/admin/items", label: "Items", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { to: "/admin/categories", label: "Categories", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { to: "/admin/forms", label: "Forms", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "/admin/workflows", label: "Workflows", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { to: "/admin/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
];

function SvgIcon({ path }: { path: string }) {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export function AdminLayout({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-surface-700 bg-surface-900">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-surface-700 px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Boilerworks" className="h-8 w-8" />
            <span className="text-lg font-bold text-brand-400">Boilerworks</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600/20 text-brand-400"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                }`}
              >
                <SvgIcon path={item.icon} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-surface-700 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-surface-200">{user.displayName}</p>
              <p className="truncate text-xs text-surface-500">{user.email}</p>
            </div>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="rounded-md p-1.5 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
                title="Sign out"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </Form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
